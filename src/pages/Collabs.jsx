import { useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import LayoutTemplate, { C, F, ET, UploadBtn, SL, Wrap, convertBlobs } from '../components/LayoutTemplate';

const LS_KEY  = 'pf-page-collabs';
const PUB_KEY = 'pf-pub-collabs';

const JP_NUMS = ['一','二','三','四','五','六','七','八','九','十'];

let _idSeq = 1;
const mkId = () => ++_idSeq;

const DEFAULT = {
  hero: {
    tagline: 'コ ラ ボ · COLLABORATION · 共 創',
    title:   'MES COLLABORATIONS',
    sub:     'Les créatifs avec qui je travaille',
  },
  collabs: [
    { _id:1, jp:'一', name:'Nom Collab 1', role:'Photographe',   desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
    { _id:2, jp:'二', name:'Nom Collab 2', role:'Makeup Artist', desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
    { _id:3, jp:'三', name:'Nom Collab 3', role:'Styliste',      desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
    { _id:4, jp:'四', name:'Nom Collab 4', role:'Directeur Art', desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
    { _id:5, jp:'五', name:'Nom Collab 5', role:'Vidéaste',      desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
    { _id:6, jp:'六', name:'Nom Collab 6', role:'Designer',      desc:'Description courte du collaborateur, son domaine et ce que vous faites ensemble.', link:'@handle', img:null, visible:true },
  ],
  sections: { hero: true, collabs: true },
};

const SECTION_LABELS = { hero: 'Titre', collabs: 'Collaborateurs' };

const CollabCard = ({ c, editMode, onImg, onChange, onToggle, onDelete }) => (
  <div className="lt-card" style={{
    background: C.card, border: `1px solid rgba(255,255,255,.06)`,
    padding: 0, overflow: 'hidden', position: 'relative',
    opacity: c.visible ? 1 : 0.4,
  }}>
    {/* Photo */}
    <div style={{ position:'relative', paddingBottom:'100%', background:'linear-gradient(135deg,#0D0D1E,#14041A)' }}>
      {c.img
        ? <img src={c.img} alt={c.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
            <span style={{ fontFamily:F.jp, fontSize:'2.5rem', color:'rgba(255,23,68,.15)' }}>{c.jp}</span>
            <span style={{ fontFamily:F.m, fontSize:'.5rem', color:'rgba(255,255,255,.08)', letterSpacing:'.2em' }}>PHOTO</span>
          </div>
      }
      {editMode && <UploadBtn onFile={onImg} />}
      {/* JP badge */}
      <div style={{ position:'absolute', top:12, left:12, fontFamily:F.jp, fontSize:'1rem', color:C.red, background:'rgba(5,5,10,.75)', padding:'4px 10px', backdropFilter:'blur(4px)' }}>{c.jp}</div>
    </div>

    {/* Content */}
    <div style={{ padding:'20px 20px 18px' }}>
      <ET value={c.role} onChange={v=>onChange('role',v)} editMode={editMode}
        style={{ fontFamily:F.m, fontSize:'.56rem', color:C.red, letterSpacing:'.2em', display:'block', marginBottom:8, textTransform:'uppercase' }} tag="div" />
      <ET value={c.name} onChange={v=>onChange('name',v)} editMode={editMode}
        style={{ fontFamily:F.h, fontWeight:700, fontSize:'1.25rem', color:C.w, display:'block', marginBottom:10, letterSpacing:'.05em' }} tag="div" />
      <ET value={c.desc} onChange={v=>onChange('desc',v)} editMode={editMode}
        style={{ fontFamily:F.b, fontSize:'.8rem', color:C.grey, lineHeight:1.65, display:'block', marginBottom:14 }} tag="div" />

      {/* Link / Handle */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ color:C.red, fontSize:'.7rem' }}>◆</span>
        <ET value={c.link} onChange={v=>onChange('link',v)} editMode={editMode}
          style={{ fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.08em' }} />
      </div>
    </div>

    {/* Edit controls */}
    {editMode && (
      <div style={{ display:'flex', gap:6, padding:'0 16px 14px', borderTop:`1px solid rgba(255,255,255,.05)`, paddingTop:12 }}>
        <button onClick={onToggle} style={{
          flex:1, padding:'7px 0', background:'transparent', border:`1px solid rgba(255,255,255,.08)`,
          color: c.visible ? C.grey : C.red, fontFamily:F.m, fontSize:'.55rem', letterSpacing:'.1em', cursor:'pointer',
        }}>{c.visible ? '◎ VISIBLE' : '○ MASQUÉ'}</button>
        <button onClick={onDelete} style={{
          padding:'7px 14px', background:'transparent', border:`1px solid rgba(255,23,68,.2)`,
          color:'rgba(255,23,68,.5)', fontFamily:F.m, fontSize:'.55rem', cursor:'pointer',
        }}>✕</button>
      </div>
    )}
  </div>
);

const Collabs = () => {
  const [editMode,   setEditMode]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── history for undo ──────────────────────────────────────────────────────
  const [contentRaw, setContentRaw] = useState({ ...DEFAULT });
  const historyRef = useRef([]);
  const [histLen,   setHistLen]     = useState(0);

  const setContent = useCallback((updater) => {
    setContentRaw(prev => {
      historyRef.current = [...historyRef.current.slice(-20), prev];
      setHistLen(historyRef.current.length);
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  }, []);

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistLen(historyRef.current.length);
    setContentRaw(prev);
  }, []);

  const content = contentRaw;

  // ── load from storage ──────────────────────────────────────────────────────
  const applyContent = c => {
    if (!c) return;
    // ensure every collab has a stable _id
    const collabs = (c.collabs || DEFAULT.collabs).map((item, i) =>
      item._id ? item : { ...item, _id: mkId() }
    );
    setContentRaw({ ...DEFAULT, ...c, collabs, sections: { ...DEFAULT.sections, ...(c.sections || {}) } });
  };

  useEffect(() => {
    storage.get(PUB_KEY).then(pub => {
      if (pub) { applyContent(pub); return; }
      return storage.get(LS_KEY).then(d => { if (d) applyContent(d); });
    }).catch(() => {});
  }, []);

  // ── mutators ───────────────────────────────────────────────────────────────
  const set = useCallback((path, val) => {
    setContent(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
      return next;
    });
  }, [setContent]);

  const setC = useCallback((idx, field, val) => {
    setContent(prev => {
      const collabs = [...prev.collabs];
      collabs[idx] = { ...collabs[idx], [field]: val };
      return { ...prev, collabs };
    });
  }, [setContent]);

  const addCollab = () => {
    setContent(prev => ({
      ...prev,
      collabs: [...prev.collabs, {
        _id: mkId(),
        jp: JP_NUMS[prev.collabs.length % JP_NUMS.length],
        name: 'Nouveau Collab', role: 'Rôle',
        desc: 'Description du collaborateur.',
        link: '@handle', img: null, visible: true,
      }],
    }));
  };

  const delCollab = idx => {
    setContent(prev => ({ ...prev, collabs: prev.collabs.filter((_, i) => i !== idx) }));
  };

  // ── save / publish ─────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const converted = await convertBlobs(content);
      await storage.set(LS_KEY, converted);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const converted = await convertBlobs(content);
      await storage.set(PUB_KEY, converted);
      await storage.set(LS_KEY, converted);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setPublishing(false); }
  };

  const { hero, collabs, sections } = content;
  const visibleCount = collabs.filter(c => c.visible).length;

  return (
    <LayoutTemplate
      editMode={editMode} setEditMode={setEditMode}
      saving={saving} saved={saved} publishing={publishing}
      onSave={save} onPublish={publish}
      hasHistory={histLen > 0} onUndo={undo}
      sections={sections} sectionLabels={SECTION_LABELS}
      onToggleSection={k => set(`sections.${k}`, !sections[k])}
    >
      {/* ── HERO ── */}
      {sections.hero && (
        <Wrap bg={C.bg} pt={100} pb={60}
          style={{ borderBottom:`1px solid rgba(255,255,255,.05)` }}
          innerStyle={{ textAlign:'center' }}
        >
          <div style={{ fontFamily:F.jp, fontSize:'.75rem', color:C.red, letterSpacing:'.25em', marginBottom:20 }}>
            <ET value={hero.tagline} onChange={v=>set('hero.tagline',v)} editMode={editMode} />
          </div>
          <h1 style={{ fontFamily:F.h, fontWeight:900, fontSize:'clamp(2.5rem,6vw,5rem)', color:C.w, margin:'0 0 16px', letterSpacing:'.06em' }}>
            <ET value={hero.title} onChange={v=>set('hero.title',v)} editMode={editMode} />
          </h1>
          <p style={{ fontFamily:F.b, fontSize:'.9rem', color:C.grey, margin:0, letterSpacing:'.08em' }}>
            <ET value={hero.sub} onChange={v=>set('hero.sub',v)} editMode={editMode} />
          </p>
          <div style={{ width:60, height:2, background:C.red, margin:'28px auto 0' }} />
        </Wrap>
      )}

      {/* ── COLLABS GRID ── */}
      {sections.collabs && (
        <Wrap bg={C.bg2} pt={60} pb={80}>
          <SL title="コラボレーション" num={String(visibleCount).padStart(2,'0')} />

          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
            gap:24, marginTop:40,
          }}>
            {collabs.map((c, i) => (
              (!editMode && !c.visible) ? null : (
                <CollabCard
                  key={c._id}
                  c={c}
                  editMode={editMode}
                  onImg={url => setC(i,'img',url)}
                  onChange={(f,v) => setC(i,f,v)}
                  onToggle={() => setC(i,'visible',!c.visible)}
                  onDelete={() => delCollab(i)}
                />
              )
            ))}

            {/* Add button in edit mode */}
            {editMode && (
              <button onClick={addCollab} style={{
                background:'transparent', border:`1px dashed rgba(255,23,68,.3)`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:12, padding:'60px 20px', cursor:'pointer', color:C.red, minHeight:320,
                transition:'all .2s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,23,68,.04)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:'2rem', lineHeight:1 }}>＋</span>
                <span style={{ fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.2em' }}>AJOUTER UN COLLAB</span>
              </button>
            )}
          </div>
        </Wrap>
      )}
    </LayoutTemplate>
  );
};

export default Collabs;
