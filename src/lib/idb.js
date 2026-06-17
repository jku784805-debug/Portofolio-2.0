// IndexedDB wrapper — remplace localStorage pour le contenu avec images
// Capacité : ~500MB vs ~5MB pour localStorage

const DB_NAME = 'portfolio-idb';
const STORE   = 'kv';
let _db = null;

async function openDB() {
  if (_db) return _db;
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess  = e => { _db = e.target.result; res(_db); };
    req.onerror    = ()  => rej(req.error);
  });
}

export const idb = {
  async get(key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => {
        if (r.result !== undefined) return res(r.result);
        // Migration automatique depuis localStorage
        try {
          const old = localStorage.getItem(key);
          if (old) {
            const parsed = JSON.parse(old);
            idb.set(key, parsed).catch(() => {});   // copie vers IDB
            localStorage.removeItem(key);            // libère l'espace
            return res(parsed);
          }
        } catch {}
        res(null);
      };
      r.onerror = () => rej(r.error);
    });
  },

  async set(key, val) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE, 'readwrite').objectStore(STORE).put(val, key);
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });
  },

  async del(key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });
  },
};
