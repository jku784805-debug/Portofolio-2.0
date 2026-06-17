import { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import MediaItem from './MediaItem';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// ─── Constantes ─────────────────────────────────────────────────────────────

const DEFAULT_SHADOW = {
  enabled: false, offsetX: 0, offsetY: 4, blur: 12, spread: 0,
  color: '#000000', alpha: 0.35, inset: false,
};

const IMAGE_TYPES = ['image', 'image-fs', 'image-caption', 'polaroid'];
const VIDEO_TYPES = ['video', 'video-bg', 'video-overlay'];
const TEXT_TYPES  = ['h1', 'text', 'quote', 'story', 'cta'];
const makeItem = (overrides) => ({
  zIndex: 1,
  shadow: { ...DEFAULT_SHADOW },
  fontSize: null,
  textColor: null,
  textAlign: 'left',
  verticalAlign: 'top',
  textAlpha: 1,
  bgColor: '#1A1A1A',
  bgAlpha: 1,
  imgX: 50,
  imgY: 50,
  imgZoom: 100,
  ...overrides,
});

const hexAlpha = (hex, alpha) => {
  if (!hex || alpha === undefined || alpha === null || alpha >= 1) return hex || '#1A1A1A';
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

const getShadowStyle = (shadow) => {
  if (!shadow?.enabled) return {};
  const hex = shadow.color || '#000000';
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const { inset, offsetX, offsetY, blur, spread, alpha } = shadow;
  return { boxShadow: `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(${r},${g},${b},${alpha ?? 0.35})` };
};

// ─── Hook : panel flottant déplaçable ────────────────────────────────────────

const useDraggablePanel = (defaultRight, defaultTop) => {
  const [pos, setPos] = useState({ x: null, y: null });
  const drag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.active) return;
      setPos({ x: drag.current.ox + (e.clientX - drag.current.startX), y: drag.current.oy + (e.clientY - drag.current.startY) });
    };
    const onUp = () => { drag.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const onTitleMouseDown = (e) => {
    e.preventDefault();
    drag.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      ox: pos.x ?? (window.innerWidth - defaultRight),
      oy: pos.y ?? defaultTop,
    };
  };

  const style = pos.x !== null ? { left: pos.x, top: pos.y, right: 'auto' } : {};
  return { style, onTitleMouseDown };
};

// ─── Composant principal ─────────────────────────────────────────────────────

