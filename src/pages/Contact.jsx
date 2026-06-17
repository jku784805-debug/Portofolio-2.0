import { useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../lib/storage';
import LayoutTemplate, { C, F, ET, SL, Jp, Wrap, blobToBase64, convertBlobs } from '../components/LayoutTemplate';

const LS_KEY = 'pf-page-contact';

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
  form: {
    btn: 'Envoyer le message',
  },
  services: [
    { jp: '一', label: 'Prestation A' },
    { jp: '二', label: 'Prestation B' },
    { jp: '三', label: 'Prestation C' },
    { jp: '四', label: 'Prestation D' },
  ],
  sections: { hero: true, form: true },
};

const SECTION_LABELS = { hero: 'Titre', form: 'Formulaire' };

const ContactPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [form,     setForm]     = useState({ prenom: '', nom: '', mail: '', type: '', date: '', msg: '' });

  const [content, setContent] = useState({ ...DEFAULT });

  useEffect(() => {
    storage.get(LS_KEY).then(parsed => {
      if (parsed) setContent({ ...DEFAULT, ...parsed, sections: { ...DEFAULT.sections, ...(parsed.sections || {}) } });
    }).catch(() => {});
  }, []);

  const historyRef = useRef([]);
  const [hasHistory, setHasHistory] = useState(false);

  const pushHistory = (prev) => {
    historyRef.current = [...historyRef.current.slice(-29), prev];
    setHasHistory(true);
  };

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
    } catch {
      setSaving(false);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const onReset = () => {
    if (!confirm('Réinitialiser cette page ?')) return;
    storage.del(LS_KEY).catch(() => {});
    setContent({ ...DEFAULT }); setSaved(false);
  };

  const send = () => {
    const sub  = encodeURIComponent(`[Contact] ${form.type || 'Message'}`);
    const body = encodeURIComponent(`Prénom: ${form.prenom}\nNom: ${form.nom}\nEmail: ${form.mail}\nType: ${form.type}\nDate: ${form.date}\n\n${form.msg}`);
    window.location.href = `mailto:${content.info.email}?subject=${sub}&body=${body}`;
  };

  const ch = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const t = (val, onChange, style, tag = 'span') => ({ value: val, onChange, style, tag, editMode });
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

          {/* ─ Info side ─ */}
          <div>
            <SL num="01" title="INFORMATIONS" />

            {/* Japanese motto */}
            <div style={{ marginBottom: 48, padding: '28px 24px', border: `1px solid ${C.b05}`, background: C.card, position: 'relative', overflow: 'hidden' }}>
              <Jp ch="心" style={{ right: -10, bottom: -20, fontSize: '8rem', opacity: .04 }} />
              <ET {...t(info.jpd, v => set('info.jpd', v),
                { fontFamily: F.jp, fontSize: '1.1rem', color: 'rgba(240,240,245,.7)', display: 'block', marginBottom: 10 }, 'div')} />
              <ET {...t(info.jps, v => set('info.jps', v),
                { fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.25em', display: 'block' }, 'div')} />
            </div>

            {/* Contact details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { icon: '☎', label: 'Téléphone', key: 'phone', val: info.phone },
                { icon: '✉', label: 'Email',      key: 'email', val: info.email },
                { icon: '◉', label: 'Zone',        key: 'zone',  val: info.zone  },
              ].map(({ icon, label, key, val }) => (
                <div key={key} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, background: C.r08, border: `1px solid ${C.r30}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: F.m, fontSize: '.85rem', color: C.red, flexShrink: 0,
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.2em', marginBottom: 4 }}>{label}</div>
                    <ET {...t(val, v => set(`info.${key}`, v), { fontFamily: F.b, fontSize: '.95rem', color: C.w, display: 'block' }, 'div')} />
                  </div>
                </div>
              ))}
            </div>

            {/* Services list */}
            <div style={{ marginTop: 48 }}>
              <div style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.25em', marginBottom: 16 }}>PRESTATIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {services.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', border: `1px solid ${C.b05}`,
                    background: C.card,
                  }}>
                    <span style={{ fontFamily: F.jp, fontSize: '.75rem', color: 'rgba(255,23,68,.4)' }}>{s.jp}</span>
                    <ET {...t(s.label, v => setA('services', i, 'label', v), { fontFamily: F.b, fontSize: '.82rem', color: C.grey }, 'span')} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ Form side ─ */}
          <div>
            <SL num="02" title="FORMULAIRE" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input className="lt-input" placeholder="Prénom"     value={form.prenom} onChange={ch('prenom')} />
              <input className="lt-input" placeholder="Nom"        value={form.nom}    onChange={ch('nom')} />
            </div>
            <input className="lt-input" placeholder="Adresse email"      value={form.mail} onChange={ch('mail')} style={{ marginBottom: 12 }} />
            <input className="lt-input" placeholder="Type de prestation" value={form.type} onChange={ch('type')} style={{ marginBottom: 12 }} />
            <input className="lt-input" placeholder="Date souhaitée"     value={form.date} onChange={ch('date')} style={{ marginBottom: 12 }} />
            <textarea className="lt-input" placeholder="Votre message..." rows={6} value={form.msg} onChange={ch('msg')} style={{ resize: 'vertical', marginBottom: 20 }} />

            <button className="lt-btn-r" onClick={send} style={{
              width: '100%', padding: 16, background: C.red, border: 'none', color: C.w,
              fontFamily: F.h, fontWeight: 700, fontSize: '.9rem', letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              <ET {...t(content.form.btn, v => set('form.btn', v), { color: C.w })} />
            </button>

            <p style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.1em', marginTop: 16, textAlign: 'center' }}>
              Ce formulaire ouvre votre client email · Vos données ne sont pas stockées
            </p>
          </div>
        </div>
      </Wrap>)}

      {/* ══ BOTTOM QUOTE ══ */}
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
