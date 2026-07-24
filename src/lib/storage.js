// Stockage unifié : Worker KV (cross-browser) → IndexedDB (cache local)
//
// Setup cross-browser (optionnel mais recommandé) :
//   1. npx wrangler kv namespace create SITE_KV
//   2. Copier l'ID retourné dans wrangler.toml → [[kv_namespaces]] id = "..."
//   3. npx wrangler secret put ADMIN_PASSWORD   (protège les écritures)
//   4. npx wrangler deploy
//
// Sans KV configuré → tout reste local (IndexedDB) comme avant.

import { idb } from './idb';

const API = '/api/data';
const TIMEOUT_MS = 4000;

function getToken() {
  try { return sessionStorage.getItem('pf-admin-token') || ''; } catch { return ''; }
}

function isLocalhost() {
  const h = typeof location !== 'undefined' ? location.hostname : '';
  return h === 'localhost' || h === '127.0.0.1';
}

async function workerGet(key) {
  if (isLocalhost()) return null;
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}?key=${encodeURIComponent(key)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function workerSet(key, value) {
  if (isLocalhost()) return false;
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': getToken() },
      body: JSON.stringify({ key, value }),
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    clearTimeout(t);
    return false;
  }
}

async function workerDel(key) {
  if (isLocalhost()) return;
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    await fetch(`${API}?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      signal: ctrl.signal,
      headers: { 'X-Admin-Token': getToken() },
    });
  } catch {} finally { clearTimeout(t); }
}

export const storage = {
  async get(key) {
    // Try Worker KV first (cross-browser)
    const remote = await workerGet(key);
    if (remote !== null) {
      idb.set(key, remote).catch(() => {});   // sync local cache
      return remote;
    }
    // Fallback → local IndexedDB
    return idb.get(key);
  },

  async set(key, val) {
    // Local write is immediate (no flicker)
    await idb.set(key, val);
    // Remote write in background (non-blocking for UI)
    workerSet(key, val).catch(() => {});
  },

  async del(key) {
    await idb.del(key).catch(() => {});
    workerDel(key);
  },
};

// Auth helpers (used by LayoutTemplate)
export const auth = {
  getToken,

  setToken(pwd) {
    try { sessionStorage.setItem('pf-admin-token', pwd); } catch {}
  },

  clearToken() {
    try { sessionStorage.removeItem('pf-admin-token'); } catch {}
  },

  async verify(pwd) {
    if (isLocalhost()) return true;                 // dev mode → always OK
    try {
      const res = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'X-Admin-Token': pwd },
      });
      if (res.status === 404) return true;          // worker not updated yet → open
      return res.ok;
    } catch {
      return true;                                  // network error → allow (offline)
    }
  },
};
