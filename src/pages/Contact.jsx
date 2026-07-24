import { useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../lib/storage';
import LayoutTemplate, { C, F, ET, SL, Jp, Wrap, blobToBase64, convertBlobs } from '../components/LayoutTemplate';

const LS_KEY  = 'pf-page-contact';
const PUB_KEY = 'pf-pub-contact';

const DEFAULT = {
  hero: {
    tagline: '連 絡 · コンタクト · CONTACT',
    t1: 'Travaillons',
    t2: 'ensemble',
  },
  info: {
    phone: '+33 0 00 00 00 00',
    email: 'contact@khunmacj.fr',
    zone:  'Paris · France · International',
    jpd:   '御連絡をお待ちしております',
    jps:   "DANS L'ATTENTE DE VOS NOUVELLES",
  },
  form: { btn: 'Envoyer le message' },
  services: [
    { jp: '一', label: 'Séance Portrait',    price: '150 €', desc: 'Shooting individuel, retouches incluses' },
    { jp: '二', label: 'Shooting Famille',   price: '250 €', desc: 'Séance famille en extérieur ou studio' },
    { jp: '三', label: 'Événement',          price: '400 €', desc: 'Couverture complète, livraison HD rapide' },
    { jp: '四', label: 'Pack Pro',           price: '300 €', desc: 'Corporate, headshots, contenu visuel' },
  ],
  sections: { hero: true, form: true },
};

const SECTION_LABELS = { hero: 'Titre', form: 'Formulaire' };
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS = ['L','M','M','J','V','S','D'];
const HEURES = Array.from({ length: 13 }, (_, i) => i + 8); // 8h → 20h
const MINUTES = ['00', '15', '30', '45'];

/* ── Sélecteur de prestation (dropdown animé) ── */
const PrestationDropdown = ({ services, selected, onSelect, editMode, onEditLabel, onEditPrice, onEditDesc }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const sel = services.find(s => s.label === selected);

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <div style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.2em', marginBottom: 6 }}>TYPE DE PRESTATION</div>

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '12px 16px',
        background: open ? 'rgba(255,23,68,.06)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${open || selected ? C.red : 'rgba(255,255,255,.08)'}`,
        color: C.w, fontFamily: F.b, fontSize: '.88rem',
        textAlign: 'left', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all .2s',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {sel && <span style={{ fontFamily: F.jp, fontSize: '.85rem', color: C.red }}>{sel.jp}</span>}
          <span style={{ color: selected ? C.w : C.grey }}>{selected || 'Choisir une prestation...'}</span>
        </span>
        <span style={{ color: C.red, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '.75rem' }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#0D0D1E', border: `1px solid ${C.r30}`,
          boxShadow: '0 16px 48px rgba(0,0,0,.85)',
          animation: 'slideDown .18s ease',
        }}>
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>

          {/* Header tableau */}
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 1fr auto',
            padding: '8px 16px', borderBottom: `1px solid rgba(255,255,255,.05)`,
            fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.2em',
          }}>
            <span></span><span>PRESTATION</span><span style={{ textAlign: 'right' }}>TARIF</span>
          </div>

          {services.map((s, i) => {
            const active = selected === s.label;
            return (
              <div key={i}
                onClick={() => { if (!editMode) { onSelect(active ? '' : s.label); setOpen(false); } }}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto',
                  padding: '14px 16px', cursor: editMode ? 'default' : 'pointer',
                  background: active ? 'rgba(255,23,68,.08)' : 'transparent',
                  borderBottom: i < services.length - 1 ? `1px solid rgba(255,255,255,.04)` : 'none',
                  transition: 'background .15s',
                  borderLeft: active ? `3px solid ${C.red}` : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active && !editMode) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontFamily: F.jp, fontSize: '1rem', color: active ? C.red : 'rgba(255,23,68,.35)', alignSelf: 'center' }}>{s.jp}</span>
                <div style={{ alignSelf: 'center' }}>
                  {editMode ? (
                    <>
                      <input value={s.label} onChange={e => { e.stopPropagation(); onEditLabel(i, e.target.value); }} onClick={e => e.stopPropagation()}
                        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: C.w, fontFamily: F.b, fontSize: '.85rem', padding: '2px 6px', width: '90%', marginBottom: 4, display: 'block' }} />
                      <input value={s.desc || ''} onChange={e => { e.stopPropagation(); onEditDesc(i, e.target.value); }} onClick={e => e.stopPropagation()} placeholder="Description..."
                        style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', color: C.grey, fontFamily: F.b, fontSize: '.72rem', padding: '2px 6px', width: '90%', display: 'block' }} />
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: F.b, fontSize: '.88rem', color: active ? C.w : 'rgba(240,240,245,.85)' }}>{s.label}</div>
                      {s.desc && <div style={{ fontFamily: F.b, fontSize: '.72rem', color: C.grey, marginTop: 2 }}>{s.desc}</div>}
                    </>
                  )}
                </div>
                <div style={{ alignSelf: 'center', textAlign: 'right' }}>
                  {editMode ? (
                    <input value={s.price || ''} onChange={e => { e.stopPropagation(); onEditPrice(i, e.target.value); }} onClick={e => e.stopPropagation()} placeholder="Tarif"
                      style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: C.red, fontFamily: F.h, fontWeight: 700, fontSize: '.9rem', padding: '2px 6px', width: 80, textAlign: 'right' }} />
                  ) : (
                    <span style={{ fontFamily: F.h, fontWeight: 700, fontSize: '.95rem', color: active ? C.red : 'rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>{s.price}</span>
                  )}
                </div>
              </div>
            );
          })}

          {selected && (
            <div onClick={() => { onSelect(''); setOpen(false); }} style={{
              padding: '8px 16px', textAlign: 'center',
              fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.15em',
              cursor: 'pointer', borderTop: `1px solid rgba(255,255,255,.05)`,
            }}>✕ EFFACER LA SÉLECTION</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Calendrier + heure ── */
const DateTimePicker = ({ value, onChange }) => {
  const [open,    setOpen]    = useState(false);
  const [phase,   setPhase]   = useState('cal'); // 'cal' | 'time'
  const [selDay,  setSelDay]  = useState(null);  // { year, month, day }
  const [selH,    setSelH]    = useState(null);
  const [selMin,  setSelMin]  = useState(null);
  const [view,    setView]    = useState(() => new Date());
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const year  = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();

  const firstDay  = new Date(year, month, 1).getDay();
  const offset    = firstDay === 0 ? 6 : firstDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const isPast     = d => d && new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isToday    = d => d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const isSelected = d => d && selDay && selDay.day === d && selDay.month === month && selDay.year === year;

  const pickDay = d => {
    if (!d || isPast(d)) return;
    setSelDay({ year, month, day: d });
    setPhase('time');
  };

  const handleConfirm = (h, m) => {
    if (!selDay) return;
    const dateStr = new Date(selDay.year, selDay.month, selDay.day)
      .toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    onChange(`${dateStr} à ${h}h${m}`);
    setSelH(h); setSelMin(m);
    setOpen(false);
    setPhase('cal');
  };

  const clear = () => { onChange(''); setSelDay(null); setSelH(null); setSelMin(null); setOpen(false); setPhase('cal'); };

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <div style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.2em', marginBottom: 6 }}>DATE & HEURE SOUHAITÉES</div>

      <button type="button" onClick={() => { setOpen(o => !o); setPhase('cal'); }} style={{
        width: '100%', padding: '12px 16px',
        background: open ? 'rgba(255,23,68,.06)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${open || value ? C.red : 'rgba(255,255,255,.08)'}`,
        color: value ? C.w : C.grey, fontFamily: F.b, fontSize: '.88rem',
        textAlign: 'left', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all .2s',
      }}>
        <span>{value || 'Choisir une date et une heure...'}</span>
        <span style={{ fontFamily: F.m, fontSize: '.75rem', color: C.red }}>📅</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#0D0D1E', border: `1px solid ${C.r30}`,
          boxShadow: '0 16px 48px rgba(0,0,0,.85)',
          animation: 'slideDown .18s ease',
        }}>

          {phase === 'cal' && <>
            {/* Navigation mois */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,.05)` }}>
              <button onClick={() => setView(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '1.1rem', padding: '2px 8px' }}>‹</button>
              <span style={{ fontFamily: F.m, fontSize: '.7rem', color: C.w, letterSpacing: '.15em' }}>{MOIS[month]} {year}</span>
              <button onClick={() => setView(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '1.1rem', padding: '2px 8px' }}>›</button>
            </div>

            {/* Jours semaine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '10px 12px 4px' }}>
              {JOURS.map((j, i) => (
                <div key={i} style={{ textAlign: 'center', fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.1em', padding: '2px 0' }}>{j}</div>
              ))}
            </div>

            {/* Grille jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 12px 12px' }}>
              {cells.map((d, i) => (
                <button key={i} type="button" onClick={() => pickDay(d)} disabled={!d || isPast(d)}
                  style={{
                    padding: '8px 0', textAlign: 'center',
                    fontFamily: F.b, fontSize: '.8rem',
                    background: isSelected(d) ? C.red : isToday(d) ? 'rgba(255,23,68,.12)' : 'transparent',
                    color: !d ? 'transparent' : isSelected(d) ? '#fff' : isPast(d) ? 'rgba(255,255,255,.15)' : C.w,
                    border: isToday(d) && !isSelected(d) ? `1px solid ${C.r30}` : '1px solid transparent',
                    cursor: d && !isPast(d) ? 'pointer' : 'default',
                    transition: 'all .12s', borderRadius: 2,
                  }}
                >{d || ''}</button>
              ))}
            </div>

            {selDay && (
              <div style={{ padding: '8px 16px', borderTop: `1px solid rgba(255,255,255,.05)`, fontFamily: F.m, fontSize: '.58rem', color: C.red, textAlign: 'center', letterSpacing: '.1em' }}>
                {new Date(selDay.year, selDay.month, selDay.day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} — choisir l'heure ›
              </div>
            )}
          </>}

          {phase === 'time' && selDay && <>
            {/* Header heure */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,.05)`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setPhase('cal')} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '1rem' }}>‹</button>
              <span style={{ fontFamily: F.m, fontSize: '.68rem', color: C.w, letterSpacing: '.12em' }}>
                {new Date(selDay.year, selDay.month, selDay.day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}
              </span>
            </div>

            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Heures */}
              <div>
                <div style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.2em', marginBottom: 8 }}>HEURE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                  {HEURES.map(h => (
                    <button key={h} type="button" onClick={() => setSelH(h)} style={{
                      padding: '8px 4px', textAlign: 'center',
                      fontFamily: F.m, fontSize: '.75rem',
                      background: selH === h ? C.red : 'rgba(255,255,255,.04)',
                      color: selH === h ? '#fff' : C.w,
                      border: `1px solid ${selH === h ? C.red : 'rgba(255,255,255,.06)'}`,
                      cursor: 'pointer', transition: 'all .12s',
                    }}>{h}h</button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div>
                <div style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.2em', marginBottom: 8 }}>MINUTES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {MINUTES.map(m => (
                    <button key={m} type="button" onClick={() => setSelMin(m)} style={{
                      padding: '10px 12px',
                      fontFamily: F.m, fontSize: '.8rem',
                      background: selMin === m ? C.red : 'rgba(255,255,255,.04)',
                      color: selMin === m ? '#fff' : C.w,
                      border: `1px solid ${selMin === m ? C.red : 'rgba(255,255,255,.06)'}`,
                      cursor: 'pointer', transition: 'all .12s',
                    }}>:{m}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouton confirmer */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid rgba(255,255,255,.05)` }}>
              <button type="button" onClick={() => { if (selH !== null && selMin !== null) handleConfirm(selH, selMin); }}
                disabled={selH === null || selMin === null}
                style={{
                  width: '100%', padding: '12px',
                  background: selH !== null && selMin !== null ? C.red : 'rgba(255,255,255,.06)',
                  border: 'none', color: selH !== null && selMin !== null ? '#fff' : C.grey,
                  fontFamily: F.h, fontWeight: 700, fontSize: '.8rem', letterSpacing: '.15em',
                  cursor: selH !== null && selMin !== null ? 'pointer' : 'default',
                  transition: 'all .2s',
                }}>
                {selH !== null && selMin !== null ? `✓ CONFIRMER ${selH}h${selMin}` : "CHOISIR L'HEURE ET LES MINUTES"}
              </button>
            </div>
          </>}

          {value && (
            <div onClick={clear} style={{
              padding: '8px 16px', textAlign: 'center', cursor: 'pointer',
              fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.15em',
              borderTop: `1px solid rgba(255,255,255,.05)`,
            }}>✕ EFFACER</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Page principale ── */
const ContactPage = () => {
  const [editMode,   setEditMode]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form,       setForm]       = useState({ prenom: '', nom: '', mail: '', type: '', date: '', msg: '' });
  const [sending,    setSending]    = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const [content, setContent] = useState({ ...DEFAULT });

  const applyContent = c => c && setContent({
    ...DEFAULT, ...c,
    sections: { ...DEFAULT.sections, ...(c.sections || {}) },
    services: (c.services || DEFAULT.services).map(s => ({ price: 'Sur devis', desc: '', ...s })),
  });

  useEffect(() => {
    const loadContact = c => {
      if (c) applyContent(c);
    };
    storage.get(PUB_KEY).then(pub => {
      if (pub) { loadContact(pub); } else { storage.get(LS_KEY).then(loadContact).catch(() => {}); }
    }).catch(() => storage.get(LS_KEY).then(loadContact).catch(() => {}));

    // Sync prestations depuis la page Découvrir
    storage.get('pf-pub-decouvrir').then(dec => {
      if (!dec?.services?.length) return storage.get('pf-page-decouvrir');
      return dec;
    }).then(dec => {
      if (!dec?.services?.length) return;
      setContent(prev => {
        const isDefault = prev.services.every(s => s.price === 'Sur devis' && s.label.startsWith('Prestation'));
        if (!isDefault) return prev; // ne pas écraser si déjà personnalisé
        return {
          ...prev,
          services: dec.services.filter(s => s.visible !== false).map(s => ({
            jp: s.jp || '一',
            label: s.title || s.label || '',
            price: s.price || 'Sur devis',
            desc: s.desc || '',
          })),
        };
      });
    }).catch(() => {});
  }, []);

  const onEnterEdit = () => { storage.get(LS_KEY).then(applyContent).catch(() => {}); setEditMode(true); };
  const onExitEdit  = () => { storage.get(PUB_KEY).then(pub => { if (pub) applyContent(pub); }).catch(() => {}); setEditMode(false); };

  const historyRef = useRef([]);
  const [hasHistory, setHasHistory] = useState(false);
  const pushHistory = prev => { historyRef.current = [...historyRef.current.slice(-29), prev]; setHasHistory(true); };

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setContent(prev);
    setHasHistory(historyRef.current.length > 0);
  }, []);

  useEffect(() => {
    const fn = e => { if (editMode && e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [editMode, undo]);

  const toggleSection = k => setContent(p => ({ ...p, sections: { ...p.sections, [k]: !p.sections[k] } }));

  const set = useCallback((path, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = val;
      return next;
    });
  }, []);

  const setA = useCallback((arr, idx, key, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      next[arr][idx][key] = val;
      return next;
    });
  }, []);

  const onSave = async () => {
    if (saving) return;
    setSaving(true); setSaved(false);
    try {
      const converted = await convertBlobs(content);
      setContent(converted);
      await storage.set(LS_KEY, converted);
      setSaving(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setSaving(false); alert('Erreur lors de la sauvegarde.'); }
  };

  const onPublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const converted = await convertBlobs(content);
      setContent(converted);
      await storage.set(LS_KEY, converted);
      await storage.set(PUB_KEY, converted);
      setPublishing(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setPublishing(false); alert('Erreur lors de la publication.'); }
  };

  const onReset = () => {
    if (!confirm('Réinitialiser cette page ?')) return;
    storage.del(LS_KEY).catch(() => {}); storage.del(PUB_KEY).catch(() => {});
    setContent({ ...DEFAULT }); setSaved(false);
  };

  const send = async () => {
    if (sending) return;
    setSending(true); setSendStatus(null);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          subject: `[Contact] ${form.type || 'Message'} — ${form.prenom} ${form.nom}`,
          from_name: `${form.prenom} ${form.nom}`,
          email: form.mail,
          type_prestation: form.type,
          date_souhaitee: form.date,
          message: form.msg,
        }),
      });
      const json = await res.json();
      if (json.success) { setSendStatus('ok'); setForm({ prenom: '', nom: '', mail: '', type: '', date: '', msg: '' }); }
      else setSendStatus('err');
    } catch { setSendStatus('err'); }
    finally { setSending(false); setTimeout(() => setSendStatus(null), 5000); }
  };

  const ch = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const t  = (val, onChange, style, tag = 'span') => ({ value: val, onChange, style, tag, editMode });
  const { hero, info, services, sections } = content;

  return (
    <LayoutTemplate
      editMode={editMode} setEditMode={setEditMode}
      onSave={onSave} onReset={onReset}
      saving={saving} saved={saved}
      pageId="contact"
      onUndo={undo} hasHistory={hasHistory}
      sections={sections} onToggleSection={toggleSection}
      sectionLabels={SECTION_LABELS}
      onEnterEdit={onEnterEdit} onExitEdit={onExitEdit}
      onPublish={onPublish} publishing={publishing}
    >

      {/* ══ HERO ══ */}
      {sections.hero && (
        <section style={{ position: 'relative', padding: '100px 0 80px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%,rgba(255,23,68,.06),transparent 70%),${C.bg}` }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
          <Jp ch="愛" style={{ right: '-5vw', top: '50%', transform: 'translateY(-50%)', fontSize: '50vw', opacity: .025 }} />
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 120px', position: 'relative', zIndex: 2 }}>
            <ET {...t(hero.tagline, v => set('hero.tagline', v), { fontFamily: F.jp, fontSize: '.7rem', color: C.red, letterSpacing: '.5em', marginBottom: 24, display: 'block' }, 'div')} />
            <h1 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(3rem,8vw,7.5rem)', color: C.w, lineHeight: .9, margin: 0, letterSpacing: '-.02em' }}>
              <ET {...t(hero.t1, v => set('hero.t1', v), { display: 'block', color: C.w })} /><br />
              <ET {...t(hero.t2, v => set('hero.t2', v), { display: 'block', color: C.red, textShadow: `0 0 60px rgba(255,23,68,.35)` })} />
            </h1>
          </div>
        </section>
      )}

      {/* ══ CONTACT GRID ══ */}
      {sections.form && (<Wrap id="contact-form" bg={C.bg} py={80}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80 }}>

          {/* ─ Info ─ */}
          <div>
            <SL num="01" title="INFORMATIONS" />
            <div style={{ marginBottom: 48, padding: '28px 24px', border: `1px solid ${C.b05}`, background: C.card, position: 'relative', overflow: 'hidden' }}>
              <Jp ch="心" style={{ right: -10, bottom: -20, fontSize: '8rem', opacity: .04 }} />
              <ET {...t(info.jpd, v => set('info.jpd', v), { fontFamily: F.jp, fontSize: '1.1rem', color: 'rgba(240,240,245,.7)', display: 'block', marginBottom: 10 }, 'div')} />
              <ET {...t(info.jps, v => set('info.jps', v), { fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.25em', display: 'block' }, 'div')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { icon: '☎', label: 'Téléphone', key: 'phone', val: info.phone },
                { icon: '✉', label: 'Email',     key: 'email', val: info.email },
                { icon: '◉', label: 'Zone',       key: 'zone',  val: info.zone  },
              ].map(({ icon, label, key, val }) => (
                <div key={key} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, background: C.r08, border: `1px solid ${C.r30}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.m, fontSize: '.85rem', color: C.red, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.2em', marginBottom: 4 }}>{label}</div>
                    <ET {...t(val, v => set(`info.${key}`, v), { fontFamily: F.b, fontSize: '.95rem', color: C.w, display: 'block' }, 'div')} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 48 }}>
              <div style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.25em', marginBottom: 16 }}>PRESTATIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {services.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: `1px solid ${C.b05}`, background: C.card }}>
                    <span style={{ fontFamily: F.jp, fontSize: '.75rem', color: 'rgba(255,23,68,.4)' }}>{s.jp}</span>
                    <ET {...t(s.label, v => setA('services', i, 'label', v), { fontFamily: F.b, fontSize: '.82rem', color: C.grey }, 'span')} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ Form ─ */}
          <div>
            <SL num="02" title="FORMULAIRE" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input className="lt-input" placeholder="Prénom" value={form.prenom} onChange={ch('prenom')} />
              <input className="lt-input" placeholder="Nom"    value={form.nom}    onChange={ch('nom')} />
            </div>
            <input className="lt-input" placeholder="Adresse email" value={form.mail} onChange={ch('mail')} style={{ marginBottom: 12 }} />

            {/* Dropdown prestations */}
            <PrestationDropdown
              services={services}
              selected={form.type}
              onSelect={v => setForm(p => ({ ...p, type: v }))}
              editMode={editMode}
              onEditLabel={(i, v) => setA('services', i, 'label', v)}
              onEditPrice={(i, v) => setA('services', i, 'price', v)}
              onEditDesc={(i, v)  => setA('services', i, 'desc',  v)}
            />

            {/* Calendrier + heure */}
            <DateTimePicker
              value={form.date}
              onChange={v => setForm(p => ({ ...p, date: v }))}
            />

            <textarea className="lt-input" placeholder="Votre message..." rows={5} value={form.msg} onChange={ch('msg')} style={{ resize: 'vertical', marginBottom: 20 }} />

            <button className="lt-btn-r" onClick={editMode ? undefined : send} disabled={sending} style={{
              width: '100%', padding: 16,
              background: sendStatus === 'ok' ? '#4CAF50' : sendStatus === 'err' ? '#FF5252' : C.red,
              border: 'none', color: C.w,
              fontFamily: F.h, fontWeight: 700, fontSize: '.9rem', letterSpacing: '.2em', textTransform: 'uppercase',
              cursor: sending ? 'wait' : 'pointer', transition: 'background .3s', opacity: sending ? .7 : 1,
            }}>
              {sending ? '⏳ ENVOI EN COURS...' : sendStatus === 'ok' ? '✓ MESSAGE ENVOYÉ !' : sendStatus === 'err' ? '✗ ERREUR — RÉESSAYEZ' : <ET {...t(content.form.btn, v => set('form.btn', v), { color: C.w })} />}
            </button>
            <p style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.1em', marginTop: 16, textAlign: 'center' }}>
              Vos messages sont envoyés directement à {content.info.email}
            </p>
          </div>
        </div>
      </Wrap>)}

      {/* ══ QUOTE ══ */}
      <section style={{ padding: '80px 60px', background: C.bg2, borderTop: `1px solid ${C.b05}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Jp ch="縁" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: '35vw', opacity: .02 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: F.jp, fontSize: '1.4rem', color: 'rgba(240,240,245,.25)', marginBottom: 16 }}>出会いを大切に</div>
          <div style={{ fontFamily: F.m, fontSize: '.62rem', color: C.grey, letterSpacing: '.35em' }}>CHAQUE RENCONTRE EST UNE OPPORTUNITÉ UNIQUE</div>
        </div>
      </section>

    </LayoutTemplate>
  );
};

export default ContactPage;
