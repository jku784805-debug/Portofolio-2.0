import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`;
const ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ── Helpers date ──

export function parseDateFields(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return { jour: JOURS[d.getDay()], mois: MOIS[d.getMonth()], annee: d.getFullYear() };
}

// ── Google Calendar (via Supabase Edge Function) ──

async function calendarCall(body) {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.warn('[Calendar]', e.message);
    return null;
  }
}

async function calendarCreate(seance) {
  const r = await calendarCall({ action: 'create', seance });
  return r?.eventId || null;
}

async function calendarUpdate(eventId, seance) {
  if (!eventId) return;
  await calendarCall({ action: 'update', eventId, seance });
}

async function calendarDelete(eventId) {
  if (!eventId) return;
  await calendarCall({ action: 'delete', eventId });
}

// ── Séances CRUD ──

/**
 * Récupère les séances avec filtres optionnels et pagination.
 * @returns {{ data: Seance[], count: number }}
 */
export async function getSeances({
  mois, annee, statutPaiement, statutSeance, client,
  page = 0, pageSize = 20,
} = {}) {
  let q = supabase
    .from('seances')
    .select('*', { count: 'exact' })
    .order('date_seance', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (mois)           q = q.eq('mois', mois);
  if (annee)          q = q.eq('annee', annee);
  if (statutPaiement) q = q.eq('statut_paiement', statutPaiement);
  if (statutSeance)   q = q.eq('statut_seance', statutSeance);
  if (client?.trim()) {
    const like = `%${client.trim()}%`;
    q = q.or(`client_nom.ilike.${like},client_prenom.ilike.${like},client_email.ilike.${like}`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/**
 * Crée une séance en base + crée un événement Google Calendar.
 */
export async function createSeance(payload) {
  const dateFields = parseDateFields(payload.date_seance);
  const full = { ...payload, ...dateFields };

  const { data, error } = await supabase
    .from('seances')
    .insert([full])
    .select()
    .single();

  if (error) throw error;

  const eventId = await calendarCreate(data);
  if (eventId) {
    await supabase.from('seances').update({ google_event_id: eventId }).eq('id', data.id);
    data.google_event_id = eventId;
  }
  return data;
}

/**
 * Met à jour une séance. Si date/heure changent, met à jour l'événement Calendar.
 */
export async function updateSeance(id, payload) {
  if (payload.date_seance) {
    Object.assign(payload, parseDateFields(payload.date_seance));
  }

  const { data: before } = await supabase
    .from('seances').select('google_event_id').eq('id', id).single();

  const { data, error } = await supabase
    .from('seances').update(payload).eq('id', id).select().single();

  if (error) throw error;

  const touchesTime = payload.date_seance || payload.heure_debut || payload.heure_fin;
  if (touchesTime && before?.google_event_id) {
    await calendarUpdate(before.google_event_id, data);
  }
  return data;
}

/** Marque une séance comme payée. */
export async function markAsPaid(id) {
  return updateSeance(id, { statut_paiement: 'payé' });
}

/** Marque une séance comme terminée. */
export async function markAsTerminee(id) {
  return updateSeance(id, { statut_seance: 'terminée' });
}

/**
 * Annule une séance + supprime l'événement Google Calendar.
 */
export async function cancelSeance(id) {
  const { data: s } = await supabase
    .from('seances').select('google_event_id').eq('id', id).single();

  const result = await updateSeance(id, { statut_seance: 'annulée' });
  await calendarDelete(s?.google_event_id);
  return result;
}

/**
 * Supprime définitivement une séance + supprime l'événement Google Calendar.
 */
export async function deleteSeance(id) {
  const { data: s } = await supabase
    .from('seances').select('google_event_id').eq('id', id).single();

  const { error } = await supabase.from('seances').delete().eq('id', id);
  if (error) throw error;
  await calendarDelete(s?.google_event_id);
}