const GridEditor = ({ isEditMode }) => {
  const [items, setItems] = useState([
    makeItem({ i: '1', x: 0, y: 0, w: 8, h: 4, type: 'carousel' }),
    makeItem({ i: '2', x: 8, y: 0, w: 4, h: 4, type: 'about', content: 'Portfolio Designer' }),
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [textOpen,   setTextOpen]   = useState(false);

  const shadowPanel = useDraggablePanel(20, 70);
  const textPanel   = useDraggablePanel(280, 70);

  const selectedItem = items.find((it) => it.i === selectedId) ?? null;

  // ── Sélection ───────────────────────────────────────────────────────────────

  const handleSelect = (id) => {
    if (!isEditMode) return;
    if (selectedId !== id) { setShadowOpen(false); setTextOpen(false); }
    setSelectedId(id);
  };

  const handleDeselect = () => { setSelectedId(null); setShadowOpen(false); setTextOpen(false); };

  // ── Mises à jour ─────────────────────────────────────────────────────────────

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.i === id ? { ...it, ...patch } : it)));

  const updateShadow = (id, patch) =>
    setItems((prev) => prev.map((it) =>
      it.i === id ? { ...it, shadow: { ...(it.shadow ?? DEFAULT_SHADOW), ...patch } } : it
    ));

  // ── Drop Toolbox ────────────────────────────────────────────────────────────

  const onDropFromToolbox = (layout, layoutItem, event) => {
    const data = event.dataTransfer.getData('application/json');
    if (!data) return;
    const toolboxItem = JSON.parse(data);
    const id = `item-${Date.now()}`;
    const newItem = makeItem({
      ...toolboxItem, i: id,
      x: layoutItem.x, y: layoutItem.y,
      w: toolboxItem.w || 4, h: toolboxItem.h || 3,
      zIndex: items.length + 1,
    });
    setItems((prev) => [...prev, newItem]);
    setSelectedId(id);
    setShadowOpen(false);
    setTextOpen(false);
  };

  // ── Layout sync ──────────────────────────────────────────────────────────────

  const onLayoutChange = (currentLayout) =>
    setItems((prev) => prev.map((it) => {
      const l = currentLayout.find((ll) => ll.i === it.i);
      return l ? { ...it, x: l.x, y: l.y, w: l.w, h: l.h } : it;
    }));

  // ── Suppression ─────────────────────────────────────────────────────────────

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.i !== id));
    setSelectedId(null); setShadowOpen(false); setTextOpen(false);
  };

  // ── Calques ──────────────────────────────────────────────────────────────────

  const updateZIndex = (id, dir) =>
    setItems((prev) => prev.map((it) => {
      if (it.i !== id) return it;
      const z = it.zIndex || 1;
      if (dir === 'up')    return { ...it, zIndex: z + 1 };
      if (dir === 'down')  return { ...it, zIndex: Math.max(1, z - 1) };
      if (dir === 'front') return { ...it, zIndex: Math.max(...prev.map((i) => i.zIndex || 1)) + 1 };
      if (dir === 'back')  return { ...it, zIndex: 1 };
      return it;
    }));

  // ── Média ────────────────────────────────────────────────────────────────────

  const handleFileSelect = (id, event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    setItems((prev) => prev.map((it) => {
      if (it.i !== id) return it;
      const isVideo = files[0].type.startsWith('video');
      if (['gallery', 'carousel'].includes(it.type))
        return { ...it, content: files.map((f) => URL.createObjectURL(f)) };
      let newType = it.type;
      if (isVideo  && !VIDEO_TYPES.includes(it.type)) newType = 'video';
      if (!isVideo && !IMAGE_TYPES.includes(it.type)) newType = 'image';
      return { ...it, type: newType, content: URL.createObjectURL(files[0]) };
    }));
    event.target.value = '';
  };

  const onDropFile = (e) => {
    e.preventDefault();
    if (!isEditMode) return;
    Array.from(e.dataTransfer.files).forEach((file, i) => {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const id = `item-${Date.now()}-${i}`;
      setItems((prev) => [...prev, makeItem({
        i: id, x: (prev.length * 2) % 12, y: Infinity, w: 4, h: 3,
        zIndex: prev.length + 1, type, content: URL.createObjectURL(file),
      })]);
    });
  };

  // ── Clavier ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isEditMode || !selectedId) return;
      const tag = e.target.tagName.toUpperCase();
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
      if (e.target.contentEditable === 'true') return;
      if (e.key === 'Delete' || e.key === 'Backspace') removeItem(selectedId);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, isEditMode]);

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={`grid-container ${isEditMode ? 'edit-mode-on' : ''}`}
      onDragOver={(e) => isEditMode && e.preventDefault()}
      onDrop={(e) => { if (e.dataTransfer.files.length > 0) onDropFile(e); }}
      onClick={handleDeselect}
    >
      {/* ══ Panel Ombre ══ */}
      {isEditMode && selectedItem && shadowOpen && (
        <div className="shadow-panel" style={shadowPanel.style} onClick={(e) => e.stopPropagation()}>
          <div className="shadow-panel-title" onMouseDown={shadowPanel.onTitleMouseDown}>
            <span className="panel-drag-icon">⠿</span>
            Ombre&nbsp;·&nbsp;<span style={{ color:'var(--grey-light)', fontWeight:400 }}>{selectedItem.type}</span>
          </div>
          {/* ── Fond du module ── */}
          <div className="shadow-row"><b style={{ color: 'var(--off-white)' }}>Fond du module</b></div>
          <div className="shadow-row shadow-color-row">
            <span>Couleur de fond</span>
            <input type="color" value={selectedItem.bgColor || '#1A1A1A'}
              onChange={(e) => updateItem(selectedItem.i, { bgColor: e.target.value })} />
          </div>
          <div className="shadow-row">
            <span>Opacité du fond&nbsp;<b>{Math.round((selectedItem.bgAlpha ?? 1) * 100)}%</b></span>
            <input type="range" min="0" max="100" value={Math.round((selectedItem.bgAlpha ?? 1) * 100)}
              onChange={(e) => updateItem(selectedItem.i, { bgAlpha: +e.target.value / 100 })} />
          </div>

          {/* ── Ombre ── */}
          <div className="shadow-row" style={{ borderTop: '1px solid var(--grey-dark)', paddingTop: 10, marginTop: 4 }}>
            <b style={{ color: 'var(--off-white)' }}>Ombre portée</b>
          </div>
          <label className="shadow-row shadow-toggle">
            <input type="checkbox" checked={selectedItem.shadow?.enabled ?? false}
              onChange={(e) => updateShadow(selectedItem.i, { enabled: e.target.checked })} />
            Activer l'ombre
          </label>
          {selectedItem.shadow?.enabled && <>
            {[
              { label:'Décalage X', key:'offsetX', min:-50, max:50, unit:'px' },
              { label:'Décalage Y', key:'offsetY', min:-50, max:50, unit:'px' },
              { label:'Flou',       key:'blur',    min:0,   max:100, unit:'px' },
              { label:'Extension',  key:'spread',  min:-20, max:20,  unit:'px' },
            ].map(({ label, key, min, max, unit }) => (
              <div key={key} className="shadow-row">
                <span>{label}&nbsp;<b>{selectedItem.shadow[key]}{unit}</b></span>
                <input type="range" min={min} max={max} value={selectedItem.shadow[key]}
                  onChange={(e) => updateShadow(selectedItem.i, { [key]: +e.target.value })} />
              </div>
            ))}
            <div className="shadow-row shadow-color-row">
              <span>Couleur</span>
              <input type="color" value={selectedItem.shadow.color || '#000000'}
                onChange={(e) => updateShadow(selectedItem.i, { color: e.target.value })} />
            </div>
            <div className="shadow-row">
              <span>Opacité&nbsp;<b>{Math.round((selectedItem.shadow.alpha ?? 0.35) * 100)}%</b></span>
              <input type="range" min="0" max="100" value={Math.round((selectedItem.shadow.alpha ?? 0.35) * 100)}
                onChange={(e) => updateShadow(selectedItem.i, { alpha: +e.target.value / 100 })} />
            </div>
            <label className="shadow-row shadow-toggle">
              <input type="checkbox" checked={selectedItem.shadow.inset ?? false}
                onChange={(e) => updateShadow(selectedItem.i, { inset: e.target.checked })} />
              Ombre intérieure (inset)
            </label>
          </>}
        </div>
      )}

      {/* ══ Panel Typographie ══ */}
      {isEditMode && selectedItem && textOpen && TEXT_TYPES.includes(selectedItem.type) && (
        <div className="text-panel" style={textPanel.style} onClick={(e) => e.stopPropagation()}>
          <div className="text-panel-title" onMouseDown={textPanel.onTitleMouseDown}>
            <span className="panel-drag-icon">⠿</span>
            Typographie&nbsp;·&nbsp;<span style={{ color:'var(--grey-light)', fontWeight:400 }}>{selectedItem.type}</span>
          </div>

          {/* Taille */}
          <div className="shadow-row">
            <span>Taille&nbsp;<b>{selectedItem.fontSize ? `${selectedItem.fontSize}px` : 'auto'}</b></span>
            <input type="range" min="8" max="120" value={selectedItem.fontSize || 16}
              onChange={(e) => updateItem(selectedItem.i, { fontSize: +e.target.value })} />
          </div>

          {/* Couleur + opacité du texte */}
          <div className="shadow-row shadow-color-row">
            <span>Couleur du texte</span>
            <input type="color" value={selectedItem.textColor || '#D4A017'}
              onChange={(e) => updateItem(selectedItem.i, { textColor: e.target.value })} />
          </div>
          <div className="shadow-row">
            <span>Opacité du texte&nbsp;<b>{Math.round((selectedItem.textAlpha ?? 1) * 100)}%</b></span>
            <input type="range" min="0" max="100" value={Math.round((selectedItem.textAlpha ?? 1) * 100)}
              onChange={(e) => updateItem(selectedItem.i, { textAlpha: +e.target.value / 100 })} />
          </div>

          {/* Alignement horizontal */}
          <div className="shadow-row">
            <span>Alignement horizontal</span>
            <div className="align-group">
              {[['left','← Gauche'],['center','≡ Centre'],['right','Droite →']].map(([v, lbl]) => (
                <button key={v}
                  className={`align-btn${(selectedItem.textAlign || 'left') === v ? ' active' : ''}`}
                  onClick={() => updateItem(selectedItem.i, { textAlign: v })}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Alignement vertical */}
          <div className="shadow-row">
            <span>Alignement vertical</span>
            <div className="align-group">
              {[['top','↑ Haut'],['middle','⊟ Milieu'],['bottom','↓ Bas']].map(([v, lbl]) => (
                <button key={v}
                  className={`align-btn${(selectedItem.verticalAlign || 'top') === v ? ' active' : ''}`}
                  onClick={() => updateItem(selectedItem.i, { verticalAlign: v })}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })) }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        isDroppable={isEditMode}
        resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
        allowOverlap={true}
        onDrop={onDropFromToolbox}
        onLayoutChange={onLayoutChange}
        draggableCancel=".grid-item-content, .action-bar, .shadow-panel, .text-panel, input, button, label, select, textarea, [contenteditable]"
        margin={[15, 15]}
        droppingItem={{ i: 'placeholder', w: 2, h: 2 }}
      >
        {items.map((item) => (
          <div
            key={item.i}
            className={`grid-item-wrapper ${selectedId === item.i ? 'grid-item-selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleSelect(item.i); }}
            style={{ zIndex: item.zIndex || 1, ...getShadowStyle(item.shadow), background: hexAlpha(item.bgColor || '#1A1A1A', item.bgAlpha ?? 1) }}
          >
            {/* ── Barre d'actions ── */}
            {isEditMode && selectedId === item.i && (
              <div className="action-bar" onClick={(e) => e.stopPropagation()}>
                <label className="action-btn" title="Choisir / changer le média">
                  📁 Média
                  <input type="file"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,video/mp4,video/webm,image/*"
                    multiple={['gallery','carousel'].includes(item.type)}
                    hidden
                    onChange={(e) => handleFileSelect(item.i, e)} />
                </label>

                {TEXT_TYPES.includes(item.type) && (
                  <button
                    className={`action-btn${textOpen ? ' action-btn-active' : ''}`}
                    title="Typographie"
                    onClick={() => { setTextOpen((o) => !o); setShadowOpen(false); }}>
                    Aa
                  </button>
                )}

                {(IMAGE_TYPES.includes(item.type) || VIDEO_TYPES.includes(item.type)) && (<>
                  <button className="action-btn" title="Dézoomer"
                    onClick={() => updateItem(item.i, { imgZoom: Math.max(50, (item.imgZoom || 100) - 10) })}>🔍−</button>
                  <span style={{ fontSize:'10px', color:'var(--mustard)', padding:'0 2px', lineHeight:'26px' }}>{item.imgZoom || 100}%</span>
                  <button className="action-btn" title="Zoomer"
                    onClick={() => updateItem(item.i, { imgZoom: Math.min(300, (item.imgZoom || 100) + 10) })}>🔍+</button>
                </>)}

                <button className="action-btn" title="Monter"
                  onClick={() => updateZIndex(item.i, 'up')}>+</button>
                <button className="action-btn" title="Descendre"
                  onClick={() => updateZIndex(item.i, 'down')}>−</button>
                <button className="action-btn" title="Tout devant"
                  onClick={() => updateZIndex(item.i, 'front')}>Devant</button>
                <button className="action-btn" title="Tout derrière"
                  onClick={() => updateZIndex(item.i, 'back')}>Derrière</button>
                <button
                  className={`action-btn${shadowOpen ? ' action-btn-active' : ''}`}
                  title="Ombre"
                  onClick={() => { setShadowOpen((o) => !o); setTextOpen(false); }}>
                  Ombre
                </button>
                <button className="action-btn danger" title="Supprimer"
                  onClick={() => removeItem(item.i)}>✕</button>
              </div>
            )}

            {/* ── Contenu ── */}
            <div className="grid-item-content">
              <MediaItem
                item={item}
                isEditMode={isEditMode}
                onUpdate={(data) => updateItem(item.i, data)}
              />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default GridEditor;
