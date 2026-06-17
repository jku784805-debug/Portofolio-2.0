import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ── TOKENS ────────────────────────────────────────────────────────────────────
export const C = {
  bg:'#05050A', bg2:'#0A0A14', bg3:'#10101C', card:'#0D0D1E',
  red:'#FF1744', gold:'#C49A3C',
  w:'#F0F0F5', grey:'#70708A',
  b05:'rgba(255,255,255,.05)', b10:'rgba(255,255,255,.10)',
  r30:'rgba(255,23,68,.30)', r08:'rgba(255,23,68,.08)',
};
export const F = {
  h:"'Rajdhani','Arial Black',sans-serif",
  b:"'Space Grotesk',system-ui,sans-serif",
  m:"'Space Mono','Courier New',monospace",
  jp:"'Noto Serif JP',serif",
};

const PAGES = [
  { path:'/', label:'Accueil' },
  { path:'/decouvrir', label:'Découvrir' },
  { path:'/galerie', label:'Galerie' },
  { path:'/disponibilites', label:'Disponibilités' },
  { path:'/contact', label:'Contact' },
];

// ── CSS shared with all layout pages ─────────────────────────────────────────
export function useLayoutStyles() {
  useEffect(() => {
    const id = 'lt-anim';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes lt-pulse{0%,100%{opacity:1}50%{opacity:.15}}
      @keyframes lt-scan{from{transform:translateY(-100%)}to{transform:translateY(130vh)}}
      @keyframes lt-blink{0%,100%{opacity:1}49%{opacity:1}50%,80%{opacity:0}81%{opacity:1}}
      @keyframes lt-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      .lt-nav-a{text-decoration:none;transition:color .2s!important;cursor:pointer}
      .lt-nav-a:hover{color:#FF1744!important}
      .lt-btn-r{transition:background .2s,transform .2s!important;cursor:pointer}
      .lt-btn-r:hover{background:#E00030!important;transform:translateY(-2px)!important}
      .lt-btn-o{transition:border-color .2s,color .2s,transform .2s!important;cursor:pointer}
      .lt-btn-o:hover{border-color:#FF1744!important;color:#FF1744!important;transform:translateY(-2px)!important}
      .lt-card{transition:transform .4s,box-shadow .4s,background .3s!important}
      .lt-card:hover{transform:translateY(-6px)!important;background:#14142A!important;box-shadow:0 24px 60px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,23,68,.35)!important}
      .lt-img-card{overflow:hidden;position:relative}
      .lt-img-card img{transition:transform .7s!important;width:100%;height:100%;object-fit:cover;display:block}
      .lt-img-card:hover img{transform:scale(1.07)!important}
      .lt-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,5,10,.97) 0%,transparent 55%);opacity:0;transition:opacity .4s;display:flex;align-items:flex-end;padding:24px;pointer-events:none}
      .lt-img-card:hover .lt-overlay{opacity:1!important}
      .lt-et{outline:1px dashed rgba(255,23,68,.35)!important;outline-offset:2px;min-width:4px;transition:outline-color .15s,background .15s!important}
      .lt-et:hover{outline-color:rgba(255,23,68,.9)!important;background:rgba(255,23,68,.06)!important}
      .lt-et:focus{outline:2px solid #FF1744!important;background:rgba(255,23,68,.08)!important}
      .lt-upload{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,0);transition:background .2s;z-index:5}
      .lt-upload:hover{background:rgba(0,0,0,.75)!important}
      .lt-upload span{opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}
      .lt-upload:hover span{opacity:1!important}
      .lt-input{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);color:#F0F0F5;padding:13px 16px;font-family:'Space Grotesk',system-ui;font-size:.9rem;outline:none;transition:border-color .3s;width:100%;box-sizing:border-box}
      .lt-input::placeholder{color:rgba(112,112,138,.6)}
      .lt-input:focus{border-color:rgba(255,23,68,.5)}
      .lt-filter{background:transparent;border:1px solid rgba(255,255,255,.1);color:#70708A;padding:8px 20px;font-family:'Space Mono',monospace;font-size:.62rem;letter-spacing:.12em;cursor:pointer;transition:all .2s}
      .lt-filter:hover,.lt-filter.on{background:#FF1744;border-color:#FF1744;color:#fff}
      .lt-lbx{animation:lt-fadein .25s ease}
      [contenteditable]{caret-color:#FF1744}
    `;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, []);
}

// ── EDITABLE TEXT ─────────────────────────────────────────────────────────────
export const ET = ({ value, onChange, style, tag: Tag = 'span', editMode, ph = '—' }) => {
  const ref  = useRef(null);
  const live = useRef(false);
  useEffect(() => {
    if (!live.current && ref.current) {
      const t = value ?? ph;
      if (ref.current.textContent !== t) ref.current.textContent = t;
    }
  });
  if (!editMode) return <Tag style={style}>{value ?? ph}</Tag>;
  return (
    <Tag ref={ref} contentEditable suppressContentEditableWarning
      className="lt-et" title="Cliquer pour modifier"
      style={{ outline: 'none', cursor: 'text', ...style }}
      onFocus={() => { live.current = true; }}
      onBlur={e => { live.current = false; onChange?.(e.currentTarget.textContent.trim()); }}
      onMouseDown={e => e.stopPropagation()}
      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && Tag !== 'p') e.preventDefault(); }}
    />
  );
};

// ── UPLOAD OVERLAY ────────────────────────────────────────────────────────────
export const UploadBtn = ({ onFile, label = 'IMAGE', accept = 'image/*' }) => {
  const r = useRef(null);
  return (
    <>
      <button className="lt-upload" onClick={e => { e.stopPropagation(); r.current?.click(); }}>
        <span style={{ fontFamily: F.m, fontSize: '.6rem', color: C.red }}>
          📁 CHANGER {label}<br /><span style={{ opacity: .5 }}>JPG · PNG · WEBP</span>
        </span>
      </button>
      <input ref={r} type="file" accept={accept} hidden
        onChange={e => { const f = e.target.files[0]; if (f) onFile(URL.createObjectURL(f)); e.target.value = ''; }}
      />
    </>
  );
};

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
export const SL = ({ num, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
    <span style={{ fontFamily: F.m, fontSize: '.7rem', color: C.red, letterSpacing: '.1em' }}>{num}</span>
    <div style={{ width: 28, height: 1, background: C.red }} />
    <span style={{ fontFamily: F.b, fontSize: '.7rem', color: C.grey, letterSpacing: '.3em', textTransform: 'uppercase' }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: C.b05 }} />
  </div>
);

// ── JAPANESE DECO ─────────────────────────────────────────────────────────────
export const Jp = ({ ch, style = {} }) => (
  <span style={{
    position: 'absolute', pointerEvents: 'none', userSelect: 'none',
    fontFamily: F.jp, fontWeight: 900, color: 'rgba(255,23,68,.05)', lineHeight: 1, ...style,
  }}>{ch}</span>
);

// ── SECTION WRAPPER ───────────────────────────────────────────────────────────
export const Wrap = ({ id, bg = C.bg, py = 120, children }) => (
  <section id={id} style={{ position: 'relative', overflow: 'hidden', background: bg, padding: `${py}px 0` }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 60px' }}>{children}</div>
  </section>
);

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
export const Lightbox = ({ items, idx, onClose, setIdx }) => {
  const n = items.length;
  useEffect(() => {
    if (idx === null) return;
    const h = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + n) % n);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, n]);

  if (idx === null || !items[idx]) return null;
  const g = items[idx];
  const nb = (side, fn) => (
    <button onClick={e => { e.stopPropagation(); fn(); }} style={{
      position: 'absolute', [side]: 20, top: '50%', transform: 'translateY(-50%)',
      background: 'rgba(255,255,255,.06)', border: `1px solid ${C.r30}`,
      color: C.w, width: 48, height: 48, fontSize: '1.2rem', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{side === 'left' ? '←' : '→'}</button>
  );
  return (
    <div className="lt-lbx" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.96)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      {nb('left',  () => setIdx(i => (i - 1 + n) % n))}
      {nb('right', () => setIdx(i => (i + 1) % n))}
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: `1px solid ${C.b10}`, color: C.w, width: 40, height: 40, fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {g.src
          ? <img src={g.src} alt={g.title} style={{ maxWidth: '88vw', maxHeight: '80vh', objectFit: 'contain' }} />
          : <div style={{ width: '60vw', height: '60vh', background: 'linear-gradient(135deg,#0D0D1E,#14041A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: F.m, fontSize: '.7rem', color: 'rgba(255,255,255,.15)' }}>AUCUNE IMAGE</span>
            </div>
        }
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: F.m, fontSize: '.58rem', color: C.red, letterSpacing: '.2em', marginBottom: 6 }}>{g.cat}</div>
          <div style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.1rem', color: C.w }}>{g.title}</div>
          <div style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, marginTop: 6 }}>{idx + 1} / {n}</div>
        </div>
      </div>
    </div>
  );
};

// ── IMAGE PERSISTENCE ─────────────────────────────────────────────────────────
export const blobToBase64 = blobUrl => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const MAX = 1200;
    const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(img.width  * ratio);
    canvas.height = Math.round(img.height * ratio);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = () => resolve(null);
  img.src = blobUrl;
});

export const convertBlobs = async obj => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && v.startsWith('blob:')) {
      out[k] = await blobToBase64(v);
    } else if (v && typeof v === 'object') {
      out[k] = await convertBlobs(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

// ── EDIT BAR (for non-home pages) ─────────────────────────────────────────────
export const SimpleEditBar = ({ onSave, onReset, saving, saved, onFinish, onUndo, hasHistory, sections, onToggleSection, sectionLabels }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#0D0D1E', border: `1px solid ${saved ? '#4CAF50' : C.red}`, borderRadius: 8,
      padding: '10px 16px', zIndex: 99998, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 40px rgba(0,0,0,.85), 0 0 20px rgba(255,23,68,.18)',
      flexWrap: 'wrap', maxWidth: '96vw', justifyContent: 'center',
      transition: 'border-color .3s',
    }}>
      {open && sections && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#0D0D1E', border: `1px solid rgba(255,255,255,.08)`, borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', minWidth: 320 }}>
          {Object.keys(sections).map(k => (
            <button key={k} onClick={() => onToggleSection(k)} style={{
              background: sections[k] ? 'rgba(255,23,68,.12)' : 'transparent',
              border: `1px solid ${sections[k] ? C.red : 'rgba(255,255,255,.08)'}`,
              color: sections[k] ? C.red : C.grey,
              padding: '5px 12px', fontFamily: F.m, fontSize: '.6rem', letterSpacing: '.08em', cursor: 'pointer', borderRadius: 3,
            }}>{sections[k] ? '✓ ' : '✕ '}{sectionLabels?.[k] || k}</button>
          ))}
        </div>
      )}
      <span style={{ fontFamily: F.m, fontSize: '.58rem', color: saved ? '#4CAF50' : C.red, letterSpacing: '.15em' }}>
        {saved ? '✓ SAUVEGARDÉ' : saving ? '⏳ SAUVEGARDE...' : '✎ MODE ÉDITION'}
      </span>
      {sections && (
        <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,.08)`, color: C.grey, padding: '6px 12px', fontFamily: F.m, fontSize: '.6rem', cursor: 'pointer', borderRadius: 3 }}>☰ SECTIONS</button>
      )}
      <button onClick={onUndo} disabled={!hasHistory} style={{
        background: 'transparent', border: `1px solid ${hasHistory ? 'rgba(196,154,60,.5)' : 'rgba(255,255,255,.06)'}`,
        color: hasHistory ? C.gold : 'rgba(112,112,138,.3)',
        padding: '8px 14px', fontFamily: F.m, fontSize: '.62rem', letterSpacing: '.08em',
        cursor: hasHistory ? 'pointer' : 'default', borderRadius: 3, transition: 'all .2s',
      }} title="Annuler la dernière modification (Ctrl+Z)">↺ ANNULER</button>
      <button onClick={onSave} disabled={saving} style={{
        background: saved ? '#4CAF50' : C.red, border: 'none', color: '#fff',
        padding: '8px 18px', fontFamily: F.m, fontSize: '.65rem', letterSpacing: '.1em',
        cursor: saving ? 'wait' : 'pointer', borderRadius: 3, transition: 'background .3s', opacity: saving ? .7 : 1,
      }}>
        {saving ? '⏳ En cours...' : saved ? '✓ Sauvegardé !' : '💾 SAUVEGARDER'}
      </button>
      <button onClick={onFinish} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,.1)`, color: C.grey, padding: '8px 14px', fontFamily: F.m, fontSize: '.6rem', cursor: 'pointer', borderRadius: 3 }}>✓ TERMINER</button>
    </div>
  );
};

// ── LAYOUT TEMPLATE ───────────────────────────────────────────────────────────
const LayoutTemplate = ({ children, editMode, setEditMode, onSave, onReset, saving, saved, pageId, onUndo, hasHistory, sections, onToggleSection, sectionLabels }) => {
  useLayoutStyles();
  const { pathname } = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const [progress, setProgress] = useState(0);
  const scrollerRef = useRef(null);

  const [nav, setNav] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pf-nav') || '{}');
      return { logo: p?.nav?.logo || 'Khun.MacJ', logoJp: p?.nav?.logoJp || '写真家', cta: p?.nav?.cta || 'Réserver' };
    } catch { return { logo: 'Khun.MacJ', logoJp: '写真家', cta: 'Réserver' }; }
  });

  const [footer, setFooter] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pf-nav') || '{}');
      return {
        copyright: p?.footer?.copyright || '© 2025 · TOUS DROITS RÉSERVÉS',
        social1:   p?.footer?.social1   || 'INSTAGRAM',
        social2:   p?.footer?.social2   || 'FACEBOOK',
        social3:   p?.footer?.social3   || 'PINTEREST',
      };
    } catch { return { copyright: '© 2025 · TOUS DROITS RÉSERVÉS', social1: 'INSTAGRAM', social2: 'FACEBOOK', social3: 'PINTEREST' }; }
  });

  const saveNavStore = (navData, footerData) => {
    try { localStorage.setItem('pf-nav', JSON.stringify({ nav: navData, footer: footerData })); } catch {}
  };

  const setNavField = (key, val) => {
    setNav(p => {
      const next = { ...p, [key]: val };
      setFooter(f => { saveNavStore(next, f); return f; });
      return next;
    });
  };

  const setFooterField = (key, val) => {
    setFooter(p => {
      const next = { ...p, [key]: val };
      setNav(n => { saveNavStore(n, next); return n; });
      return next;
    });
  };

  const onScroll = e => {
    const t = e.currentTarget, s = t.scrollTop, max = t.scrollHeight - t.clientHeight;
    setScrollY(s);
    setProgress(max > 0 ? s / max * 100 : 0);
  };

  const pinned = scrollY > 50;

  return (
    <div ref={scrollerRef} onScroll={onScroll}
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: C.bg, color: C.w }}
    >
      {/* Progress */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: 2, width: `${progress}%`, background: C.red, zIndex: 10001, boxShadow: `0 0 10px rgba(255,23,68,.7)`, transition: 'width .1s' }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px',
        background: pinned ? 'rgba(5,5,10,.94)' : 'transparent',
        backdropFilter: pinned ? 'blur(20px)' : 'none',
        borderBottom: pinned ? `1px solid ${C.b05}` : 'none',
        transition: 'background .4s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: editMode ? 'default' : 'pointer' }}
          onClick={editMode ? undefined : () => window.location.href = '/'}>
          <div style={{ width: 6, height: 6, background: C.red, borderRadius: '50%', boxShadow: `0 0 12px ${C.red}`, animation: 'lt-blink 4s infinite' }} />
          <ET value={nav.logo} onChange={v => setNavField('logo', v)} editMode={editMode}
            style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.05rem', color: C.w, letterSpacing: '.15em' }} />
          <ET value={nav.logoJp} onChange={v => setNavField('logoJp', v)} editMode={editMode}
            style={{ fontFamily: F.jp, fontSize: '.75rem', color: C.grey, marginLeft: 6 }} />
        </div>

        {/* Nav links */}
        <ul style={{ display: 'flex', gap: 36, listStyle: 'none', margin: 0, padding: 0 }}>
          {PAGES.map(p => {
            const active = pathname === p.path;
            return (
              <li key={p.path}>
                <Link to={p.path} className="lt-nav-a" style={{
                  fontFamily: F.b, fontSize: '.78rem', letterSpacing: '.08em',
                  color: active ? C.red : C.grey,
                }}>
                  {p.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/contact" className="lt-btn-r" style={{
            padding: '8px 20px', background: C.red, color: C.w,
            fontFamily: F.h, fontWeight: 700, fontSize: '.75rem', letterSpacing: '.15em', textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            <ET value={nav.cta} onChange={v => setNavField('cta', v)} editMode={editMode} style={{ color: C.w }} />
          </Link>
          <button className="lt-btn-o"
            onClick={() => setEditMode(m => !m)}
            style={{
              padding: '8px 16px',
              background: editMode ? 'rgba(255,23,68,.1)' : 'transparent',
              border: `1px solid ${editMode ? C.red : C.b10}`,
              color: editMode ? C.red : C.grey,
              fontFamily: F.m, fontSize: '.65rem', letterSpacing: '.1em',
            }}
          >{editMode ? '✓ ÉDITION' : '✏ ÉDITER'}</button>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ paddingTop: 64 }}>{children}</div>

      {/* Footer */}
      <footer style={{
        background: C.bg2, borderTop: `1px solid ${C.b05}`,
        padding: '40px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        {/* Logo footer — cliquable hors édition, éditable en mode édition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: editMode ? 'default' : 'pointer', textDecoration: 'none' }}
          onClick={editMode ? undefined : () => window.location.href = '/'}>
          <div style={{ width: 6, height: 6, background: C.red, borderRadius: '50%' }} />
          <ET value={nav.logo} onChange={v => setNavField('logo', v)} editMode={editMode}
            style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1rem', color: C.w, letterSpacing: '.15em' }} />
          <ET value={nav.logoJp} onChange={v => setNavField('logoJp', v)} editMode={editMode}
            style={{ fontFamily: F.jp, fontSize: '.7rem', color: C.grey, marginLeft: 6 }} />
        </div>

        {/* Copyright */}
        <ET value={footer.copyright} onChange={v => setFooterField('copyright', v)} editMode={editMode}
          style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.1em' }} />

        {/* Liens sociaux */}
        <div style={{ display: 'flex', gap: 24 }}>
          {(['social1', 'social2', 'social3']).map(k => (
            <ET key={k} value={footer[k]} onChange={v => setFooterField(k, v)} editMode={editMode}
              style={{ fontFamily: F.m, fontSize: '.58rem', color: C.grey, letterSpacing: '.12em', cursor: editMode ? 'text' : 'pointer', transition: 'color .2s' }}
              tag="span"
            />
          ))}
        </div>
      </footer>

      {/* Edit bar */}
      {editMode && (
        <SimpleEditBar
          onSave={onSave}
          onReset={onReset}
          saving={saving}
          saved={saved}
          onFinish={() => setEditMode(false)}
          onUndo={onUndo}
          hasHistory={hasHistory}
          sections={sections}
          onToggleSection={onToggleSection}
          sectionLabels={sectionLabels}
        />
      )}
    </div>
  );
};

export default LayoutTemplate;
