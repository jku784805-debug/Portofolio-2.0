import { useState, useEffect, useRef, useCallback } from 'react';
import { idb } from './lib/idb';
import { Link } from 'react-router-dom';

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  bg:'#05050A', bg2:'#0A0A14', bg3:'#10101C', card:'#0D0D1E',
  red:'#FF1744', gold:'#C49A3C',
  w:'#F0F0F5', grey:'#70708A',
  b05:'rgba(255,255,255,.05)', b10:'rgba(255,255,255,.10)',
  r30:'rgba(255,23,68,.30)', r08:'rgba(255,23,68,.08)',
};
const F = {
  h:"'Rajdhani','Arial Black',sans-serif",
  b:"'Space Grotesk',system-ui,sans-serif",
  m:"'Space Mono','Courier New',monospace",
  jp:"'Noto Serif JP',serif",
};

// ── DEFAULT CONTENT — 100 % placeholders, aucun texte copié ──────────────────
const DEFAULT = {
  nav:{ logo:'Khun.MacJ', logoJp:'写真家', cta:'Réserver' },
  hero:{
    tagline:'写 真 · フォトグラフィー · PHOTOGRAPHIE',
    line1:'CRÉATIONS', line2:'VISUELLES',
    location:'Ville · Région · Pays',
    desc:'Description de votre activité. Présentez votre métier en quelques mots clairs. Ce texte est entièrement modifiable.',
    cta1:'Voir la galerie', cta2:'Me contacter',
    s1n:'10+', s1l:'Années', s2n:'500+', s2l:'Projets', s3n:'3K+', s3l:'Visuels',
    bg:null,
  },
  about:{
    t1:'Votre passion', t2:'mise en lumière',
    p1:'Premier paragraphe de présentation. Décrivez votre parcours, votre vision créative et ce qui vous distingue. Entièrement personnalisable.',
    p2:'Second paragraphe. Parlez de votre approche artistique, de vos valeurs et de votre zone d\'intervention. Tout peut être modifié.',
    sig:'Votre Nom', side:'MÉTIER · LOCALISATION · PAYS', img:null,
  },
  services:[
    {jp:'一',title:'Prestation 1',num:'01',desc:'Description courte de la première prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE A',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
    {jp:'二',title:'Prestation 2',num:'02',desc:'Description courte de la deuxième prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE B',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
    {jp:'三',title:'Prestation 3',num:'03',desc:'Description courte de la troisième prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE A',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
    {jp:'四',title:'Prestation 4',num:'04',desc:'Description courte de la quatrième prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE B',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
    {jp:'五',title:'Prestation 5',num:'05',desc:'Description courte de la cinquième prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE C',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
    {jp:'六',title:'Prestation 6',num:'06',desc:'Description courte de la sixième prestation. Modifiable.',visible:true,
      tag:'CATÉGORIE C',heroImg:null,longDesc:'Description complète de cette prestation. Parlez de ce qui est inclus, du déroulement et de ce que le client peut attendre. Ce texte est entièrement personnalisable.',
      details:['Avantage inclus 1','Avantage inclus 2','Avantage inclus 3','Avantage inclus 4'],
      photos:[null,null,null,null,null,null],price:'Sur devis',duration:'À définir',cta:'Réserver cette prestation'},
  ],
  gallery:[
    {src:null,title:'Titre image 1',cat:'Catégorie A',visible:true},
    {src:null,title:'Titre image 2',cat:'Catégorie B',visible:true},
    {src:null,title:'Titre image 3',cat:'Catégorie A',visible:true},
    {src:null,title:'Titre image 4',cat:'Catégorie C',visible:true},
    {src:null,title:'Titre image 5',cat:'Catégorie B',visible:true},
    {src:null,title:'Titre image 6',cat:'Catégorie C',visible:true},
  ],
  video:{ t1:'Votre histoire', t2:'en mouvement', src:null },
  actu:[
    {src:null,date:'Mois Année',title:'Titre actualité 1',cat:'Catégorie',visible:true},
    {src:null,date:'Mois Année',title:'Titre actualité 2',cat:'Catégorie',visible:true},
    {src:null,date:'Mois Année',title:'Titre actualité 3',cat:'Catégorie',visible:true},
  ],
  contact:{
    t1:'Parlons de', t2:'votre projet',
    phone:'+00 0 00 00 00 00', email:'contact@votresite.fr', zone:'Ville · Région · Pays',
    jpd:'御連絡をお待ちしております', jps:'DANS L\'ATTENTE DE VOS NOUVELLES',
    btn:'Envoyer le message',
  },
  footer:{ copy:'© 2025 · TOUS DROITS RÉSERVÉS', s1:'INSTAGRAM', s2:'FACEBOOK', s3:'PINTEREST' },
  sections:{ about:true, services:true, gallery:true, video:true, actu:true, contact:true },
};

// ── CSS INJECTION ─────────────────────────────────────────────────────────────
function useStyles() {
  useEffect(() => {
    const id = 'pf-anim';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes pf-pulse{0%,100%{opacity:1}50%{opacity:.15}}
      @keyframes pf-scan{from{transform:translateY(-100%)}to{transform:translateY(130vh)}}
      @keyframes pf-blink{0%,100%{opacity:1}49%{opacity:1}50%,80%{opacity:0}81%{opacity:1}}
      @keyframes pf-fadein{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
      .pf-card{transition:transform .4s,box-shadow .4s,background .3s!important}
      .pf-card:hover{transform:translateY(-6px)!important;background:#14142A!important;box-shadow:0 24px 60px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,23,68,.45)!important}
      .pf-img-card{overflow:hidden;position:relative}
      .pf-img-card img{transition:transform .7s!important;width:100%;height:100%;object-fit:cover;display:block}
      .pf-img-card:hover img{transform:scale(1.07)!important}
      .pf-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,5,10,.97) 0%,transparent 55%);opacity:0;transition:opacity .4s;display:flex;align-items:flex-end;padding:24px;pointer-events:none}
      .pf-img-card:hover .pf-overlay{opacity:1!important}
      .pf-nav-a{transition:color .2s!important;text-decoration:none;cursor:pointer}
      .pf-nav-a:hover{color:#FF1744!important}
      .pf-btn-r{transition:background .2s,transform .2s,box-shadow .2s!important;cursor:pointer}
      .pf-btn-r:hover{background:#E00030!important;transform:translateY(-2px)!important}
      .pf-btn-o{transition:border-color .2s,color .2s,transform .2s!important;cursor:pointer}
      .pf-btn-o:hover{border-color:#FF1744!important;color:#FF1744!important;transform:translateY(-2px)!important}
      .pf-input{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);color:#F0F0F5;padding:13px 16px;font-family:'Space Grotesk',system-ui;font-size:.9rem;outline:none;transition:border-color .3s;width:100%;box-sizing:border-box}
      .pf-input::placeholder{color:rgba(112,112,138,.6)}
      .pf-input:focus{border-color:rgba(255,23,68,.5)}
      .pf-progress{position:fixed;top:0;left:0;height:2px;background:#FF1744;z-index:10001;transition:width .1s;box-shadow:0 0 10px rgba(255,23,68,.7)}
      .pf-et{outline:1px dashed rgba(255,23,68,.35)!important;outline-offset:2px;min-width:4px;transition:outline-color .15s,background .15s!important}
      .pf-et:hover{outline-color:rgba(255,23,68,.9)!important;background:rgba(255,23,68,.06)!important}
      .pf-et:focus{outline:2px solid #FF1744!important;background:rgba(255,23,68,.08)!important}
      .pf-upload{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,0);transition:background .2s;z-index:5}
      .pf-upload:hover{background:rgba(0,0,0,.75)!important}
      .pf-upload span{opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}
      .pf-upload:hover span{opacity:1!important}
      .pf-filter{background:transparent;border:1px solid rgba(255,255,255,.1);color:#70708A;padding:8px 20px;font-family:'Space Mono',monospace;font-size:.62rem;letter-spacing:.12em;cursor:pointer;transition:all .2s}
      .pf-filter:hover,.pf-filter.on{background:#FF1744;border-color:#FF1744;color:#fff}
      .pf-lbx{animation:pf-fadein .25s ease}
      [contenteditable]{caret-color:#FF1744}
    `;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, []);
}

// ── EDITABLE TEXT ─────────────────────────────────────────────────────────────
const ET = ({ value, onChange, style, tag:Tag='span', editMode, ph='—' }) => {
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
      className="pf-et" title="Cliquer pour modifier"
      style={{ outline:'none', cursor:'text', ...style }}
      onFocus={() => { live.current = true; }}
      onBlur={e  => { live.current = false; onChange?.(e.currentTarget.textContent.trim()); }}
      onMouseDown={e => e.stopPropagation()}
      onKeyDown={e  => { e.stopPropagation(); if (e.key==='Enter' && Tag!=='p') e.preventDefault(); }}
    />
  );
};

// ── CROP HELPER ───────────────────────────────────────────────────────────────
const cropCenter = (blobUrl, aspectStr) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const { width:W, height:H } = img;
    let sx=0, sy=0, sw=W, sh=H;
    if (aspectStr !== 'free') {
      const [aw,ah] = aspectStr.split('/').map(Number);
      const target = aw/ah;
      if (W/H > target) { sw=H*target; sx=(W-sw)/2; }
      else              { sh=W/target; sy=(H-sh)/2; }
    }
    const MAX=1400, sc=Math.min(1,MAX/Math.max(sw,sh));
    const canvas = document.createElement('canvas');
    canvas.width=Math.round(sw*sc); canvas.height=Math.round(sh*sc);
    canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    canvas.toBlob(b=>resolve(URL.createObjectURL(b)),'image/jpeg',0.85);
  };
  img.onerror = () => resolve(blobUrl);
  img.src = blobUrl;
});

const ASPECT_PRESETS = [
  {label:'Libre',value:'free'},{label:'16:9',value:'16/9'},
  {label:'4:3',value:'4/3'},{label:'3:2',value:'3/2'},
  {label:'1:1',value:'1/1'},{label:'2:3',value:'2/3'},{label:'9:16',value:'9/16'},
];

const CropModal = ({ src, aspect, setAspect, onConfirm, onCancel }) => {
  const ar = aspect==='free' ? undefined : aspect.replace('/',' / ');
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:999999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onCancel}>
      <div style={{background:C.card,border:`1px solid ${C.b10}`,padding:'28px 28px 24px',maxWidth:720,width:'92vw',maxHeight:'92vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:F.m,fontSize:'.65rem',color:C.red,letterSpacing:'.25em',marginBottom:18}}>✂ ROGNER / RECADRER</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {ASPECT_PRESETS.map(p=>(
            <button key={p.value} onClick={()=>setAspect(p.value)} style={{
              background:aspect===p.value?C.r08:'transparent',
              border:`1px solid ${aspect===p.value?C.red:C.b10}`,
              color:aspect===p.value?C.red:C.grey,
              padding:'6px 14px',fontFamily:F.m,fontSize:'.6rem',cursor:'pointer',
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{flex:1,overflow:'hidden',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18,minHeight:180,maxHeight:'52vh'}}>
          <img src={src} alt="aperçu" style={{display:'block',...(ar?{aspectRatio:ar,objectFit:'cover',width:'100%',maxHeight:'52vh'}:{maxWidth:'100%',maxHeight:'52vh',objectFit:'contain'})}} />
        </div>
        <div style={{fontFamily:F.m,fontSize:'.56rem',color:C.grey,letterSpacing:'.1em',marginBottom:16,textAlign:'center'}}>Le recadrage centre automatiquement l'image</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{background:'transparent',border:`1px solid ${C.b10}`,color:C.grey,padding:'9px 22px',fontFamily:F.m,fontSize:'.6rem',cursor:'pointer'}}>ANNULER</button>
          <button onClick={onConfirm} style={{background:C.red,border:'none',color:C.w,padding:'9px 26px',fontFamily:F.m,fontSize:'.6rem',cursor:'pointer'}}>✓ APPLIQUER</button>
        </div>
      </div>
    </div>
  );
};

// ── UPLOAD OVERLAY ────────────────────────────────────────────────────────────
const UploadBtn = ({ onFile, label='IMAGE', accept='image/*' }) => {
  const r = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [aspect,  setAspect]  = useState('free');

  const handleChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('video/')) { onFile(url); return; }
    setCropSrc(url); setAspect('free');
  };

  const applyCrop = async () => {
    const cropped = await cropCenter(cropSrc, aspect);
    setCropSrc(null); onFile(cropped);
  };

  const cancelCrop = () => { URL.revokeObjectURL(cropSrc); setCropSrc(null); };

  return (
    <>
      <button className="pf-upload" onClick={e => { e.stopPropagation(); r.current?.click(); }}>
        <span style={{ fontFamily:F.m, fontSize:'.6rem', color:C.red }}>📁 CHANGER {label}<br/><span style={{ opacity:.5 }}>JPG · PNG · WEBP</span></span>
      </button>
      <input ref={r} type="file" accept={accept} hidden onChange={handleChange} />
      {cropSrc && <CropModal src={cropSrc} aspect={aspect} setAspect={setAspect} onConfirm={applyCrop} onCancel={cancelCrop} />}
    </>
  );
};

// ── GALLERY CARD ──────────────────────────────────────────────────────────────
const GalCard = ({ g, editMode, onChange, onOpen, style }) => (
  <div className="pf-img-card" style={{ cursor: editMode?'default':'pointer', ...style }}
    onClick={editMode ? undefined : onOpen}
  >
    {g.src
      ? <img src={g.src} alt={g.title} />
      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:F.m, fontSize:'.55rem', color:'rgba(255,255,255,.12)', letterSpacing:'.25em' }}>IMAGE</span>
        </div>
    }
    <div className="pf-overlay" style={{ pointerEvents:'none' }}>
      <div>
        <ET value={g.cat}   onChange={v=>onChange('cat',v)}   editMode={editMode} style={{ fontFamily:F.m, fontSize:'.58rem', color:C.red, letterSpacing:'.22em', marginBottom:6, display:'block' }} tag='div' />
        <ET value={g.title} onChange={v=>onChange('title',v)} editMode={editMode} style={{ fontFamily:F.h, fontWeight:700, fontSize:'1rem', color:C.w, display:'block' }} tag='div' />
      </div>
    </div>
    {editMode && <UploadBtn onFile={v=>onChange('src',v)} />}
  </div>
);

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
const Lightbox = ({ items, idx, onClose, setIdx }) => {
  const n = items.length;
  useEffect(() => {
    if (idx === null) return;
    const h = e => {
      if (e.key==='Escape') onClose();
      if (e.key==='ArrowLeft')  setIdx(i => (i-1+n)%n);
      if (e.key==='ArrowRight') setIdx(i => (i+1)%n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, n]);

  if (idx === null || !items[idx]) return null;
  const g = items[idx];

  const nb = (side, fn) => (
    <button onClick={e=>{e.stopPropagation();fn();}} style={{
      position:'absolute', [side]:20, top:'50%', transform:'translateY(-50%)',
      background:'rgba(255,255,255,.06)', border:`1px solid ${C.r30}`,
      color:C.w, width:48, height:48, fontSize:'1.2rem', cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>{side==='left'?'←':'→'}</button>
  );

  return (
    <div className="pf-lbx" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.96)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}
    >
      {nb('left',  () => setIdx(i=>(i-1+n)%n))}
      {nb('right', () => setIdx(i=>(i+1)%n))}
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'transparent', border:`1px solid ${C.b10}`, color:C.w, width:40, height:40, fontSize:'1.1rem', cursor:'pointer' }}>✕</button>
      <div onClick={e=>e.stopPropagation()} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        {g.src
          ? <img src={g.src} alt={g.title} style={{ maxWidth:'88vw', maxHeight:'80vh', objectFit:'contain' }} />
          : <div style={{ width:'60vw', height:'60vh', background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:F.m, fontSize:'.7rem', color:'rgba(255,255,255,.15)' }}>AUCUNE IMAGE</span>
            </div>
        }
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:F.m, fontSize:'.58rem', color:C.red, letterSpacing:'.2em', marginBottom:6 }}>{g.cat}</div>
          <div style={{ fontFamily:F.h, fontWeight:700, fontSize:'1.1rem', color:C.w }}>{g.title}</div>
          <div style={{ fontFamily:F.m, fontSize:'.55rem', color:C.grey, marginTop:6 }}>{idx+1} / {n}</div>
        </div>
      </div>
    </div>
  );
};

// ── SERVICE DETAIL OVERLAY ────────────────────────────────────────────────────
const SVC_DEFAULT = { tag:'CATÉGORIE', heroImg:null, longDesc:'Description complète.', details:['Détail 1','Détail 2','Détail 3','Détail 4'], photos:[null,null,null,null,null,null], price:'Sur devis', duration:'À définir', cta:'Réserver cette prestation' };

const ServiceDetail = ({ service, editMode, onField, onPhoto, onAddPhoto, onClose }) => {
  const [lbxIdx, setLbxIdx] = useState(null);
  const svc = { ...SVC_DEFAULT, ...service };
  const photos = (svc.photos || []);
  const lbxItems = photos.filter(Boolean).map(src => ({ src, title:'', cat:'' }));

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && lbxIdx === null) onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lbxIdx, onClose]);

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, zIndex:99992, overflowY:'auto', animation:'pf-fadein .28s ease' }}>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:10, height:60, background:'rgba(5,5,10,.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.b05}`, display:'flex', alignItems:'center', gap:20, padding:'0 48px' }}>
        <button type="button" onClick={onClose} style={{ background:'transparent', border:`1px solid ${C.b10}`, color:C.grey, padding:'6px 16px', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.1em', cursor:'pointer', transition:'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.b10;e.currentTarget.style.color=C.grey;}}
        >← RETOUR</button>
        <div style={{ width:1, height:24, background:C.b05 }} />
        <ET value={svc.tag} onChange={v=>onField('tag',v)} editMode={editMode}
          style={{ fontFamily:F.m, fontSize:'.58rem', color:C.red, letterSpacing:'.25em' }} />
        <div style={{ width:1, height:24, background:C.b05 }} />
        <ET value={svc.title} onChange={v=>onField('title',v)} editMode={editMode}
          style={{ fontFamily:F.h, fontWeight:700, fontSize:'.95rem', color:C.w, letterSpacing:'.1em' }} />
        <span style={{ fontFamily:F.m, fontSize:'.58rem', color:C.grey, marginLeft:'auto' }}>{svc.num}</span>
      </div>

      {/* Hero image */}
      <div style={{ position:'relative', height:'60vh', overflow:'hidden' }}>
        {svc.heroImg
          ? <img src={svc.heroImg} alt={svc.title} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.35) contrast(1.1)' }} />
          : <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at 50% 50%,rgba(255,23,68,.07),transparent 65%),${C.bg}` }} />
        }
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)`, backgroundSize:'80px 80px' }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${C.bg} 38%,rgba(5,5,10,.4) 70%,transparent)` }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top,${C.bg} 0%,transparent 45%)` }} />
        <span style={{ position:'absolute', right:'-4vw', top:'50%', transform:'translateY(-50%)', fontFamily:F.jp, fontWeight:900, fontSize:'45vw', color:'rgba(255,23,68,.05)', pointerEvents:'none', lineHeight:1 }}>{svc.jp}</span>
        <div style={{ position:'absolute', left:80, bottom:60, zIndex:2 }}>
          <div style={{ fontFamily:F.m, fontSize:'.62rem', color:C.red, letterSpacing:'.4em', marginBottom:16 }}>{svc.num} · {svc.tag}</div>
          <h2 style={{ fontFamily:F.h, fontWeight:700, fontSize:'clamp(2.5rem,7vw,7rem)', color:C.w, lineHeight:.9, margin:0, letterSpacing:'-.01em' }}>
            <ET value={svc.title} onChange={v=>onField('title',v)} editMode={editMode} style={{ display:'block', color:C.w }} />
          </h2>
        </div>
        {editMode && (
          <label style={{ position:'absolute', top:20, right:20, zIndex:10, background:'rgba(255,23,68,.12)', border:`1px dashed ${C.r30}`, color:C.red, padding:'8px 14px', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.1em', cursor:'pointer' }}>
            📸 IMAGE PRINCIPALE
            <input type="file" accept="image/*" hidden onChange={e=>{ const f=e.target.files[0]; if(f) onField('heroImg',URL.createObjectURL(f)); e.target.value=''; }} />
          </label>
        )}
      </div>

      {/* Main content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'80px 60px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:80, marginBottom:80 }}>

          {/* Description */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40 }}>
              <span style={{ fontFamily:F.m, fontSize:'.7rem', color:C.red, letterSpacing:'.1em' }}>01</span>
              <div style={{ width:28, height:1, background:C.red }} />
              <span style={{ fontFamily:F.b, fontSize:'.7rem', color:C.grey, letterSpacing:'.3em', textTransform:'uppercase' }}>DESCRIPTION</span>
              <div style={{ flex:1, height:1, background:C.b05 }} />
            </div>
            <ET value={svc.longDesc} onChange={v=>onField('longDesc',v)} editMode={editMode}
              style={{ fontFamily:F.b, fontSize:'1rem', color:'rgba(240,240,245,.8)', lineHeight:1.85, display:'block' }} tag='p' />
          </div>

          {/* Details + price */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40 }}>
              <span style={{ fontFamily:F.m, fontSize:'.7rem', color:C.red, letterSpacing:'.1em' }}>02</span>
              <div style={{ width:28, height:1, background:C.red }} />
              <span style={{ fontFamily:F.b, fontSize:'.7rem', color:C.grey, letterSpacing:'.3em', textTransform:'uppercase' }}>INCLUS</span>
              <div style={{ flex:1, height:1, background:C.b05 }} />
            </div>
            <ul style={{ listStyle:'none', margin:'0 0 40px', padding:0, display:'flex', flexDirection:'column', gap:12 }}>
              {(svc.details||[]).map((d, i) => (
                <li key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:6, height:6, background:C.red, borderRadius:'50%', flexShrink:0 }} />
                  <ET value={d} onChange={v=>onField('details', (svc.details||[]).map((x,j)=>j===i?v:x))} editMode={editMode}
                    style={{ fontFamily:F.b, fontSize:'.9rem', color:'rgba(240,240,245,.75)' }} />
                </li>
              ))}
            </ul>

            {/* Price card */}
            <div style={{ background:C.card, border:`1px solid ${C.b05}`, padding:'28px 24px' }}>
              <div style={{ fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.2em', marginBottom:8 }}>TARIF</div>
              <ET value={svc.price} onChange={v=>onField('price',v)} editMode={editMode}
                style={{ fontFamily:F.h, fontWeight:700, fontSize:'2rem', color:C.w, display:'block', marginBottom:8 }} tag='div' />
              <ET value={svc.duration} onChange={v=>onField('duration',v)} editMode={editMode}
                style={{ fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.15em', display:'block', marginBottom:24 }} tag='div' />
              <button className="pf-btn-r" style={{ width:'100%', padding:14, background:C.red, border:'none', color:C.w, fontFamily:F.h, fontWeight:700, fontSize:'.85rem', letterSpacing:'.2em', textTransform:'uppercase', cursor:'pointer' }}>
                <ET value={svc.cta} onChange={v=>onField('cta',v)} editMode={editMode} style={{ color:C.w }} />
              </button>
            </div>
          </div>
        </div>

        {/* Photo gallery */}
        {(photos.length > 0) && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40 }}>
              <span style={{ fontFamily:F.m, fontSize:'.7rem', color:C.red, letterSpacing:'.1em' }}>03</span>
              <div style={{ width:28, height:1, background:C.red }} />
              <span style={{ fontFamily:F.b, fontSize:'.7rem', color:C.grey, letterSpacing:'.3em', textTransform:'uppercase' }}>GALERIE</span>
              <div style={{ flex:1, height:1, background:C.b05 }} />
            </div>
            <div style={{ columns:3, columnGap:6 }}>
              {photos.map((src, pi) => {
                const lbxI = lbxItems.findIndex((_,li) => photos.filter(Boolean).indexOf(src) === li);
                return (
                  <div key={pi} style={{ breakInside:'avoid', marginBottom:6, position:'relative', overflow:'hidden', cursor: src && !editMode ? 'pointer':'default' }}
                    onClick={() => { if(src && !editMode) setLbxIdx(photos.filter(Boolean).indexOf(src)); }}
                  >
                    {src
                      ? <img src={src} alt="" style={{ width:'100%', display:'block', transition:'transform .6s' }}
                          onMouseEnter={e=>!editMode&&(e.currentTarget.style.transform='scale(1.04)')}
                          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                        />
                      : <div style={{ height:220, background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontFamily:F.m, fontSize:'.55rem', color:'rgba(255,255,255,.12)', letterSpacing:'.25em' }}>IMAGE</span>
                        </div>
                    }
                    {editMode && (
                      <>
                        <label className="pf-upload" style={{ zIndex:5 }}>
                          <span style={{ fontFamily:F.m, fontSize:'.6rem', color:C.red, textAlign:'center' }}>📁 CHANGER<br/><span style={{opacity:.5}}>IMAGE</span></span>
                          <input type="file" accept="image/*" hidden onChange={e=>{ const f=e.target.files[0]; if(f) onPhoto(pi,URL.createObjectURL(f)); e.target.value=''; }} />
                        </label>
                        {src && <button type="button" onClick={e=>{e.stopPropagation();onPhoto(pi,null);}} style={{ position:'absolute', top:6, right:6, background:'rgba(255,23,68,.2)', border:`1px solid ${C.red}`, color:C.red, width:24, height:24, cursor:'pointer', fontFamily:F.m, fontSize:'.65rem', zIndex:6 }}>✕</button>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {editMode && (
              <div style={{ display:'flex', justifyContent:'center', marginTop:16 }}>
                <button onClick={onAddPhoto} style={{ background:'transparent', border:`1px dashed ${C.r30}`, color:C.red, padding:'12px 32px', fontFamily:F.m, fontSize:'.62rem', letterSpacing:'.2em', cursor:'pointer' }}>+ AJOUTER UNE PHOTO</button>
              </div>
            )}
          </div>
        )}
      </div>

      <Lightbox items={lbxItems} idx={lbxIdx} onClose={()=>setLbxIdx(null)} setIdx={setLbxIdx} />
    </div>
  );
};

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
const ContactFormSection = ({ email, btnLabel, onBtnChange, editMode }) => {
  const [f, sf] = useState({ prenom:'', nom:'', mail:'', type:'', date:'', msg:'' });
  const ch = k => e => sf(p => ({...p,[k]:e.target.value}));
  const send = () => {
    const sub  = encodeURIComponent(`[Contact] ${f.type||'Message'}`);
    const body = encodeURIComponent(`Prénom: ${f.prenom}\nNom: ${f.nom}\nEmail: ${f.mail}\nType: ${f.type}\nDate: ${f.date}\n\n${f.msg}`);
    window.location.href = `mailto:${email}?subject=${sub}&body=${body}`;
  };
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <input className="pf-input" placeholder="Prénom"     value={f.prenom} onChange={ch('prenom')} />
        <input className="pf-input" placeholder="Nom"        value={f.nom}    onChange={ch('nom')} />
      </div>
      <input className="pf-input" placeholder="Adresse email"         value={f.mail} onChange={ch('mail')} style={{marginBottom:12}} />
      <input className="pf-input" placeholder="Type de prestation"    value={f.type} onChange={ch('type')} style={{marginBottom:12}} />
      <input className="pf-input" placeholder="Date souhaitée"        value={f.date} onChange={ch('date')} style={{marginBottom:12}} />
      <textarea className="pf-input" placeholder="Votre message..." rows={5} value={f.msg} onChange={ch('msg')} style={{resize:'vertical',marginBottom:16}} />
      <button className="pf-btn-r" onClick={send} style={{ width:'100%', padding:15, background:C.red, border:'none', color:C.w, fontFamily:F.h, fontWeight:700, fontSize:'.9rem', letterSpacing:'.2em', textTransform:'uppercase', cursor:'pointer' }}>
        <ET value={btnLabel} onChange={onBtnChange} editMode={editMode} style={{ color:C.w }} />
      </button>
    </div>
  );
};

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const Jp = ({ ch, style={} }) => (
  <span style={{ position:'absolute', pointerEvents:'none', userSelect:'none', fontFamily:F.jp, fontWeight:900, color:'rgba(255,23,68,.05)', lineHeight:1, ...style }}>{ch}</span>
);
const SL = ({ num, title }) => (
  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:56 }}>
    <span style={{ fontFamily:F.m, fontSize:'.7rem', color:C.red, letterSpacing:'.1em' }}>{num}</span>
    <div style={{ width:28, height:1, background:C.red }} />
    <span style={{ fontFamily:F.b, fontSize:'.7rem', color:C.grey, letterSpacing:'.3em', textTransform:'uppercase' }}>{title}</span>
    <div style={{ flex:1, height:1, background:C.b05 }} />
  </div>
);
const Wrap = ({ id, bg=C.bg, py=120, children }) => (
  <section id={id} style={{ position:'relative', overflow:'hidden', background:bg, padding:`${py}px 0` }}>
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 60px' }}>{children}</div>
  </section>
);

// ── EDIT BAR ──────────────────────────────────────────────────────────────────
const EditBar = ({ editMode, setEditMode, onSave, onReset, saving, saved, content, setContent, onUndo, hasHistory }) => {
  const [open, setOpen] = useState(false);
  if (!editMode) return null;
  const S = content.sections;
  const keys   = ['about','services','gallery','video','actu','contact'];
  const labels = { about:'Présentation', services:'Services', gallery:'Galerie', video:'Vidéo', actu:'Actualités', contact:'Contact' };
  const toggle = k => setContent(p => ({ ...p, sections:{ ...p.sections, [k]:!p.sections[k] } }));

  return (
    <div style={{
      position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)',
      background:'#0D0D1E', border:`1px solid ${saved ? '#4CAF50' : C.red}`, borderRadius:8,
      padding:'10px 16px', zIndex:99998, display:'flex', alignItems:'center',
      gap:10, boxShadow:`0 8px 40px rgba(0,0,0,.85), 0 0 20px rgba(255,23,68,.18)`,
      flexWrap:'wrap', maxWidth:'96vw', justifyContent:'center',
      transition:'border-color .3s',
    }}>
      {open && (
        <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)', background:'#0D0D1E', border:`1px solid rgba(255,255,255,.08)`, borderRadius:6, padding:'12px 14px', display:'flex', gap:8, flexWrap:'wrap', minWidth:360 }}>
          {keys.map(k => (
            <button key={k} onClick={() => toggle(k)} style={{
              background: S[k]?'rgba(255,23,68,.12)':'transparent',
              border:`1px solid ${S[k]?C.red:'rgba(255,255,255,.08)'}`,
              color: S[k]?C.red:C.grey,
              padding:'5px 12px', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.08em', cursor:'pointer', borderRadius:3,
            }}>{S[k]?'✓ ':'✕ '}{labels[k]}</button>
          ))}
        </div>
      )}
      <span style={{ fontFamily:F.m, fontSize:'.58rem', color: saved?'#4CAF50':C.red, letterSpacing:'.15em' }}>
        {saved ? '✓ SAUVEGARDÉ' : saving ? '⏳ SAUVEGARDE...' : '✎ MODE ÉDITION'}
      </span>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'transparent', border:`1px solid rgba(255,255,255,.08)`, color:C.grey, padding:'6px 12px', fontFamily:F.m, fontSize:'.6rem', cursor:'pointer', borderRadius:3 }}>☰ SECTIONS</button>
      <button onClick={onUndo} disabled={!hasHistory} style={{
        background:'transparent', border:`1px solid ${hasHistory ? 'rgba(196,154,60,.5)' : 'rgba(255,255,255,.06)'}`,
        color: hasHistory ? C.gold : 'rgba(112,112,138,.3)',
        padding:'8px 14px', fontFamily:F.m, fontSize:'.62rem', letterSpacing:'.08em',
        cursor: hasHistory ? 'pointer' : 'default', borderRadius:3, transition:'all .2s',
      }} title="Annuler la dernière modification (Ctrl+Z)">↺ ANNULER</button>
      <button onClick={onSave} disabled={saving} style={{
        background: saved?'#4CAF50':C.red, border:'none', color:'#fff',
        padding:'8px 18px', fontFamily:F.m, fontSize:'.65rem', letterSpacing:'.1em',
        cursor: saving?'wait':'pointer', borderRadius:3, transition:'background .3s', opacity: saving?.7:1,
      }}>
        {saving ? '⏳ En cours...' : saved ? '✓ Sauvegardé !' : '💾 SAUVEGARDER'}
      </button>
      <button onClick={()=>setEditMode(false)} style={{ background:'transparent', border:`1px solid rgba(255,255,255,.1)`, color:C.grey, padding:'8px 14px', fontFamily:F.m, fontSize:'.6rem', cursor:'pointer', borderRadius:3 }}>✓ TERMINER</button>
    </div>
  );
};

// ── FULL GALLERY OVERLAY ──────────────────────────────────────────────────────
const FullGallery = ({ gallery, editMode, onUpdateItem, onClose }) => {
  const [lbxIdx, setLbxIdx] = useState(null);
  const items = gallery.filter(g => g.visible);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && lbxIdx === null) onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lbxIdx, onClose]);

  return (
    <div style={{ position:'fixed', inset:0, background:C.bg, zIndex:99990, display:'flex', flexDirection:'column', animation:'pf-fadein .25s ease' }}>

      {/* Sticky header */}
      <div style={{
        flexShrink:0, height:64,
        background:'rgba(5,5,10,.96)', backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${C.b05}`,
        display:'flex', alignItems:'center', gap:20,
        padding:'0 48px',
      }}>
        <button onClick={onClose} style={{
          background:'transparent', border:`1px solid ${C.b10}`, color:C.grey,
          padding:'7px 16px', fontFamily:F.m, fontSize:'.62rem', letterSpacing:'.1em',
          cursor:'pointer', transition:'all .2s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.b10;e.currentTarget.style.color=C.grey;}}
        >← RETOUR</button>
        <div style={{ width:1, height:24, background:C.b05 }} />
        <span style={{ fontFamily:F.h, fontWeight:700, fontSize:'1rem', color:C.w, letterSpacing:'.15em' }}>GALERIE COMPLÈTE</span>
        <span style={{ fontFamily:F.m, fontSize:'.58rem', color:C.grey, letterSpacing:'.1em' }}>
          {items.length} photo{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid scrollable */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 48px 48px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'100px 0', color:C.grey, fontFamily:F.m, fontSize:'.7rem', letterSpacing:'.2em' }}>
            AUCUNE IMAGE
          </div>
        ) : (
          <div style={{ columns:3, columnGap:6 }}>
            {items.map((g, i) => {
              const origIdx = gallery.indexOf(g);
              const fileRef = { current: null };
              return (
                <div key={i} style={{ breakInside:'avoid', marginBottom:6, position:'relative', overflow:'hidden', cursor:'pointer', display:'block' }}
                  onClick={() => !editMode && setLbxIdx(i)}
                >
                  {g.src
                    ? <img src={g.src} alt={g.title} style={{ width:'100%', display:'block', transition:'transform .6s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      />
                    : <div style={{ height:280, background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontFamily:F.m, fontSize:'.55rem', color:'rgba(255,255,255,.12)', letterSpacing:'.25em' }}>IMAGE</span>
                      </div>
                  }

                  {/* Caption bar */}
                  <div style={{
                    position:'absolute', bottom:0, left:0, right:0,
                    background:'linear-gradient(to top, rgba(5,5,10,.95) 0%, transparent 100%)',
                    padding:'24px 16px 12px',
                    opacity:0, transition:'opacity .3s',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-end',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity='1'}
                    onMouseLeave={e => e.currentTarget.style.opacity='0'}
                  >
                    <div>
                      <div style={{ fontFamily:F.m, fontSize:'.52rem', color:C.red, letterSpacing:'.2em', marginBottom:4 }}>{g.cat}</div>
                      <div style={{ fontFamily:F.h, fontWeight:700, fontSize:'.9rem', color:C.w }}>{g.title}</div>
                    </div>
                    {!editMode && <div style={{ fontFamily:F.m, fontSize:'.55rem', color:C.grey }}>🔍</div>}
                  </div>

                  {/* Edit upload overlay */}
                  {editMode && (
                    <UploadBtn onFile={v => onUpdateItem(origIdx, 'src', v)} label="IMAGE" />
                  )}

                  {/* Edit title/cat inline */}
                  {editMode && (
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.8)', padding:'8px 10px', display:'flex', gap:8 }}>
                      <ET value={g.cat}   onChange={v=>onUpdateItem(origIdx,'cat',v)}   editMode={editMode} style={{ fontFamily:F.m, fontSize:'.55rem', color:C.red, letterSpacing:'.12em' }} />
                      <span style={{ color:'rgba(255,255,255,.2)' }}>·</span>
                      <ET value={g.title} onChange={v=>onUpdateItem(origIdx,'title',v)} editMode={editMode} style={{ fontFamily:F.h, fontSize:'.75rem', color:C.w }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Lightbox items={items} idx={lbxIdx} onClose={() => setLbxIdx(null)} setIdx={setLbxIdx} />
    </div>
  );
};

// ── IMAGE PERSISTENCE HELPERS ────────────────────────────────────────────────
// Compress a blob URL → JPEG base64 (max 1200px, quality 0.82)
const blobToBase64 = (blobUrl) => new Promise(resolve => {
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

const convertBlobs = async (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && v.startsWith('blob:')) {
      try {
        const res  = await fetch(v);
        const blob = await res.blob();
        if (blob.type.startsWith('video/')) {
          out[k] = await new Promise(resolve => {
            const fr = new FileReader();
            fr.onload  = () => resolve(fr.result);
            fr.onerror = () => resolve(null);
            fr.readAsDataURL(blob);
          });
        } else {
          out[k] = await blobToBase64(v);
        }
      } catch { out[k] = await blobToBase64(v); }
    } else if (v && typeof v === 'object') {
      out[k] = await convertBlobs(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

// ── PORTFOLIO ─────────────────────────────────────────────────────────────────
const Portfolio = ({ onEditClick }) => {
  useStyles();
  const scrollerRef = useRef(null);
  const [scrollY,   setScrollY]   = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [editMode,  setEditMode]  = useState(false);
  const [lbxIdx,    setLbxIdx]    = useState(null);
  const [galFilter,   setGalFilter]   = useState('Tout');
  const [newCatInput, setNewCatInput] = useState('');
  const [newCatOpen,  setNewCatOpen]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [fullGal,   setFullGal]   = useState(false);
  const [selectedSvc, setSelectedSvc] = useState(null);

  const [content, setContent] = useState({ ...DEFAULT });

  useEffect(() => {
    idb.get('pf-content-v2').then(parsed => {
      if (parsed) setContent({ ...DEFAULT, ...parsed });
    }).catch(() => {});
  }, []);

  // ── Undo history ─────────────────────────────────────────────────────────────
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

  // Deep path setter: set('hero.line1', 'val')
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

  // Array item setter: setA('gallery', 2, 'title', 'val')
  const setA = useCallback((arr, idx, key, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      next[arr][idx][key] = val;
      return next;
    });
  }, []);

  // Service detail field setter
  const setSvcField = useCallback((svcIdx, key, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      next.services[svcIdx][key] = val;
      return next;
    });
  }, []);

  // Service photo setter
  const setSvcPhoto = useCallback((svcIdx, photoIdx, val) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      if (!Array.isArray(next.services[svcIdx].photos)) next.services[svcIdx].photos = [];
      next.services[svcIdx].photos[photoIdx] = val;
      return next;
    });
  }, []);

  const addSvcPhoto = useCallback((svcIdx) => {
    setContent(prev => {
      pushHistory(prev);
      const next = JSON.parse(JSON.stringify(prev));
      if (!Array.isArray(next.services[svcIdx].photos)) next.services[svcIdx].photos = [];
      next.services[svcIdx].photos.push(null);
      return next;
    });
  }, []);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const converted = await convertBlobs(content);
      setContent(converted);
      await idb.set('pf-content-v2', converted);
      // Synchronise nav/footer en localStorage (petites données texte, lues par LayoutTemplate)
      try { localStorage.setItem('pf-nav', JSON.stringify({ nav: converted.nav, footer: converted.footer || {} })); } catch {}
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaving(false);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const onReset = () => {
    if (!confirm('Réinitialiser tout le contenu ?')) return;
    idb.del('pf-content-v2').catch(() => {});
    localStorage.removeItem('pf-nav');
    setContent({ ...DEFAULT });
    setSaved(false);
  };

  const onScroll = e => {
    const t = e.currentTarget, s = t.scrollTop, max = t.scrollHeight - t.clientHeight;
    setScrollY(s);
    setProgress(max > 0 ? s/max*100 : 0);
  };

  useEffect(() => {
    const fn = e => { if (editMode && e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [editMode, undo]);

  const goto = id => scrollerRef.current?.querySelector?.(`#${id}`)?.scrollIntoView({ behavior:'smooth' });

  const { nav, hero, about, services, video, actu, contact, footer, sections } = content;
  const gal     = content.gallery;
  const cats    = ['Tout', ...new Set(gal.map(g => g.cat))];
  const filtGal = gal.filter(g => g.visible && (galFilter === 'Tout' || g.cat === galFilter));

  // Shorthand for ET props
  const t = (val, onChange, style, tag='span') => ({ value:val, onChange, style, tag, editMode });

  return (
    <div ref={scrollerRef} onScroll={onScroll}
      style={{ position:'fixed', inset:0, overflowY:'auto', zIndex:9999, background:C.bg }}
    >
      <div className="pf-progress" style={{ width:`${progress}%` }} />
      <EditBar editMode={editMode} setEditMode={setEditMode} onSave={onSave} onReset={onReset} saving={saving} saved={saved} content={content} setContent={setContent} onUndo={undo} hasHistory={hasHistory} />
      <Lightbox items={filtGal.filter(g=>g.src)} idx={lbxIdx} onClose={()=>setLbxIdx(null)} setIdx={setLbxIdx} />

      {fullGal && (
        <FullGallery
          gallery={gal}
          editMode={editMode}
          onUpdateItem={(idx, key, val) => setA('gallery', idx, key, val)}
          onClose={() => setFullGal(false)}
        />
      )}

      {selectedSvc !== null && (
        <ServiceDetail
          service={content.services[selectedSvc]}
          editMode={editMode}
          onField={(key, val) => setSvcField(selectedSvc, key, val)}
          onPhoto={(pi, val) => setSvcPhoto(selectedSvc, pi, val)}
          onAddPhoto={() => addSvcPhoto(selectedSvc)}
          onClose={() => { setSelectedSvc(null); setTimeout(() => goto('services'), 80); }}
        />
      )}


      {/* ══ NAV ══ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:10000,
        height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 60px',
        background: scrollY>50 ? 'rgba(5,5,10,.94)' : 'transparent',
        backdropFilter: scrollY>50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY>50 ? `1px solid ${C.b05}` : 'none',
        transition:'background .4s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:6, height:6, background:C.red, borderRadius:'50%', boxShadow:`0 0 12px ${C.red}`, animation:'pf-blink 4s infinite' }} />
          <ET {...t(nav.logo, v=>set('nav.logo',v), { fontFamily:F.h, fontWeight:700, fontSize:'1.05rem', color:C.w, letterSpacing:'.15em' })} />
          <ET {...t(nav.logoJp, v=>set('nav.logoJp',v), { fontFamily:F.jp, fontSize:'.75rem', color:C.grey, marginLeft:6 })} />
        </div>
        <ul style={{ display:'flex', gap:36, listStyle:'none', margin:0, padding:0 }}>
          {[['accueil','Accueil'],['presentation','Présentation'],['services','Services']].map(([id,lbl]) => (
            <li key={id}><a className="pf-nav-a" style={{ fontFamily:F.b, fontSize:'.78rem', color:C.grey, letterSpacing:'.08em' }} onClick={()=>goto(id)}>{lbl}</a></li>
          ))}
          {[['/decouvrir','Découvrir'],['/galerie','Galerie'],['/contact','Contact']].map(([path,lbl]) => (
            <li key={path}><Link to={path} className="pf-nav-a" style={{ fontFamily:F.b, fontSize:'.78rem', color:C.grey, letterSpacing:'.08em', textDecoration:'none' }}>{lbl}</Link></li>
          ))}
        </ul>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link to="/contact" className="pf-btn-r" style={{ padding:'8px 20px', background:C.red, border:'none', color:C.w, fontFamily:F.h, fontWeight:700, fontSize:'.75rem', letterSpacing:'.15em', textTransform:'uppercase', textDecoration:'none', display:'inline-block' }}>
            <ET {...t(nav.cta, v=>set('nav.cta',v), { color:C.w })} />
          </Link>
          <button className="pf-btn-o"
            onClick={() => setEditMode(m => !m)}
            style={{ padding:'8px 16px', background: editMode?'rgba(255,23,68,.1)':'transparent', border:`1px solid ${editMode?C.red:C.b10}`, color:editMode?C.red:C.grey, fontFamily:F.m, fontSize:'.65rem', letterSpacing:'.1em' }}
          >{editMode ? '✓ ÉDITION' : '✏ ÉDITER'}</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section id="accueil" style={{ position:'relative', height:'100vh', overflow:'hidden', display:'flex', alignItems:'center' }}>
        {hero.bg
          ? <img src={hero.bg} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.18) contrast(1.2)', pointerEvents:'none' }} />
          : <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 60% 40%,rgba(255,23,68,.05),transparent 70%),${C.bg}` }} />
        }
        {editMode && (
          <label style={{ position:'absolute', top:80, right:20, zIndex:10, background:'rgba(255,23,68,.12)', border:`1px dashed ${C.r30}`, color:C.red, padding:'8px 14px', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.1em', cursor:'pointer' }}>
            📸 IMAGE DE FOND
            <input type="file" accept="image/*" hidden onChange={e=>{ const f=e.target.files[0]; if(f) set('hero.bg',URL.createObjectURL(f)); e.target.value=''; }} />
          </label>
        )}
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)`, backgroundSize:'80px 80px' }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${C.bg} 38%,rgba(5,5,10,.7) 65%,transparent)` }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top,${C.bg} 0%,transparent 35%)` }} />
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,23,68,.3),transparent)', animation:'pf-scan 8s linear infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:80, top:0, bottom:0, width:1, background:`linear-gradient(to bottom,transparent,${C.red} 20%,${C.red} 80%,transparent)`, opacity:.25 }} />
        <Jp ch="光" style={{ right:'-5vw', top:'50%', transform:'translateY(-50%)', fontSize:'55vw', opacity:.03 }} />
        <Jp ch="影" style={{ right:'25vw', bottom:'-5vh', fontSize:'20vw', opacity:.025 }} />

        <div style={{ position:'relative', zIndex:2, padding:'80px 120px 0', maxWidth:900 }}>
          <ET {...t(hero.tagline, v=>set('hero.tagline',v), { fontFamily:F.jp, fontSize:'.7rem', color:C.red, letterSpacing:'.5em', marginBottom:24, display:'block' }, 'div')} />
          <h1 style={{ fontFamily:F.h, fontWeight:700, fontSize:'clamp(3.5rem,9vw,9rem)', color:C.w, lineHeight:.88, margin:'0 0 4px -3px', letterSpacing:'-.02em' }}>
            <ET {...t(hero.line1, v=>set('hero.line1',v), { display:'block', color:C.w })} /><br/>
            <ET {...t(hero.line2, v=>set('hero.line2',v), { display:'block', color:C.red, textShadow:`0 0 60px rgba(255,23,68,.35)` })} />
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:16, margin:'32px 0' }}>
            <div style={{ width:40, height:1, background:C.red }} />
            <ET {...t(hero.location, v=>set('hero.location',v), { fontFamily:F.b, fontSize:'.85rem', color:C.grey, letterSpacing:'.25em', textTransform:'uppercase' })} />
          </div>
          <ET {...t(hero.desc, v=>set('hero.desc',v), { fontFamily:F.b, fontSize:'1rem', color:C.grey, maxWidth:460, lineHeight:1.75, margin:'0 0 40px', display:'block' }, 'p')} />
          <div style={{ display:'flex', gap:12 }}>
            <button className="pf-btn-r" onClick={()=>goto('galerie')} style={{ padding:'14px 32px', background:C.red, border:'none', color:C.w, fontFamily:F.h, fontWeight:700, fontSize:'.85rem', letterSpacing:'.15em', textTransform:'uppercase' }}>
              <ET {...t(hero.cta1, v=>set('hero.cta1',v), { color:C.w })} />
            </button>
            <button className="pf-btn-o" onClick={()=>goto('contact')} style={{ padding:'14px 32px', background:'transparent', border:`1px solid rgba(255,255,255,.14)`, color:C.w, fontFamily:F.h, fontWeight:600, fontSize:'.85rem', letterSpacing:'.15em', textTransform:'uppercase' }}>
              <ET {...t(hero.cta2, v=>set('hero.cta2',v), { color:C.w })} />
            </button>
          </div>
        </div>

        <div style={{ position:'absolute', right:60, bottom:56, display:'flex', gap:40 }}>
          {[['s1n','s1l'],['s2n','s2l'],['s3n','s3l']].map(([nk,lk]) => (
            <div key={nk} style={{ textAlign:'right' }}>
              <ET {...t(hero[nk], v=>set(`hero.${nk}`,v), { fontFamily:F.h, fontWeight:700, fontSize:'2.2rem', color:C.w, lineHeight:1, display:'block' }, 'div')} />
              <ET {...t(hero[lk], v=>set(`hero.${lk}`,v), { fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.12em', marginTop:4, display:'block', textTransform:'uppercase' }, 'div')} />
            </div>
          ))}
        </div>
        <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:F.m, fontSize:'.58rem', color:C.grey, letterSpacing:'.25em' }}>SCROLL</span>
          <div style={{ width:1, height:52, background:`linear-gradient(to bottom,${C.red},transparent)`, animation:'pf-pulse 2s infinite' }} />
        </div>
      </section>

      {/* ══ PRÉSENTATION ══ */}
      {sections.about && (
        <Wrap id="presentation" bg={C.bg}>
          <Jp ch="誰" style={{ top:-20, left:-30, fontSize:'10rem' }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', top:-16, left:-16, right:16, bottom:16, border:`1px solid ${C.red}`, opacity:.25 }} />
              <div style={{ position:'relative', width:'100%', aspectRatio:'3/4', overflow:'hidden' }}>
                {about.img
                  ? <img src={about.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .7s' }} />
                  : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:F.m, fontSize:'.6rem', color:'rgba(255,255,255,.12)', letterSpacing:'.25em' }}>PORTRAIT</span>
                    </div>
                }
                {editMode && <UploadBtn onFile={v=>set('about.img',v)} label="PORTRAIT" />}
              </div>
              <div style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%) rotate(90deg)', whiteSpace:'nowrap' }}>
                <ET {...t(about.side, v=>set('about.side',v), { fontFamily:F.m, fontSize:'.58rem', color:C.red, letterSpacing:'.45em' })} />
              </div>
            </div>
            <div>
              <SL num="01" title="Présentation" />
              <h2 style={{ fontFamily:F.h, fontWeight:700, fontSize:'clamp(2rem,3vw,3.5rem)', color:C.w, lineHeight:1.05, margin:'0 0 24px', letterSpacing:'-.01em' }}>
                <ET {...t(about.t1, v=>set('about.t1',v), { display:'block', color:C.w })} /><br/>
                <ET {...t(about.t2, v=>set('about.t2',v), { color:C.red })} />
              </h2>
              <ET {...t(about.p1, v=>set('about.p1',v), { fontFamily:F.b, fontSize:'1rem', color:C.grey, lineHeight:1.8, margin:'0 0 18px', display:'block' }, 'p')} />
              <ET {...t(about.p2, v=>set('about.p2',v), { fontFamily:F.b, fontSize:'1rem', color:C.grey, lineHeight:1.8, margin:'0 0 40px', display:'block' }, 'p')} />
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:40, height:1, background:C.red }} />
                <ET {...t(about.sig, v=>set('about.sig',v), { fontFamily:F.jp, fontSize:'1.4rem', color:C.w })} />
              </div>
            </div>
          </div>
        </Wrap>
      )}

      {/* ══ SERVICES ══ */}
      {sections.services && (
        <Wrap id="services" bg={C.bg2}>
          <Jp ch="術" style={{ top:40, right:0, fontSize:'14rem', opacity:.04 }} />
          <SL num="02" title="Services" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(255,255,255,.04)' }}>
            {services.filter(s=>s.visible).map((s, i) => {
              const ri = services.indexOf(s);
              return (
                <div key={i} className="pf-card" style={{ background:C.bg3, padding:'40px 32px', position:'relative', overflow:'hidden' }}>
                  {editMode && (
                    <button onClick={()=>setA('services',ri,'visible',false)}
                      style={{ position:'absolute', top:8, right:8, background:'rgba(255,23,68,.1)', border:'none', color:C.red, fontSize:'.65rem', cursor:'pointer', padding:'3px 8px', zIndex:5 }}>✕</button>
                  )}
                  <div style={{ position:'absolute', top:12, right:16, fontFamily:F.jp, fontWeight:900, fontSize:'3rem', color:'rgba(255,23,68,.07)', lineHeight:1, pointerEvents:'none' }}>
                    <ET {...t(s.jp, v=>setA('services',ri,'jp',v), {})} />
                  </div>
                  <ET {...t(s.num,   v=>setA('services',ri,'num',v),   { fontFamily:F.m, fontSize:'.62rem', color:C.red, letterSpacing:'.1em', marginBottom:20, display:'block' }, 'div')} />
                  <ET {...t(s.title, v=>setA('services',ri,'title',v), { fontFamily:F.h, fontWeight:700, fontSize:'1.5rem', color:C.w, margin:'0 0 12px', letterSpacing:'.06em', display:'block', textTransform:'uppercase' }, 'h3')} />
                  <ET {...t(s.desc,  v=>setA('services',ri,'desc',v),  { fontFamily:F.b, fontSize:'.85rem', color:C.grey, lineHeight:1.7, margin:'0 0 24px', display:'block' }, 'p')} />
                  <button onClick={() => setSelectedSvc(ri)} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0, marginTop:'auto' }}
                    onMouseEnter={e=>{e.currentTarget.querySelector('span').style.letterSpacing='.18em';e.currentTarget.querySelector('div').style.width='32px';}}
                    onMouseLeave={e=>{e.currentTarget.querySelector('span').style.letterSpacing='.08em';e.currentTarget.querySelector('div').style.width='20px';}}
                  >
                    <div style={{ width:20, height:1, background:C.red, transition:'width .3s' }} />
                    <span style={{ fontFamily:F.b, fontSize:'.75rem', color:C.red, letterSpacing:'.08em', transition:'letter-spacing .3s' }}>Découvrir</span>
                  </button>
                </div>
              );
            })}
            {editMode && services.some(s=>!s.visible) && (
              <div style={{ background:C.bg3, display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 }}>
                <button onClick={()=>{ const i=services.findIndex(s=>!s.visible); if(i>=0) setA('services',i,'visible',true); }}
                  style={{ background:'rgba(255,23,68,.06)', border:`1px dashed ${C.r30}`, color:C.red, padding:'12px 20px', cursor:'pointer', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.1em' }}>+ RESTAURER</button>
              </div>
            )}
          </div>
        </Wrap>
      )}

      {/* ══ GALERIE ══ */}
      {sections.gallery && (
        <Wrap id="galerie" bg={C.bg}>
          <Jp ch="撮" style={{ bottom:-40, left:'8%', fontSize:'18rem', opacity:.025 }} />
          <SL num="03" title="Galerie" />

          {/* ── Filtres catégories ── */}
          <div style={{ display:'flex', gap:8, marginBottom:36, flexWrap:'wrap', alignItems:'center' }}>
            {cats.map(cat => (
              <div key={cat} style={{ display:'flex', alignItems:'center', gap:0 }}>
                <button className={`pf-filter${galFilter===cat?' on':''}`} onClick={()=>setGalFilter(cat)}>{cat}</button>
                {/* Supprimer catégorie (sauf "Tout") en mode édition */}
                {editMode && cat !== 'Tout' && (
                  <button onClick={() => {
                    if (!confirm(`Supprimer toutes les photos de "${cat}" ?`)) return;
                    setContent(p => ({ ...p, gallery: p.gallery.filter(g => g.cat !== cat) }));
                    if (galFilter === cat) setGalFilter('Tout');
                  }} style={{ background:'rgba(255,23,68,.15)', border:'none', color:C.red, width:22, height:'100%', cursor:'pointer', fontFamily:F.m, fontSize:'.6rem', marginLeft:1 }} title={`Supprimer catégorie "${cat}"`}>✕</button>
                )}
              </div>
            ))}

            {/* Nouvelle catégorie */}
            {editMode && !newCatOpen && (
              <button onClick={() => setNewCatOpen(true)}
                style={{ background:'rgba(255,23,68,.06)', border:`1px dashed ${C.r30}`, color:C.red, padding:'8px 16px', fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.1em', cursor:'pointer' }}>
                + CATÉGORIE
              </button>
            )}
            {editMode && newCatOpen && (
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input
                  autoFocus
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCatInput.trim()) {
                      const nc = newCatInput.trim();
                      setContent(p => ({ ...p, gallery: [...p.gallery, { src:null, title:'Nouvelle image', cat:nc, visible:true }] }));
                      setGalFilter(nc);
                      setNewCatInput(''); setNewCatOpen(false);
                    }
                    if (e.key === 'Escape') { setNewCatInput(''); setNewCatOpen(false); }
                  }}
                  placeholder="Nom de la catégorie…"
                  style={{ background:'rgba(255,255,255,.05)', border:`1px solid ${C.red}`, color:C.w, padding:'7px 12px', fontFamily:F.m, fontSize:'.65rem', outline:'none', width:180 }}
                />
                <button onClick={() => {
                  const nc = newCatInput.trim();
                  if (!nc) return;
                  setContent(p => ({ ...p, gallery: [...p.gallery, { src:null, title:'Nouvelle image', cat:nc, visible:true }] }));
                  setGalFilter(nc); setNewCatInput(''); setNewCatOpen(false);
                }} style={{ background:C.red, border:'none', color:'#fff', padding:'7px 14px', fontFamily:F.m, fontSize:'.62rem', cursor:'pointer' }}>✓ OK</button>
                <button onClick={() => { setNewCatInput(''); setNewCatOpen(false); }}
                  style={{ background:'transparent', border:`1px solid ${C.b10}`, color:C.grey, padding:'7px 10px', fontFamily:F.m, fontSize:'.62rem', cursor:'pointer' }}>✕</button>
              </div>
            )}
          </div>

          {/* ── Grille masonry ── */}
          {(() => {
            const displayGal = filtGal.filter(g => editMode || g.src);
            const lbxGal     = filtGal.filter(g => g.src);
            return (
              <>
                {/* En-tête catégorie active */}
                <div key={`hdr-${galFilter}`} style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:20, animation:'pf-fadein .25s ease' }}>
                  <span style={{ fontFamily:F.h, fontWeight:700, fontSize:'1.6rem', color: galFilter==='Tout' ? C.w : C.red, letterSpacing:'.06em' }}>
                    {galFilter}
                  </span>
                  <span style={{ fontFamily:F.m, fontSize:'.58rem', color:C.grey, letterSpacing:'.15em' }}>
                    {lbxGal.length} photo{lbxGal.length !== 1 ? 's' : ''}
                  </span>
                  {galFilter !== 'Tout' && (
                    <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.r30},transparent)` }} />
                  )}
                </div>

                {displayGal.length === 0 && !editMode && (
                  <div style={{ textAlign:'center', padding:'80px 0', color:C.grey, fontFamily:F.m, fontSize:'.7rem', letterSpacing:'.2em' }}>AUCUNE IMAGE DANS CETTE CATÉGORIE</div>
                )}
                {displayGal.length > 0 && (
                  <div key={galFilter} style={{ columns:3, columnGap:4, animation:'pf-fadein .3s ease' }}>
                    {displayGal.map((g) => {
                      const origIdx = gal.indexOf(g);
                      return (
                        <div key={origIdx} style={{ breakInside:'avoid', marginBottom:4, position:'relative', overflow:'hidden', cursor: g.src && !editMode ? 'pointer':'default' }}
                          onClick={() => { if (g.src && !editMode) setLbxIdx(lbxGal.indexOf(g)); }}
                        >
                          {g.src
                            ? <img src={g.src} alt={g.title} style={{ width:'100%', display:'block', transition:'transform .7s' }}
                                onMouseEnter={e => !editMode && (e.currentTarget.style.transform='scale(1.04)')}
                                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                              />
                            : <div style={{ height:240, background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <span style={{ fontFamily:F.m, fontSize:'.55rem', color:'rgba(255,255,255,.12)', letterSpacing:'.25em' }}>CLIQUER POUR AJOUTER</span>
                              </div>
                          }
                          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top,rgba(5,5,10,.95) 0%,transparent 100%)', padding:'24px 16px 12px', opacity:0, transition:'opacity .3s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity='1'}
                            onMouseLeave={e => e.currentTarget.style.opacity='0'}
                          >
                            <ET value={g.cat}   onChange={v=>setA('gallery',origIdx,'cat',v)}   editMode={editMode} style={{ fontFamily:F.m, fontSize:'.52rem', color:C.red, letterSpacing:'.2em', marginBottom:4, display:'block' }} tag='div' />
                            <ET value={g.title} onChange={v=>setA('gallery',origIdx,'title',v)} editMode={editMode} style={{ fontFamily:F.h, fontWeight:700, fontSize:'.9rem', color:C.w, display:'block' }} tag='div' />
                          </div>
                          {editMode && <UploadBtn onFile={v=>setA('gallery',origIdx,'src',v)} />}
                          {editMode && (
                            <button type="button" onClick={e=>{e.stopPropagation();
                              setContent(p=>({...p,gallery:p.gallery.filter((_,i)=>i!==origIdx)}));
                            }} style={{ position:'absolute', top:6, right:6, background:'rgba(255,23,68,.2)', border:`1px solid ${C.red}`, color:C.red, width:24, height:24, cursor:'pointer', fontFamily:F.m, fontSize:'.65rem', zIndex:6, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Ajouter une photo à la catégorie active */}
                {editMode && (
                  <div style={{ display:'flex', justifyContent:'center', marginTop:24 }}>
                    <button type="button" onClick={() => {
                      const cat = galFilter === 'Tout' ? (cats[1] || 'Catégorie A') : galFilter;
                      setContent(p => ({ ...p, gallery: [...p.gallery, { src:null, title:'Nouvelle image', cat, visible:true }] }));
                    }} style={{ background:'transparent', border:`1px dashed ${C.r30}`, color:C.red, padding:'14px 48px', fontFamily:F.m, fontSize:'.62rem', letterSpacing:'.2em', cursor:'pointer', transition:'all .2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,23,68,.07)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
                    >
                      + AJOUTER UNE PHOTO {galFilter !== 'Tout' ? `· ${galFilter}` : ''}
                    </button>
                  </div>
                )}
              </>
            );
          })()}


          <div style={{ textAlign:'center', marginTop:48 }}>
            <button className="pf-btn-o" onClick={() => setFullGal(true)}
              style={{ padding:'14px 52px', background:'transparent', border:`1px solid rgba(255,255,255,.12)`, color:C.grey, fontFamily:F.h, fontWeight:600, fontSize:'.85rem', letterSpacing:'.2em', textTransform:'uppercase' }}>
              Voir toute la galerie →
            </button>
          </div>
        </Wrap>
      )}

      {/* ══ VIDÉO ══ */}
      {sections.video && (
        <section style={{ position:'relative', height:'60vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', overflow:'hidden' }}>
          {video.src
            ? <video src={video.src} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.15, pointerEvents:'none' }} autoPlay muted loop />
            : <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0D0D1E,#05050A)' }} />
          }
          {editMode && (
            <label style={{ position:'absolute', top:16, right:16, zIndex:10, background:'rgba(255,23,68,.12)', border:`1px dashed ${C.r30}`, color:C.red, padding:'8px 14px', fontFamily:F.m, fontSize:'.6rem', cursor:'pointer' }}>
              📹 VIDÉO
              <input type="file" accept="video/*" hidden onChange={e=>{ const f=e.target.files[0]; if(f) set('video.src',URL.createObjectURL(f)); e.target.value=''; }} />
            </label>
          )}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(${C.bg} 0%,transparent 25%,transparent 75%,${C.bg} 100%)` }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)`, backgroundSize:'60px 60px' }} />
          <div style={{ position:'relative', zIndex:2, padding:'0 60px' }}>
            <SL num="04" title="Film & Vidéo" />
            <h2 style={{ fontFamily:F.h, fontWeight:700, fontSize:'clamp(2rem,5vw,5rem)', color:C.w, margin:'0 0 40px', letterSpacing:'-.01em' }}>
              <ET {...t(video.t1, v=>set('video.t1',v), { display:'block', color:C.w })} /><br/>
              <ET {...t(video.t2, v=>set('video.t2',v), { color:C.red })} />
            </h2>
            <button className="pf-btn-r" style={{ width:72, height:72, borderRadius:'50%', background:C.red, border:'none', color:C.w, fontSize:'1.4rem', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px rgba(255,23,68,.5),0 0 80px rgba(255,23,68,.2)` }}>▶</button>
          </div>
        </section>
      )}

      {/* ══ ACTUALITÉS ══ */}
      {sections.actu && (
        <Wrap id="actualites" bg={C.bg2}>
          <Jp ch="新" style={{ top:40, right:0, fontSize:'14rem', opacity:.04 }} />
          <SL num="05" title="Actualités" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {actu.filter(r=>r.visible).map((r, i) => {
              const ri = actu.indexOf(r);
              const fileRef = { current: null };
              return (
                <div key={i} className="pf-card" style={{ background:C.bg3, border:`1px solid ${C.b05}`, overflow:'hidden', cursor:'pointer', position:'relative' }}>
                  {editMode && (
                    <button onClick={()=>setA('actu',ri,'visible',false)}
                      style={{ position:'absolute', top:8, right:8, background:'rgba(255,23,68,.1)', border:'none', color:C.red, fontSize:'.65rem', cursor:'pointer', padding:'3px 8px', zIndex:10 }}>✕</button>
                  )}
                  <div style={{ height:220, position:'relative', overflow:'hidden' }}>
                    {r.src
                      ? <img src={r.src} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .7s' }} />
                      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0D0D1E,#14041A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontFamily:F.m, fontSize:'.55rem', color:'rgba(255,255,255,.1)', letterSpacing:'.2em' }}>IMAGE</span>
                        </div>
                    }
                    <div className="pf-overlay" style={{ pointerEvents:'none' }}>
                      <ET {...t(r.cat, v=>setA('actu',ri,'cat',v), { fontFamily:F.m, fontSize:'.58rem', color:C.red, letterSpacing:'.2em' })} />
                    </div>
                    {editMode && <UploadBtn onFile={v=>setA('actu',ri,'src',v)} label="IMAGE" />}
                  </div>
                  <div style={{ padding:'24px' }}>
                    <ET {...t(r.date,  v=>setA('actu',ri,'date',v),  { fontFamily:F.m, fontSize:'.62rem', color:C.red, letterSpacing:'.1em', marginBottom:10, display:'block' }, 'div')} />
                    <ET {...t(r.title, v=>setA('actu',ri,'title',v), { fontFamily:F.h, fontWeight:700, fontSize:'1rem', color:C.w, margin:'0 0 14px', display:'block' }, 'h4')} />
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:16, height:1, background:C.red }} />
                      <span style={{ fontFamily:F.b, fontSize:'.75rem', color:C.grey }}>Lire la suite →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Wrap>
      )}

      {/* ══ CONTACT ══ */}
      {sections.contact && (
        <Wrap id="contact" bg={C.bg}>
          <Jp ch="連" style={{ bottom:-60, left:'15%', fontSize:'18rem', opacity:.03 }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:80 }}>
            <div>
              <SL num="06" title="Contact" />
              <h2 style={{ fontFamily:F.h, fontWeight:700, fontSize:'clamp(2rem,3.5vw,3.5rem)', color:C.w, lineHeight:1.05, margin:'0 0 40px' }}>
                <ET {...t(contact.t1, v=>set('contact.t1',v), { display:'block', color:C.w })} /><br/>
                <ET {...t(contact.t2, v=>set('contact.t2',v), { color:C.red })} />
              </h2>
              {[['◎','Téléphone','phone'],['◈','Email','email'],['◉','Zone','zone']].map(([icon,lbl,fld])=>(
                <div key={fld} style={{ display:'flex', gap:20, marginBottom:28, alignItems:'flex-start' }}>
                  <span style={{ fontFamily:F.m, fontSize:'.9rem', color:C.red, lineHeight:1.3, marginTop:2 }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.2em', marginBottom:4 }}>{lbl.toUpperCase()}</div>
                    <ET {...t(contact[fld], v=>set(`contact.${fld}`,v), { fontFamily:F.b, fontSize:'.95rem', color:C.w })} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop:40, borderTop:`1px solid ${C.b05}`, paddingTop:32 }}>
                <ET {...t(contact.jpd, v=>set('contact.jpd',v), { fontFamily:F.jp, fontSize:'1.2rem', color:'rgba(255,23,68,.3)', letterSpacing:'.3em', display:'block' }, 'div')} />
                <ET {...t(contact.jps, v=>set('contact.jps',v), { fontFamily:F.m, fontSize:'.6rem', color:C.grey, marginTop:8, letterSpacing:'.15em', display:'block' }, 'div')} />
              </div>
            </div>
            <ContactFormSection email={contact.email} btnLabel={contact.btn} onBtnChange={v=>set('contact.btn',v)} editMode={editMode} />
          </div>
        </Wrap>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ background:C.bg2, borderTop:`1px solid ${C.b05}`, padding:'40px 60px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:6, height:6, background:C.red, borderRadius:'50%', boxShadow:`0 0 10px ${C.red}` }} />
          <ET {...t(nav.logo,   v=>set('nav.logo',v),   { fontFamily:F.h, fontWeight:700, fontSize:'1rem', color:C.w, letterSpacing:'.15em' })} />
          <ET {...t(nav.logoJp, v=>set('nav.logoJp',v), { fontFamily:F.jp, fontSize:'.7rem', color:C.grey, marginLeft:6 })} />
        </div>
        <ET {...t(footer.copy, v=>set('footer.copy',v), { fontFamily:F.m, fontSize:'.6rem', color:C.grey, letterSpacing:'.1em' })} />
        <div style={{ display:'flex', gap:24 }}>
          {['s1','s2','s3'].map(k=>(
            <ET key={k} {...t(footer[k], v=>set(`footer.${k}`,v), { fontFamily:F.m, fontSize:'.58rem', color:C.grey, letterSpacing:'.12em', cursor:'pointer' })} />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
