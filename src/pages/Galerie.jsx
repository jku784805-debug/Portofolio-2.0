import { useState, useCallback, useRef, useEffect } from 'react';
import { idb } from '../lib/idb';
import LayoutTemplate, { C, F, ET, UploadBtn, SL, Jp, Lightbox, blobToBase64, convertBlobs } from '../components/LayoutTemplate';

const LS_KEY = 'pf-page-galerie';

const INIT_GALLERY = Array.from({ length: 9 }, (_, i) => ({
  src: null,
  title: `Titre image ${i + 1}`,
  cat: ['Catégorie A', 'Catégorie B', 'Catégorie C'][i % 3],
  visible: true,
}));

const DEFAULT = {
  hero: {
    tagline: '写 真 · イメージ · IMAGES',
    title: 'GALERIE',
    sub: 'Toutes mes créations visuelles',
  },
  gallery: INIT_GALLERY,
  sections: { hero: true, gallery: true },
};

const SECTION_LABELS = { hero: 'Titre', gallery: 'Galerie' };

const GalCard = ({ g, editMode, onSrc, onCat, onTitle, onOpen, style }) => (
  <div className="lt-img-card" style={{ cursor: editMode ? 'default' : 'pointer', ...style }}
    onClick={editMode ? undefined : onOpen}
  >
    {g.src
      ? <img src={g.src} alt={g.title} />
      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0D0D1E,#14041A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: F.m, fontSize: '.55rem', color: 'rgba(255,255,255,.12)', letterSpacing: '.25em' }}>IMAGE</span>
        </div>
    }
    <div className="lt-overlay" style={{ pointerEvents: 'none' }}>
      <div>
        <ET value={g.cat}   onChange={onCat}   editMode={editMode} style={{ fontFamily: F.m, fontSize: '.58rem', color: C.red, letterSpacing: '.22em', marginBottom: 6, display: 'block' }} tag="div" />
        <ET value={g.title} onChange={onTitle} editMode={editMode} style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1rem', color: C.w, display: 'block' }} tag="div" />
      </div>
    </div>
    {editMode && <UploadBtn onFile={onSrc} />}
  </div>
);

