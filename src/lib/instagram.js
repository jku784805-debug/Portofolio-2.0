import { useState, useEffect } from 'react';

let _memo = null;
let _ts   = 0;
const TTL = 60 * 60 * 1000; // 1h client-side cache

export const useInstagram = () => {
  const [state, setState] = useState({
    data:    _memo,
    loading: !_memo,
    error:   null,
  });

  useEffect(() => {
    if (_memo && Date.now() - _ts < TTL) {
      setState({ data: _memo, loading: false, error: null });
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    fetch('/api/instagram')
      .then(r => r.json())
      .then(d => {
        _memo = d;
        _ts   = Date.now();
        setState({ data: d, loading: false, error: null });
      })
      .catch(e => setState({ data: null, loading: false, error: e.message }));
  }, []);

  return state;
};

export const fmtNum = n => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};
