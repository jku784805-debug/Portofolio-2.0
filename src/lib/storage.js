// Stockage unifié : Supabase (source de vérité) + IndexedDB (cache local)
// get() → Supabase d'abord (tous les visiteurs voient la même chose), fallback IDB
// set() → IDB immédiat + Supabase en parallèle
// del() → les deux

import { idb } from './idb';
import { supabase } from './supabase';

const TABLE = 'portfolio_content';

const isPlaceholder = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return !url || url.includes('placeholder');
};

export const storage = {
  async get(key) {
    if (!isPlaceholder()) {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('value')
          .eq('key', key)
          .maybeSingle();
        if (!error && data?.value != null) {
          idb.set(key, data.value).catch(() => {});
          return data.value;
        }
      } catch {}
    }
    return idb.get(key);
  },

  async set(key, val) {
    await idb.set(key, val);
    if (!isPlaceholder()) {
      try {
        await supabase.from(TABLE).upsert({ key, value: val });
      } catch {}
    }
  },

  async del(key) {
    await idb.del(key).catch(() => {});
    if (!isPlaceholder()) {
      try { await supabase.from(TABLE).delete().eq('key', key); } catch {}
    }
  },
};
