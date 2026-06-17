import { useRef, useEffect } from 'react';
import Carousel from './Carousel';

// ─── Texte éditable sans saut de curseur ─────────────────────────────────────
const EditableText = ({ tag: Tag = 'div', value, placeholder, isEditMode, onChange, style }) => {
  const ref = useRef(null);
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current && ref.current) {
      const target = value || placeholder || '';
      if (ref.current.textContent !== target) ref.current.textContent = target;
    }
  });

  if (!isEditMode) return <Tag style={style}>{value || placeholder}</Tag>;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      style={{ outline: 'none', cursor: 'text', ...style }}
      onFocus={() => { isEditing.current = true; }}
      onBlur={(e) => { isEditing.current = false; onChange?.(e.currentTarget.textContent); }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
};

// ─── Image pannable et zoomable ───────────────────────────────────────────────
const PannableImage = ({ src, imgX = 50, imgY = 50, imgZoom = 100, isEditMode, onUpdate }) => {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const state = useRef({ imgX, imgY, imgZoom });
  state.current = { imgX, imgY, imgZoom };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const { imgX: cx, imgY: cy } = state.current;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((last.current.x - e.clientX) / rect.width) * 100;
      const dy = ((last.current.y - e.clientY) / rect.height) * 100;
      last.current = { x: e.clientX, y: e.clientY };
      onUpdate?.({
        imgX: Math.max(0, Math.min(100, cx + dx)),
        imgY: Math.max(0, Math.min(100, cy + dy)),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onUpdate]);

  const x = imgX ?? 50;
  const y = imgY ?? 50;
  const z = imgZoom ?? 100;
  const ml = -((z - 100) * x / 100);
  const mt = -((z - 100) * y / 100);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: isEditMode ? 'grab' : 'default' }}
      onMouseDown={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ display: 'block', width: `${z}%`, height: `${z}%`, objectFit: 'cover', marginLeft: `${ml}%`, marginTop: `${mt}%` }}
      />
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VALIGN_MAP = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };

