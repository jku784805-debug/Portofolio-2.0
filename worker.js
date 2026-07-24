// ── Cloudflare Worker ─────────────────────────────────────────────────────────
// Routes:
//   GET  /api/data?key=…       read   (public)
//   POST /api/data             write  { key, value } (requires X-Admin-Token)
//   DEL  /api/data?key=…       delete (requires X-Admin-Token)
//   POST /api/auth             verify token → { ok: true/false }
//   GET  /api/instagram        Instagram feed proxy (cached 1h)
//   *    SPA fallback → /index.html

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token' };

// ── Auth helpers ──────────────────────────────────────────────────────────────
function isAuthorized(request, env) {
  if (!env.ADMIN_PASSWORD) return true;                    // no password set → open
  const tok = request.headers.get('X-Admin-Token') || '';
  return tok === env.ADMIN_PASSWORD;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...CORS, ...extra },
  });
}

// ── KV data API ───────────────────────────────────────────────────────────────
async function handleData(request, env) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' } });
  }

  // ── GET /api/data?key=pf-pub-decouvrir ──
  if (request.method === 'GET') {
    const key = url.searchParams.get('key');
    if (!key) return json({ error: 'key required' }, 400);
    if (!env.SITE_KV) return json(null);                   // KV not configured → client falls back to IDB
    const raw = await env.SITE_KV.get(key, { type: 'text' });
    if (!raw) return json(null);
    try { return json(JSON.parse(raw)); } catch { return json(null); }
  }

  // ── POST /api/data { key, value } ──
  if (request.method === 'POST') {
    if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
    if (!env.SITE_KV) return json({ ok: false, error: 'KV not configured' }, 503);
    const { key, value } = await request.json().catch(() => ({}));
    if (!key) return json({ error: 'key required' }, 400);
    await env.SITE_KV.put(key, JSON.stringify(value));
    return json({ ok: true });
  }

  // ── DELETE /api/data?key=… ──
  if (request.method === 'DELETE') {
    if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
    if (!env.SITE_KV) return json({ ok: false, error: 'KV not configured' }, 503);
    const key = url.searchParams.get('key');
    if (!key) return json({ error: 'key required' }, 400);
    await env.SITE_KV.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
}

// ── Auth endpoint ─────────────────────────────────────────────────────────────
function handleAuth(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ ok: true, note: 'no password set' });
  const ok = isAuthorized(request, env);
  return json({ ok }, ok ? 200 : 401);
}

// ── Instagram API proxy ────────────────────────────────────────────────────────
const IG = 'https://graph.instagram.com';
const PROFILE_FIELDS = 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website';
const MEDIA_FIELDS   = 'id,media_type,media_url,thumbnail_url,caption,timestamp,permalink';

async function fetchIG(token, limit = 12) {
  const [pRes, mRes] = await Promise.all([
    fetch(`${IG}/me?fields=${PROFILE_FIELDS}&access_token=${token}`),
    fetch(`${IG}/me/media?fields=${MEDIA_FIELDS}&limit=${limit}&access_token=${token}`),
  ]);
  if (!pRes.ok) {
    const e = await pRes.json().catch(() => ({}));
    throw new Error(e.error?.message || `HTTP ${pRes.status}`);
  }
  const profile  = await pRes.json();
  const mediaJson = mRes.ok ? await mRes.json() : { data: [] };
  return { profile, media: mediaJson.data || [] };
}

async function handleIG(env) {
  const hdrs = { ...JSON_HEADERS, ...CORS };
  const token = env.INSTAGRAM_TOKEN || null;
  if (!token) return new Response(JSON.stringify({ configured: false, profile: null, media: [] }), { headers: hdrs });

  const cache    = caches.default;
  const cacheKey = new Request('https://ig-portfolio-cache.local/v2');
  const hit      = await cache.match(cacheKey).catch(() => null);
  if (hit) return hit;

  try {
    const data = await fetchIG(token);
    const resp = new Response(JSON.stringify({ configured: true, ...data }), {
      headers: { ...hdrs, 'Cache-Control': 'public, max-age=3600' },
    });
    cache.put(cacheKey, resp.clone()).catch(() => {});
    return resp;
  } catch (err) {
    if (/expired|Invalid OAuth/i.test(err.message)) {
      try {
        const rRes = await fetch(`${IG}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`);
        if (rRes.ok) {
          const { access_token: newTok } = await rRes.json();
          if (newTok) {
            const data = await fetchIG(newTok);
            const resp = new Response(JSON.stringify({ configured: true, ...data }), {
              headers: { ...hdrs, 'Cache-Control': 'public, max-age=3600' },
            });
            cache.put(cacheKey, resp.clone()).catch(() => {});
            return resp;
          }
        }
      } catch {}
    }
    return new Response(JSON.stringify({ configured: true, error: err.message, profile: null, media: [] }), { headers: hdrs });
  }
}

// ── Main fetch handler ────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/api/data' || pathname.startsWith('/api/data?'))    return handleData(request, env);
    if (pathname === '/api/auth')                                          return handleAuth(request, env);
    if (pathname === '/api/instagram')                                     return handleIG(env);

    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL('/index.html', url.origin).toString());
    }
    return response;
  },
};
