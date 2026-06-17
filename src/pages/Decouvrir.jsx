import { useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import LayoutTemplate, { C, F, ET, UploadBtn, SL, Jp, Wrap, Lightbox, blobToBase64, convertBlobs } from '../components/LayoutTemplate';

const LS_KEY = 'pf-page-decouvrir';

const DEFAULT = {
  slides: [
    { bg: null, tag: 'SÉANCE PHOTO', title: 'Votre histoire', sub: 'racontée en images', cta: 'Réserver' },
    { bg: null, tag: 'PORTRAIT',     title: 'Chaque instant', sub: 'mérite d\'être capturé', cta: 'Voir la galerie' },
    { bg: null, tag: 'CRÉATIONS',    title: 'L\'art du regard', sub: 'au service de vos émotions', cta: 'Découvrir' },
  ],
  intro: {
    t1: 'À propos', t2: 'de moi',
    p1: 'Présentation de votre parcours, votre passion et votre approche artistique. Ce texte est entièrement personnalisable selon vos besoins.',
    p2: 'Second paragraphe. Parlez de votre méthode de travail, de votre style unique et de ce qui vous rend différent des autres.',
    sig: 'Khun.MacJ',
    side: 'ARTISTE VISUEL · PARIS · FRANCE',
    portrait: null,
    s1n: '10+', s1l: 'Années d\'expérience',
    s2n: '500+', s2l: 'Séances réalisées',
    s3n: '100%', s3l: 'Clients satisfaits',
  },
  gallery: [
    { src: null, title: 'Création 1', cat: 'Portrait' },
    { src: null, title: 'Création 2', cat: 'Famille' },
    { src: null, title: 'Création 3', cat: 'Nature' },
    { src: null, title: 'Création 4', cat: 'Urbain' },
    { src: null, title: 'Création 5', cat: 'Studio' },
    { src: null, title: 'Création 6', cat: 'Extérieur' },
  ],
  services: [
    { jp: '一', icon: '◈', title: 'Séance Portrait',   desc: 'Une heure de shooting pour un résultat naturel et authentique. Retouches incluses.',  price: '150 €', visible: true },
    { jp: '二', icon: '◉', title: 'Shooting Famille',  desc: 'Immortalisez vos souvenirs en famille dans un cadre chaleureux et bienveillant.',       price: '250 €', visible: true },
    { jp: '三', icon: '◆', title: 'Reportage Événement',desc: 'Couverture complète de votre événement avec livraison rapide des fichiers HD.',       price: '400 €', visible: true },
    { jp: '四', icon: '◇', title: 'Pack Professionnel', desc: 'Photos corporate, headshots et contenu visuel pour votre image professionnelle.',      price: '300 €', visible: true },
  ],
  process: [
    { jp: '一', num: '01', step: 'Premier contact',   desc: 'Échange par email ou téléphone pour définir vos besoins et valider les disponibilités.' },
    { jp: '二', num: '02', step: 'Préparation',       desc: 'Choix du lieu, des tenues et des inspirations. Je vous guide pour un résultat parfait.' },
    { jp: '三', num: '03', step: 'La séance',         desc: 'Dans une ambiance détendue et créative, nous capturons les meilleurs moments.' },
    { jp: '四', num: '04', step: 'Livraison',         desc: 'Retouche soignée et livraison de vos photos via galerie en ligne sécurisée.' },
  ],
  cta: {
    t1: 'Prêt à créer',
    t2: 'quelque chose d\'unique ?',
    sub: 'Réservez votre séance dès maintenant et obtenez un devis personnalisé.',
    btn: 'Prendre rendez-vous',
  },
  sections: { slider: true, intro: true, gallery: true, services: true, process: true, cta: true },
};

const SECTION_LABELS = { slider: 'Slider', intro: 'À propos', gallery: 'Créations', services: 'Prestations', process: 'Processus', cta: 'CTA' };

/* ── helpers ── */
const imgPlaceholder = (h = 300, label = 'IMAGE') => (
  <div style={{ width: '100%', height: h, background: 'linear-gradient(135deg,#0D0D1E,#14041A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ fontFamily: F.m, fontSize: '.55rem', color: 'rgba(255,255,255,.12)', letterSpacing: '.25em' }}>{label}</span>
  </div>
);

const Decouvrir = () => {
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [lbxIdx,   setLbxIdx]   = useState(null);

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

  const t = (val, onChange, style, tag = 'span') => ({ value: val, onChange, style, tag, editMode });
  const { slides, intro, gallery, services, process, cta, sections } = content;
  const lbxItems = gallery.map(g => ({ ...g, cat: g.cat }));

  return (
    <LayoutTemplate
      editMode={editMode} setEditMode={setEditMode}
      onSave={onSave} onReset={onReset}
      saving={saving} saved={saved}
      pageId="decouvrir"
      onUndo={undo} hasHistory={hasHistory}
      sections={sections} onToggleSection={toggleSection}
      sectionLabels={SECTION_LABELS}
    >
      <Lightbox items={lbxItems} idx={lbxIdx} onClose={() => setLbxIdx(null)} setIdx={setLbxIdx} />

      {/* ══ HERO SLIDER ══ */}
      {sections.slider && <section style={{ position: 'relative', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          style={{ width: '100%', height: '100%' }}
        >
          {slides.map((sl, i) => (
            <SwiperSlide key={i}>
              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                {/* Background */}
                {sl.bg
                  ? <img src={sl.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.25) contrast(1.2)' }} />
                  : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${40 + i * 20}% 50%,rgba(255,23,68,.07),transparent 70%),${C.bg}` }} />
                }
                {/* Grid overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,${C.bg} 42%,rgba(5,5,10,.6) 70%,transparent)` }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top,${C.bg} 0%,transparent 35%)` }} />
                <Jp ch={['光','影','夢'][i]} style={{ right: '-5vw', top: '50%', transform: 'translateY(-50%)', fontSize: '55vw', opacity: .025 }} />

                {/* Content */}
                <div style={{ position: 'absolute', left: 120, top: '50%', transform: 'translateY(-50%)', maxWidth: 700, zIndex: 2 }}>
                  <ET {...t(sl.tag, v => setA('slides', i, 'tag', v), { fontFamily: F.jp, fontSize: '.7rem', color: C.red, letterSpacing: '.5em', marginBottom: 24, display: 'block' }, 'div')} />
                  <h1 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(3rem,8vw,8rem)', color: C.w, lineHeight: .9, margin: '0 0 4px -3px', letterSpacing: '-.02em' }}>
                    <ET {...t(sl.title, v => setA('slides', i, 'title', v), { display: 'block', color: C.w })} /><br />
                    <ET {...t(sl.sub, v => setA('slides', i, 'sub', v), { display: 'block', color: C.red, textShadow: `0 0 60px rgba(255,23,68,.4)` })} />
                  </h1>
                  <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
                    <button className="lt-btn-r" style={{ padding: '14px 36px', background: C.red, border: 'none', color: C.w, fontFamily: F.h, fontWeight: 700, fontSize: '.85rem', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      <ET {...t(sl.cta, v => setA('slides', i, 'cta', v), { color: C.w })} />
                    </button>
                  </div>
                </div>

                {editMode && (
                  <label style={{ position: 'absolute', top: 80, right: 20, zIndex: 10, background: 'rgba(255,23,68,.12)', border: `1px dashed ${C.r30}`, color: C.red, padding: '8px 14px', fontFamily: F.m, fontSize: '.6rem', letterSpacing: '.1em', cursor: 'pointer' }}>
                    📸 IMAGE SLIDE {i + 1}
                    <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files[0]; if (f) setA('slides', i, 'bg', URL.createObjectURL(f)); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 10 }}>
          <span style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.25em' }}>SCROLL</span>
          <div style={{ width: 1, height: 52, background: `linear-gradient(to bottom,${C.red},transparent)`, animation: 'lt-pulse 2s infinite' }} />
        </div>
      </section>}

      {/* ══ INTRO ══ */}
      {sections.intro && <Wrap id="intro" bg={C.bg} py={120}>
        <Jp ch="人" style={{ right: -40, top: '50%', transform: 'translateY(-50%)', fontSize: '35vw', opacity: .025 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Portrait */}
          <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg,#0D0D1E,#14041A)', overflow: 'hidden' }}>
            {intro.portrait
              ? <img src={intro.portrait} alt="Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : imgPlaceholder('100%', 'PORTRAIT')
            }
            <div style={{ position: 'absolute', inset: 0, border: `1px solid ${C.b05}` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: `linear-gradient(to top,${C.bg},transparent)` }} />
            {/* Stats overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', gap: 20, zIndex: 10 }}>
              {[['s1n','s1l'],['s2n','s2l'],['s3n','s3l']].map(([nk,lk]) => (
                <div key={nk}>
                  <ET {...t(intro[nk], v => set(`intro.${nk}`, v), { fontFamily: F.h, fontWeight: 700, fontSize: '1.6rem', color: C.w, display: 'block', lineHeight: 1 }, 'div')} />
                  <ET {...t(intro[lk], v => set(`intro.${lk}`, v), { fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.1em', display: 'block', marginTop: 4 }, 'div')} />
                </div>
              ))}
            </div>
            {editMode && <UploadBtn onFile={v => set('intro.portrait', v)} label="PORTRAIT" />}
          </div>

          {/* Text */}
          <div>
            <SL num="01" title="À PROPOS" />
            <h2 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.5rem)', color: C.w, lineHeight: .95, margin: '0 0 40px', letterSpacing: '-.01em' }}>
              <ET {...t(intro.t1, v => set('intro.t1', v), { display: 'block', color: C.w })} /><br />
              <ET {...t(intro.t2, v => set('intro.t2', v), { display: 'block', color: C.red })} />
            </h2>
            <ET {...t(intro.p1, v => set('intro.p1', v), { fontFamily: F.b, fontSize: '1rem', color: 'rgba(240,240,245,.8)', lineHeight: 1.8, marginBottom: 20, display: 'block' }, 'p')} />
            <ET {...t(intro.p2, v => set('intro.p2', v), { fontFamily: F.b, fontSize: '1rem', color: 'rgba(240,240,245,.8)', lineHeight: 1.8, marginBottom: 40, display: 'block' }, 'p')} />
            <div style={{ paddingTop: 24, borderTop: `1px solid ${C.b05}` }}>
              <ET {...t(intro.sig,  v => set('intro.sig',  v), { fontFamily: F.h, fontWeight: 700, fontSize: '1.5rem', color: C.w, letterSpacing: '.08em', display: 'block' }, 'div')} />
              <ET {...t(intro.side, v => set('intro.side', v), { fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.2em', marginTop: 6, display: 'block' }, 'div')} />
            </div>
          </div>
        </div>
      </Wrap>}

      {/* ══ GALLERY PREVIEW ══ */}
      {sections.gallery && <section id="gallery-preview" style={{ padding: '80px 0', background: C.bg2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 60px' }}>
          <SL num="02" title="CRÉATIONS" />
        </div>
        {/* Full-width asymmetric grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gridTemplateRows: '340px 340px', gap: 4, padding: '0 60px', maxWidth: 1400, margin: '0 auto' }}>
          {gallery.slice(0, 5).map((g, i) => {
            const span = i === 0 ? { gridRow: '1 / 3' } : {};
            return (
              <div key={i} className="lt-img-card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', ...span }}
                onClick={() => !editMode && setLbxIdx(i)}
              >
                {g.src
                  ? <img src={g.src} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  : imgPlaceholder('100%', 'IMAGE')
                }
                <div className="lt-overlay" style={{ pointerEvents: 'none' }}>
                  <div>
                    <ET value={g.cat}   onChange={v => setA('gallery', i, 'cat', v)}   editMode={editMode} style={{ fontFamily: F.m, fontSize: '.58rem', color: C.red, letterSpacing: '.22em', marginBottom: 6, display: 'block' }} tag="div" />
                    <ET value={g.title} onChange={v => setA('gallery', i, 'title', v)} editMode={editMode} style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1rem', color: C.w, display: 'block' }} tag="div" />
                  </div>
                </div>
                {editMode && <UploadBtn onFile={v => setA('gallery', i, 'src', v)} />}
              </div>
            );
          })}
          {/* Last image spanning 2 cols */}
          {gallery[5] && (
            <div className="lt-img-card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', gridColumn: '2 / 4' }}
              onClick={() => !editMode && setLbxIdx(5)}
            >
              {gallery[5].src
                ? <img src={gallery[5].src} alt={gallery[5].title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                : imgPlaceholder('100%', 'IMAGE')
              }
              <div className="lt-overlay" style={{ pointerEvents: 'none' }}>
                <div>
                  <ET value={gallery[5].cat}   onChange={v => setA('gallery', 5, 'cat', v)}   editMode={editMode} style={{ fontFamily: F.m, fontSize: '.58rem', color: C.red, letterSpacing: '.22em', marginBottom: 6, display: 'block' }} tag="div" />
                  <ET value={gallery[5].title} onChange={v => setA('gallery', 5, 'title', v)} editMode={editMode} style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1rem', color: C.w, display: 'block' }} tag="div" />
                </div>
              </div>
              {editMode && <UploadBtn onFile={v => setA('gallery', 5, 'src', v)} />}
            </div>
          )}
        </div>
      </section>}

      {/* ══ SERVICES / PRICING ══ */}
      {sections.services && <Wrap id="services" bg={C.bg} py={120}>
        <Jp ch="価" style={{ right: 60, top: '50%', transform: 'translateY(-50%)', fontSize: '30vw', opacity: .022 }} />
        <SL num="03" title="PRESTATIONS & TARIFS" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
          {services.map((s, i) => s.visible && (
            <div key={i} className="lt-card" style={{
              background: C.card, border: `1px solid ${C.b05}`,
              padding: '40px 36px', position: 'relative', overflow: 'hidden',
            }}>
              <span style={{ position: 'absolute', top: 16, right: 20, fontFamily: F.jp, fontSize: '3.5rem', color: 'rgba(255,23,68,.06)', userSelect: 'none' }}>{s.jp}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontFamily: F.m, fontSize: '1.3rem', color: C.red }}>{s.icon}</span>
                <div style={{ textAlign: 'right' }}>
                  <ET {...t(s.price, v => setA('services', i, 'price', v), { fontFamily: F.h, fontWeight: 700, fontSize: '1.6rem', color: C.w, display: 'block' }, 'div')} />
                  <span style={{ fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.15em' }}>TARIF DE BASE</span>
                </div>
              </div>
              <div style={{ width: 28, height: 2, background: C.red, marginBottom: 16 }} />
              <ET {...t(s.title, v => setA('services', i, 'title', v), { fontFamily: F.h, fontWeight: 700, fontSize: '1.2rem', color: C.w, letterSpacing: '.04em', display: 'block', marginBottom: 12 }, 'div')} />
              <ET {...t(s.desc, v => setA('services', i, 'desc', v), { fontFamily: F.b, fontSize: '.88rem', color: C.grey, lineHeight: 1.75, display: 'block' }, 'p')} />
              {editMode && (
                <button onClick={() => setA('services', i, 'visible', false)} style={{
                  position: 'absolute', top: 8, left: 8, background: 'rgba(255,23,68,.1)',
                  border: `1px solid ${C.red}`, color: C.red, padding: '3px 8px',
                  fontFamily: F.m, fontSize: '.5rem', cursor: 'pointer',
                }}>✕ masquer</button>
              )}
            </div>
          ))}
        </div>
        {editMode && services.some(s => !s.visible) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {services.map((s, i) => !s.visible && (
              <button key={i} onClick={() => setA('services', i, 'visible', true)} style={{
                background: 'transparent', border: `1px dashed ${C.r30}`, color: C.red,
                padding: '6px 14px', fontFamily: F.m, fontSize: '.58rem', cursor: 'pointer',
              }}>+ Afficher {s.title}</button>
            ))}
          </div>
        )}
      </Wrap>}

      {/* ══ PROCESS ══ */}
      {sections.process && <Wrap id="process" bg={C.bg2} py={100}>
        <SL num="04" title="COMMENT ÇA SE PASSE ?" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {process.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {i < process.length - 1 && (
                <div style={{ position: 'absolute', top: 24, left: 'calc(100% - 16px)', width: 32, height: 1, background: `linear-gradient(90deg,${C.red},transparent)`, opacity: .3, zIndex: 0 }} />
              )}
              <div style={{ width: 48, height: 48, background: C.r08, border: `1px solid ${C.r30}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                <span style={{ fontFamily: F.jp, fontSize: '1.2rem', color: C.red }}>{p.jp}</span>
              </div>
              <ET {...t(p.num, v => setA('process', i, 'num', v), { fontFamily: F.m, fontSize: '.65rem', color: C.red, letterSpacing: '.2em', display: 'block', marginBottom: 8 }, 'div')} />
              <ET {...t(p.step, v => setA('process', i, 'step', v), { fontFamily: F.h, fontWeight: 700, fontSize: '1.1rem', color: C.w, letterSpacing: '.04em', display: 'block', marginBottom: 12 }, 'div')} />
              <ET {...t(p.desc, v => setA('process', i, 'desc', v), { fontFamily: F.b, fontSize: '.85rem', color: C.grey, lineHeight: 1.7, display: 'block' }, 'p')} />
            </div>
          ))}
        </div>
      </Wrap>}

      {/* ══ CTA BANNER ══ */}
      {sections.cta && <section style={{ position: 'relative', padding: '100px 60px', overflow: 'hidden', textAlign: 'center', background: C.bg }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%,rgba(255,23,68,.12),transparent 60%)` }} />
        <div style={{ position: 'absolute', inset: 0, border: 'none', background: `linear-gradient(to top,rgba(255,23,68,.04),transparent)` }} />
        <Jp ch="縁" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: '40vw', opacity: .02 }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(2.5rem,6vw,5rem)', color: C.w, lineHeight: .95, margin: '0 0 24px', letterSpacing: '-.01em' }}>
            <ET {...t(cta.t1, v => set('cta.t1', v), { display: 'block', color: C.w })} /><br />
            <ET {...t(cta.t2, v => set('cta.t2', v), { display: 'block', color: C.red, textShadow: `0 0 60px rgba(255,23,68,.4)` })} />
          </h2>
          <ET {...t(cta.sub, v => set('cta.sub', v), { fontFamily: F.b, fontSize: '1rem', color: C.grey, maxWidth: 500, lineHeight: 1.7, margin: '0 auto 40px', display: 'block' }, 'p')} />
          <button className="lt-btn-r" style={{
            padding: '18px 52px', background: C.red, border: 'none', color: C.w,
            fontFamily: F.h, fontWeight: 700, fontSize: '1rem', letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: `0 0 60px rgba(255,23,68,.3)`,
          }}>
            <ET {...t(cta.btn, v => set('cta.btn', v), { color: C.w })} />
          </button>
        </div>
      </section>}

    </LayoutTemplate>
  );
};

export default Decouvrir;
