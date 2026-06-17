// Supabase Edge Function — Google Calendar integration
// Runtime: Deno (Supabase Edge Runtime)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

// ── JWT pour Service Account Google ──

async function getGoogleAccessToken(): Promise<string> {
  const email      = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!;
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // Importer la clé privée PKCS8
  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signingInput}.${sig}`;

  // Échanger le JWT contre un access_token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const json = await res.json();
  if (!json.access_token) throw new Error(`Google Auth failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

// ── Construire l'événement Calendar ──

function endTime(dateStr: string, heureDebut: string, heureFin?: string): string {
  if (heureFin) return `${dateStr}T${heureFin}:00`;
  const [h, m] = heureDebut.split(':').map(Number);
  return `${dateStr}T${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function buildEvent(s: Record<string, unknown>): object {
  const dateStr = (s.date_seance as string).split('T')[0];
  const start   = `${dateStr}T${s.heure_debut}:00`;
  const end     = endTime(dateStr, s.heure_debut as string, s.heure_fin as string);

  const payStatus: Record<string, string> = {
    payé: '✅ Payé', non_payé: '❌ Non payé', en_attente: '⏳ En attente',
  };

  return {
    summary: `📸 ${s.type_seance || 'Séance'} — ${s.client_prenom} ${s.client_nom}`,
    description: [
      `👤 ${s.client_prenom} ${s.client_nom}`,
      `✉ ${s.client_email || '—'}`,
      `📌 Type : ${s.type_seance || '—'}`,
      `💶 Prix : ${s.prix || 0} €  ${payStatus[s.statut_paiement as string] || ''}`,
      s.notes_interne ? `\n📝 Notes : ${s.notes_interne}` : '',
    ].filter(Boolean).join('\n'),
    start: { dateTime: start, timeZone: 'Europe/Paris' },
    end:   { dateTime: end,   timeZone: 'Europe/Paris' },
    ...(s.client_email
      ? { attendees: [{ email: s.client_email, displayName: `${s.client_prenom} ${s.client_nom}` }] }
      : {}),
    // Couleur : vert si payé, rouge sinon
    colorId: s.statut_paiement === 'payé' ? '2' : '11',
  };
}

// ── Handler principal ──

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  try {
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
    if (!calendarId) return json({ error: 'GOOGLE_CALENDAR_ID non configuré' }, 500);

    const { action, seance, eventId } = await req.json();
    const token = await getGoogleAccessToken();

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    // ── Créer ──
    if (action === 'create') {
      const res  = await fetch(base, { method: 'POST', headers, body: JSON.stringify(buildEvent(seance)) });
      const data = await res.json();
      if (!res.ok) return json({ error: data.error?.message || 'Erreur Calendar' }, 502);
      return json({ eventId: data.id });
    }

    // ── Modifier ──
    if (action === 'update' && eventId) {
      const res = await fetch(`${base}/${eventId}`, { method: 'PATCH', headers, body: JSON.stringify(buildEvent(seance)) });
      if (!res.ok) {
        const err = await res.json();
        return json({ error: err.error?.message || 'Erreur mise à jour' }, 502);
      }
      return json({ ok: true });
    }

    // ── Supprimer ──
    if (action === 'delete' && eventId) {
      const res = await fetch(`${base}/${eventId}`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 410) { // 410 = déjà supprimé
        return json({ error: 'Erreur suppression Calendar' }, 502);
      }
      return json({ ok: true });
    }

    return json({ error: 'Action invalide' }, 400);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[google-calendar]', msg);
    return json({ error: msg }, 500);
  }
});