const hexAlpha = (hex, alpha) => {
  if (!hex || alpha === undefined || alpha === null || alpha >= 1) return hex || '#D4A017';
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─── Bouton moutarde ─────────────────────────────────────────────────────────
const MustardButton = ({ text }) => (
  <button style={{
    backgroundColor: '#D4A017', color: '#0D0D0D', border: 'none',
    padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer',
  }}>{text || 'Cliquez ici'}</button>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const MediaItem = ({ item, isEditMode, onUpdate }) => {
  const mustard  = hexAlpha(item.textColor || '#D4A017', item.textAlpha ?? 1);
  const grey     = hexAlpha('#BFBFBF', item.textAlpha ?? 1);
  const fontSize = item.fontSize ? `${item.fontSize}px` : null;
  const textAlign = item.textAlign || 'left';
  const vAlign   = VALIGN_MAP[item.verticalAlign] || 'flex-start';

  const editText = (placeholder, field = 'content') => ({
    value: item[field],
    placeholder,
    isEditMode,
    onChange: (v) => onUpdate?.({ [field]: v }),
  });

  // Wrapper pour centrage vertical des éléments texte
  const TextWrap = ({ children }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: vAlign }}>
      {children}
    </div>
  );

  switch (item.type) {

    // ── VISUELS ─────────────────────────────────────────────────────────────

    case 'image':
      return (
        <PannableImage
          src={item.content || 'https://picsum.photos/400/300?grayscale'}
          imgX={item.imgX} imgY={item.imgY} imgZoom={item.imgZoom}
          isEditMode={isEditMode} onUpdate={onUpdate}
        />
      );

    case 'image-fs':
      return (
        <PannableImage
          src={item.content || 'https://picsum.photos/1200/600?grayscale'}
          imgX={item.imgX} imgY={item.imgY} imgZoom={item.imgZoom}
          isEditMode={isEditMode} onUpdate={onUpdate}
        />
      );

    case 'image-caption':
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
            <PannableImage
              src={item.content || 'https://picsum.photos/400/300?grayscale'}
              imgX={item.imgX} imgY={item.imgY} imgZoom={item.imgZoom}
              isEditMode={isEditMode} onUpdate={onUpdate}
            />
          </div>
          <div style={{ padding: '10px', background: '#1A1A1A', fontSize: '0.8rem', color: mustard, flexShrink: 0 }}>
            Légende de l'image
          </div>
        </div>
      );

    case 'polaroid':
      return (
        <div style={{ background: '#F2F2F2', padding: '10px 10px 30px 10px', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <PannableImage
            src={item.content || 'https://picsum.photos/300/300?grayscale'}
            imgX={item.imgX} imgY={item.imgY} imgZoom={item.imgZoom}
            isEditMode={isEditMode} onUpdate={onUpdate}
          />
        </div>
      );

    case 'gallery': {
      const images = Array.isArray(item.content)
        ? item.content
        : [1, 2, 3, 4].map((i) => `https://picsum.photos/200/200?random=${i}&grayscale`);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '5px', height: '100%', padding: '5px', boxSizing: 'border-box' }}>
          {images.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ))}
        </div>
      );
    }

    case 'carousel':
      return <Carousel items={item.content} />;

    // ── VIDÉO ────────────────────────────────────────────────────────────────

    case 'video':
      return <video src={item.content} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;

    case 'video-bg':
      return <video src={item.content} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;

    case 'video-overlay':
      return (
        <div style={{ position: 'relative', height: '100%' }}>
          <video src={item.content} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '80%' }}>
            <h2 style={{ color: mustard, margin: 0 }}>Titre Vidéo Overlay</h2>
          </div>
        </div>
      );

    // ── TEXTE ────────────────────────────────────────────────────────────────

    case 'h1':
      return (
        <TextWrap>
          <EditableText tag="h1" {...editText('Titre Principal')}
            style={{ color: mustard, fontSize: fontSize || '2rem', textAlign, margin: 0, padding: '10px', fontWeight: 'bold', lineHeight: 1.2 }} />
        </TextWrap>
      );

    case 'text':
      return (
        <TextWrap>
          <EditableText tag="div" {...editText('Votre texte ici...')}
            style={{ color: grey, fontSize: fontSize || '1rem', textAlign, padding: '15px', lineHeight: 1.6 }} />
        </TextWrap>
      );

    case 'quote':
      return (
        <TextWrap>
          <div style={{ borderLeft: `4px solid ${mustard}`, padding: '10px 20px' }}>
            <EditableText tag="blockquote" {...editText('"La simplicité est la sophistication suprême."')}
              style={{ color: grey, fontSize: fontSize || '1rem', textAlign, fontStyle: 'italic', margin: 0 }} />
          </div>
        </TextWrap>
      );

    case 'story':
      return (
        <TextWrap>
          <div style={{ padding: '20px', color: grey }}>
            <h3 style={{ color: mustard, marginTop: 0 }}>Notre Histoire</h3>
            <EditableText tag="p" {...editText('Il était une fois dans un monde de design...')}
              style={{ fontSize: fontSize || '1rem', textAlign, margin: 0, lineHeight: 1.6 }} />
          </div>
        </TextWrap>
      );

    case 'cta':
      return (
        <TextWrap>
          <div style={{ display: 'flex', justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center', padding: '0 15px' }}>
            <button style={{
              backgroundColor: mustard, color: '#0D0D0D', border: 'none',
              padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: fontSize || '1rem',
            }}>
              {item.content || 'Cliquez ici'}
            </button>
          </div>
        </TextWrap>
      );

    // ── STRUCTURE ────────────────────────────────────────────────────────────

    case 'spacer':
      return <div style={{ height: '100%' }} />;

    case 'divider':
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <hr style={{ width: '80%', borderColor: '#2E2E2E', margin: '0 auto' }} />
        </div>
      );

    case 'card':
      return (
        <div style={{ padding: '20px', height: '100%', border: '1px solid #2E2E2E', boxSizing: 'border-box' }}>
          <h4 style={{ color: mustard, marginTop: 0 }}>Service Gold</h4>
          <p style={{ fontSize: '0.8rem', color: grey }}>Description premium de l'offre.</p>
        </div>
      );

    case 'timeline':
      return (
        <div style={{ padding: '20px', borderLeft: `1px solid ${mustard}`, marginLeft: '20px', height: '100%', color: grey }}>
          <div style={{ marginBottom: '15px' }}>● 2024 — Lancement</div>
          <div>● 2023 — Concept</div>
        </div>
      );

    case 'counter':
      return (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: fontSize || '2rem', fontWeight: 'bold', color: mustard }}>99+</div>
          <div style={{ fontSize: '0.7rem', color: grey }}>Projets Terminés</div>
        </div>
      );

    // ── INTERACTION ──────────────────────────────────────────────────────────

    case 'skills':
      return (
        <div style={{ padding: '15px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {['React', 'Vite', 'Design', 'UI/UX'].map((s) => (
            <span key={s} style={{ padding: '4px 10px', background: '#2E2E2E', borderRadius: '15px', fontSize: '0.75rem', color: mustard }}>{s}</span>
          ))}
        </div>
      );

    case 'contact':
      return (
        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="Email" style={{ background: '#0D0D0D', border: '1px solid #2E2E2E', padding: '8px', color: 'white' }} />
          <textarea placeholder="Message" style={{ background: '#0D0D0D', border: '1px solid #2E2E2E', padding: '8px', color: 'white', height: '60px' }} />
          <MustardButton text="Envoyer" />
        </div>
      );

    case 'audio':
      return (
        <div style={{ padding: '10px', background: '#1A1A1A', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: mustard, marginRight: '10px' }} />
          <span style={{ fontSize: '0.8rem', color: grey }}>Podcast_Episode_01.mp3</span>
        </div>
      );

    default:
      return <div style={{ padding: '20px', color: '#B58910' }}>Composant : {item.type}</div>;
  }
};

export default MediaItem;
