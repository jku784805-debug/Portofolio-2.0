import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../lib/storage';
import LayoutTemplate, { C, F, ET, Jp, Wrap } from '../components/LayoutTemplate';
import { supabase } from '../lib/supabase';

const LS_KEY      = 'pf-calendar';
const LS_CONTENT  = 'pf-page-disponibilites';

const JOURS_FULL  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const JOURS_SHORT = ['L','M','M','J','V','S','D'];
const MOIS_LIST   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const DEFAULT_CONTENT = {
  tagline: 'AGENDA · 予約状況 · DISPONIBILITÉS',
  title1:  'Mes',
  title2:  'Disponibilités',
  sub:     'Consultez mon agenda et réservez votre séance photo',
  ctaLabel:'Réserver une séance',
  legendAvailable:   'Disponible',
  legendBooked:      'Réservé',
  legendUnavailable: 'Indisponible',
};

const loadCal     = () => ({});
const loadContent = () => ({ ...DEFAULT_CONTENT });

// ── Statut d'un jour ──────────────────────────────────────────────────────────
// available (absent de la map), booked, unavailable

const STATUS_NEXT = { available: 'booked', booked: 'unavailable', unavailable: 'available' };

const dayStyle = (status, isToday, isPast) => {
  const base = {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    aspectRatio: '1', borderRadius: 4,
    transition: 'all .18s', userSelect: 'none',
  };
  if (isPast) return { ...base, opacity: .22 };
  if (status === 'booked')      return { ...base, background: 'rgba(255,23,68,.18)', border: `1px solid rgba(255,23,68,.45)` };
  if (status === 'unavailable') return { ...base, background: 'rgba(255,255,255,.03)', border: `1px solid rgba(255,255,255,.06)` };
  // available
  return {
    ...base,
    background: isToday ? 'rgba(76,175,80,.15)' : 'rgba(76,175,80,.07)',
    border: `1px solid ${isToday ? 'rgba(76,175,80,.7)' : 'rgba(76,175,80,.25)'}`,
    boxShadow: isToday ? '0 0 12px rgba(76,175,80,.2)' : 'none',
  };
};

const dotColor = { available: '#4CAF50', booked: C.red, unavailable: 'rgba(112,112,138,.35)' };
const dotLabel = (k, content) => ({
  available: content.legendAvailable, booked: content.legendBooked, unavailable: content.legendUnavailable
})[k];

// ── Composant principal ───────────────────────────────────────────────────────