const Galerie = () => {
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [filter,   setFilter]   = useState('Tout');
  const [lbxIdx,   setLbxIdx]   = useState(null);

  const [content, setContent] = useState({ ...DEFAULT });

  useEffect(() => {
    idb.get(LS_KEY).then(parsed => {
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

  const setG = useCallback((idx, key, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      next.gallery[idx][key] = val;
      return next;
    });
  }, []);

  const addPhoto = () => {
    setContent(prev => ({
      ...prev,
      gallery: [...prev.gallery, { src: null, title: 'Nouvelle image', cat: 'Catégorie A', visible: true }],
    }));
  };

  const removePhoto = idx => {
    if (!confirm('Supprimer cette image ?')) return;
    setContent(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true); setSaved(false);
    try {
      const converted = await convertBlobs(content);
      setContent(converted);
      await idb.set(LS_KEY, converted);
      setSaving(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaving(false);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const onReset = () => {
    if (!confirm('Réinitialiser la galerie ?')) return;
    idb.del(LS_KEY).catch(() => {});
    setContent({ ...DEFAULT }); setSaved(false);
  };

  const t = (val, onChange, style, tag = 'span') => ({ value: val, onChange, style, tag, editMode });
  const { hero, gallery, sections } = content;
  const cats = ['Tout', ...new Set(gallery.map(g => g.cat))];
  const visible = gallery.filter(g => g.visible);
  const filtered = visible.filter(g => filter === 'Tout' || g.cat === filter);
  const lbxItems = filtered;

  return (
    <LayoutTemplate
      editMode={editMode} setEditMode={setEditMode}
      onSave={onSave} onReset={onReset}
      saving={saving} saved={saved}
      pageId="galerie"
      onUndo={undo} hasHistory={hasHistory}
      sections={sections} onToggleSection={toggleSection}
      sectionLabels={SECTION_LABELS}
    >
      <Lightbox items={lbxItems} idx={lbxIdx} onClose={() => setLbxIdx(null)} setIdx={setLbxIdx} />

      {/* ══ HERO ══ */}
      {sections.hero && <section style={{ position: 'relative', paddingTop: 80, paddingBottom: 80, overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 80%,rgba(255,23,68,.06),transparent 60%),${C.bg}` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
        <Jp ch="写" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: '45vw', opacity: .02 }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <ET {...t(hero.tagline, v => set('hero.tagline', v), { fontFamily: F.jp, fontSize: '.7rem', color: C.red, letterSpacing: '.5em', marginBottom: 24, display: 'block' }, 'div')} />
          <h1 style={{ fontFamily: F.h, fontWeight: 700, fontSize: 'clamp(4rem,12vw,11rem)', color: C.w, lineHeight: .9, margin: '0 0 24px', letterSpacing: '-.02em' }}>
            <ET {...t(hero.title, v => set('hero.title', v), { display: 'block', color: C.w })} />
          </h1>
          <ET {...t(hero.sub, v => set('hero.sub', v), { fontFamily: F.b, fontSize: '1rem', color: C.grey, letterSpacing: '.2em', display: 'block' }, 'p')} />
        </div>
      </section>}

      {/* ══ FILTERS + GALLERY ══ */}
      {sections.gallery && (
        <>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '32px 60px', background: C.bg2, borderBottom: `1px solid ${C.b05}` }}>
          {cats.map(cat => (
            <button key={cat} className={`lt-filter${filter === cat ? ' on' : ''}`} onClick={() => setFilter(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <section style={{ padding: '48px 60px 80px', background: C.bg, minHeight: '60vh' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: C.grey, fontFamily: F.m, fontSize: '.7rem', letterSpacing: '.2em' }}>
              AUCUNE IMAGE
            </div>
          ) : (
            <div style={{ columns: 3, columnGap: 6 }}>
              {filtered.map((g, fi) => {
                const origIdx = gallery.indexOf(g);
                return (
                  <div key={origIdx} style={{ breakInside: 'avoid', marginBottom: 6, position: 'relative' }}>
                    <GalCard
                      g={g}
                      editMode={editMode}
                      onSrc={v => setG(origIdx, 'src', v)}
                      onCat={v => setG(origIdx, 'cat', v)}
                      onTitle={v => setG(origIdx, 'title', v)}
                      onOpen={() => setLbxIdx(fi)}
                      style={{ width: '100%', display: 'block' }}
                    />
                    {editMode && (
                      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, zIndex: 10 }}>
                        <button onClick={() => setG(origIdx, 'visible', !g.visible)} style={{
                          background: g.visible ? 'rgba(76,175,80,.2)' : 'rgba(255,23,68,.2)',
                          border: `1px solid ${g.visible ? '#4CAF50' : C.red}`,
                          color: g.visible ? '#4CAF50' : C.red,
                          padding: '3px 8px', fontFamily: F.m, fontSize: '.52rem', cursor: 'pointer',
                        }}>{g.visible ? '👁' : '🚫'}</button>
                        <button onClick={() => removePhoto(origIdx)} style={{
                          background: 'rgba(255,23,68,.15)', border: `1px solid ${C.red}`,
                          color: C.red, padding: '3px 8px', fontFamily: F.m, fontSize: '.52rem', cursor: 'pointer',
                        }}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {editMode && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <button onClick={addPhoto} style={{
                background: 'transparent', border: `1px dashed ${C.r30}`, color: C.red,
                padding: '16px 40px', fontFamily: F.m, fontSize: '.7rem', letterSpacing: '.2em', cursor: 'pointer',
              }}>+ AJOUTER UNE IMAGE</button>
            </div>
          )}
        </section>
        </>
      )}

    </LayoutTemplate>
  );
};

export default Galerie;