const Disponibilites = () => {
  const today    = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [editMode, setEditMode]   = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [year,     setYear]       = useState(today.getFullYear());
  const [month,    setMonth]      = useState(today.getMonth());
  const [cal,      setCal]        = useState({});
  const [content,  setContent]    = useState({ ...DEFAULT_CONTENT });

  useEffect(() => {
    storage.get(LS_KEY).then(c => { if (c) setCal(c); }).catch(() => {});
    storage.get(LS_CONTENT).then(c => { if (c) setContent({ ...DEFAULT_CONTENT, ...c }); }).catch(() => {});
  }, []);
  const historyRef = useRef([]);
  const [hasHistory, setHasHistory] = useState(false);

  // ── Undo ──
  const pushHistory = prev => { historyRef.current = [...historyRef.current.slice(-29), prev]; setHasHistory(true); };
  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setCal(prev.cal); setContent(prev.content);
    setHasHistory(historyRef.current.length > 0);
  }, []);

  useEffect(() => {
    const fn = e => { if (editMode && e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [editMode, undo]);

  // ── Charger séances Supabase (si configuré) ──
  useEffect(() => {
    async function fetchBooked() {
      try {
        const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const to   = `${year}-${String(month + 1).padStart(2, '0')}-31`;
        const { data, error } = await supabase
          .from('seances')
          .select('date_seance, statut_seance')
          .gte('date_seance', from)
          .lte('date_seance', to)
          .neq('statut_seance', 'annulée');
        if (error || !data?.length) return;
        setCal(prev => {
          const next = { ...prev };
          data.forEach(s => {
            const k = s.date_seance.split('T')[0];
            if (!next[k] || next[k] === 'available') next[k] = 'booked';
          });
          return next;
        });
      } catch { /* Supabase non configuré — silencieux */ }
    }
    fetchBooked();
  }, [year, month]);

  // ── Navigation mois ──
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // ── Toggle jour (edit mode) ──
  const toggleDay = key => {
    if (!editMode) return;
    pushHistory({ cal, content });
    setCal(prev => {
      const cur    = prev[key] || 'available';
      const next   = STATUS_NEXT[cur];
      const result = { ...prev };
      if (next === 'available') delete result[key];
      else result[key] = next;
      return result;
    });
  };

  // ── Contenu éditable ──
  const setC = (key, val) => {
    pushHistory({ cal, content });
    setContent(p => ({ ...p, [key]: val }));
  };
  const t = (key, style, tag = 'span') => ({
    value: content[key], onChange: v => setC(key, v), style, tag, editMode,
  });

  // ── Sauvegarder ──
  const onSave = async () => {
    setSaving(true);
    try {
      await storage.set(LS_KEY, cal);
      await storage.set(LS_CONTENT, content);
    } catch {}
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const onReset = () => {
    if (!confirm('Réinitialiser le calendrier ?')) return;
    storage.del(LS_KEY).catch(() => {}); storage.del(LS_CONTENT).catch(() => {});
    setCal({}); setContent({ ...DEFAULT_CONTENT }); setSaved(false);
  };

  // ── Grille du mois ──
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const daysInMo  = new Date(year, month + 1, 0).getDate();
  const cells     = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  // Résumé disponibilités du mois
  let nbAvail = 0, nbBooked = 0, nbUnavail = 0;
  for (let d = 1; d <= daysInMo; d++) {
    const k = toKey(year, month, d);
    const s = cal[k] || 'available';
    if (s === 'available') nbAvail++;
    else if (s === 'booked') nbBooked++;
    else nbUnavail++;
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <LayoutTemplate
      editMode={editMode} setEditMode={setEditMode}
      onSave={onSave} onReset={onReset}
      saving={saving} saved={saved}
      pageId="disponibilites"
      onUndo={undo} hasHistory={hasHistory}
    >
      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', padding: '100px 0 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%,rgba(76,175,80,.05),transparent 65%),${C.bg}` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
        <Jp ch="予" style={{ right: '-4vw', top: '50%', transform: 'translateY(-50%)', fontSize: '50vw', opacity: .022 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 120px', position: 'relative', zIndex: 2 }}>
          <ET {...t('tagline', { fontFamily: F.jp, fontSize: '.68rem', color: C.red, letterSpacing: '.45em', marginBottom: 24, display: 'block' }, 'div')} />
          <h1 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(3rem,8vw,7rem)', color: C.w, lineHeight: .9, margin: '0 0 28px', letterSpacing: '-.02em' }}>
            <ET {...t('title1', { display: 'block', color: C.w })} />
            <ET {...t('title2', { display: 'block', color: '#4CAF50', textShadow: '0 0 60px rgba(76,175,80,.3)' })} />
          </h1>
          <ET {...t('sub', { fontFamily: F.b, fontSize: '1.05rem', color: C.grey, letterSpacing: '.05em', display: 'block' }, 'p')} />
        </div>
      </section>

      {/* ══ CALENDRIER ══ */}
      <Wrap bg={C.bg2} py={60}>

        {/* Résumé du mois */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: content.legendAvailable,   count: nbAvail,   color: '#4CAF50' },
            { label: content.legendBooked,       count: nbBooked,  color: C.red },
            { label: content.legendUnavailable,  count: nbUnavail, color: C.grey },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ padding: '10px 20px', border: `1px solid rgba(255,255,255,.06)`, background: C.card, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.12em' }}>
                {label}
              </span>
              <span style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.1rem', color }}>{count}</span>
            </div>
          ))}
          {editMode && (
            <div style={{ padding: '10px 16px', border: `1px solid rgba(255,23,68,.2)`, background: C.r08, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: F.m, fontSize: '.56rem', color: C.red, letterSpacing: '.08em' }}>
                ✎ Cliquez sur un jour · Disponible → Réservé → Indisponible
              </span>
            </div>
          )}
        </div>

        {/* Navigation mois */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={prevMonth} style={navBtnStyle}>← MOIS PRÉCÉDENT</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.8rem', color: C.w, letterSpacing: '.08em' }}>
              {MOIS_LIST[month].toUpperCase()}
            </div>
            <div style={{ fontFamily: F.m, fontSize: '.65rem', color: C.grey, letterSpacing: '.2em' }}>{year}</div>
          </div>
          <button onClick={nextMonth} style={navBtnStyle}>MOIS SUIVANT →</button>
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {/* En-têtes jours */}
          {JOURS_SHORT.map((j, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '8px 0',
              fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.12em',
              borderBottom: `1px solid ${C.b05}`,
            }}>{j}</div>
          ))}
          {/* Cellules */}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key    = toKey(year, month, d);
            const status = cal[key] || 'available';
            const isToday = key === todayKey;
            const isPast  = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div key={i}
                onClick={() => toggleDay(key)}
                title={editMode ? `${d} ${MOIS_LIST[month]} — ${dotLabel(status, content)}\nCliquer pour changer` : `${d} ${MOIS_LIST[month]} — ${dotLabel(status, content)}`}
                style={{
                  ...dayStyle(status, isToday, isPast),
                  cursor: editMode && !isPast ? 'pointer' : 'default',
                  padding: '8px 4px',
                  minHeight: 56,
                }}
                onMouseEnter={e => { if (editMode && !isPast) e.currentTarget.style.filter = 'brightness(1.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {/* Numéro du jour */}
                <span style={{
                  fontFamily: F.b, fontWeight: isToday ? 700 : 400,
                  fontSize: '.9rem',
                  color: isPast ? C.grey : (status === 'booked' ? C.red : status === 'unavailable' ? 'rgba(112,112,138,.4)' : '#4CAF50'),
                }}>{d}</span>

                {/* Indicateur statut */}
                {!isPast && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {status === 'available' && (
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4CAF50', opacity: .7 }} />
                    )}
                    {status === 'booked' && (
                      <span style={{ fontFamily: F.m, fontSize: '.45rem', color: C.red, letterSpacing: '.05em' }}>PRIS</span>
                    )}
                    {status === 'unavailable' && (
                      <span style={{ fontFamily: F.m, fontSize: '.45rem', color: 'rgba(112,112,138,.4)', letterSpacing: '.05em' }}>—</span>
                    )}
                  </div>
                )}

                {/* Indicateur aujourd'hui */}
                {isToday && (
                  <div style={{ position: 'absolute', top: 4, right: 6, fontFamily: F.m, fontSize: '.42rem', color: '#4CAF50', letterSpacing: '.05em' }}>auj.</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende + retour à aujourd'hui */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['available', 'booked', 'unavailable'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor[s] }} />
                <span style={{ fontFamily: F.m, fontSize: '.56rem', color: C.grey, letterSpacing: '.1em' }}>
                  {dotLabel(s, content)}
                </span>
              </div>
            ))}
          </div>
          {!isCurrentMonth && (
            <button onClick={goToday} style={navBtnStyle}>↩ Aujourd'hui</button>
          )}
        </div>

        {/* CTA Réserver */}
        <div style={{ textAlign: 'center', marginTop: 56, paddingTop: 48, borderTop: `1px solid ${C.b05}` }}>
          <div style={{ fontFamily: F.jp, fontSize: '1rem', color: 'rgba(255,255,255,.12)', marginBottom: 20 }}>予約する</div>
          <a href="/contact" style={{
            display: 'inline-block', textDecoration: 'none',
            background: C.red, color: C.w, padding: '14px 48px',
            fontFamily: F.h, fontWeight: 700, letterSpacing: '.2em', fontSize: '.85rem',
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(255,23,68,.35)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <ET value={content.ctaLabel} onChange={v => setC('ctaLabel', v)} editMode={editMode} style={{ color: C.w }} />
          </a>
        </div>

      </Wrap>

    </LayoutTemplate>
  );
};

const navBtnStyle = {
  background: 'transparent', border: `1px solid rgba(255,255,255,.08)`,
  color: C.grey, padding: '8px 18px',
  fontFamily: F.m, fontSize: '.6rem', letterSpacing: '.1em', cursor: 'pointer',
  transition: 'border-color .2s, color .2s',
};

export default Disponibilites;
