import { useEffect } from 'react';
import { useInstagram, fmtNum } from '../lib/instagram';
import { C, F, SL } from './LayoutTemplate';

const CSS_ID = 'ig-section-css';

function useIgStyles() {
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
      .ig-item { position:relative; overflow:hidden; cursor:pointer; aspect-ratio:1; background:#0D0D1E; }
      .ig-item img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .45s; }
      .ig-item:hover img { transform:scale(1.07); }
      .ig-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(5,5,10,.95) 0%,rgba(5,5,10,.3) 60%,transparent 100%); opacity:0; transition:opacity .35s; display:flex; flex-direction:column; justify-content:flex-end; padding:14px; pointer-events:none; }
      .ig-item:hover .ig-overlay { opacity:1; }
      .ig-skeleton { background:linear-gradient(90deg,#0D0D1E 25%,#14142A 50%,#0D0D1E 75%); background-size:200% 100%; animation:ig-shimmer 1.5s infinite; aspect-ratio:1; }
      @keyframes ig-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    `;
    document.head.appendChild(s);
    return () => document.getElementById(CSS_ID)?.remove();
  }, []);
}

const Stat = ({ num, label }) => (
  <div style={{ textAlign:'center' }}>
    <div style={{ fontFamily:F.h, fontWeight:700, fontSize:'1.8rem', color:C.w, letterSpacing:'.05em', lineHeight:1 }}>{num}</div>
    <div style={{ fontFamily:F.m, fontSize:'.52rem', color:C.grey, letterSpacing:'.25em', marginTop:4 }}>{label}</div>
  </div>
);

const Thumb = ({ item, onClick }) => {
  const src  = item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url;
  const date = item.timestamp
    ? new Date(item.timestamp).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
    : '';
  return (
    <div className="ig-item" onClick={onClick} title={item.caption?.slice(0, 80) || ''}>
      {src
        ? <img src={src} alt={item.caption?.slice(0, 40) || 'Instagram'} loading="lazy" />
        : <div style={{ width:'100%', height:'100%', background:'#0D0D1E', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:F.m, fontSize:'.5rem', color:'rgba(255,255,255,.1)' }}>⬛</span>
          </div>
      }
      <div className="ig-overlay">
        {item.caption && (
          <div style={{ fontFamily:F.b, fontSize:'.72rem', color:C.w, lineHeight:1.4, marginBottom:6,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {item.caption}
          </div>
        )}
        <div style={{ fontFamily:F.m, fontSize:'.5rem', color:C.grey, letterSpacing:'.1em' }}>{date}</div>
      </div>
      {item.media_type === 'VIDEO' && (
        <div style={{ position:'absolute', top:10, right:10, fontSize:'.7rem' }}>▶</div>
      )}
      {item.media_type === 'CAROUSEL_ALBUM' && (
        <div style={{ position:'absolute', top:10, right:10, fontSize:'.7rem' }}>❐</div>
      )}
    </div>
  );
};

const Skeleton = ({ count = 12, cols = 4 }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:6, marginTop:32 }}>
    {Array.from({ length: count }, (_, i) => <div key={i} className="ig-skeleton" />)}
  </div>
);

// ── NotConfigured placeholder (visible only in edit mode) ────────────────────
const NotConfigured = () => (
  <div style={{ border:`1px dashed rgba(255,23,68,.2)`, padding:'40px 32px', textAlign:'center', marginTop:32 }}>
    <div style={{ fontFamily:F.jp, fontSize:'2rem', color:'rgba(255,23,68,.1)', marginBottom:16 }}>🔗</div>
    <div style={{ fontFamily:F.m, fontSize:'.65rem', color:C.red, letterSpacing:'.2em', marginBottom:12 }}>INSTAGRAM NON CONNECTÉ</div>
    <div style={{ fontFamily:F.b, fontSize:'.8rem', color:C.grey, lineHeight:1.7, maxWidth:460, margin:'0 auto' }}>
      Pour afficher votre feed et vos stats, ajoutez votre token Instagram dans le panneau Cloudflare Workers.<br />
      <span style={{ color:'rgba(255,255,255,.3)', fontSize:'.7rem' }}>Variables d'environnement → INSTAGRAM_TOKEN</span>
    </div>
  </div>
);

// ── Main exported component ───────────────────────────────────────────────────
const InstagramSection = ({ editMode, slNum = '05', limit = 12, cols = 4 }) => {
  useIgStyles();
  const { data, loading } = useInstagram();

  const configured = data?.configured !== false;
  const profile    = data?.profile || null;
  const media      = (data?.media || []).slice(0, limit);
  const igUrl      = profile?.username ? `https://www.instagram.com/${profile.username}/` : 'https://www.instagram.com/';

  if (!configured && !editMode) return null;

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 60px' }}>
      <SL num={slNum} title="Instagram · インスタグラム" />

      {/* Stats bar */}
      {configured && (
        <div style={{
          display:'flex', alignItems:'center', gap:40, flexWrap:'wrap',
          padding:'24px 32px', background:C.card,
          border:`1px solid rgba(255,255,255,.06)`, marginBottom:0,
        }}>
          {profile?.followers_count != null && (
            <Stat num={fmtNum(profile.followers_count)} label="ABONNÉS" />
          )}
          {profile?.media_count != null && (
            <Stat num={fmtNum(profile.media_count)} label="PUBLICATIONS" />
          )}
          {profile?.username && (
            <div style={{ flex:1, fontFamily:F.m, fontSize:'.7rem', color:C.grey, letterSpacing:'.1em' }}>
              @{profile.username}
            </div>
          )}
          <a href={igUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none',
              background:C.red, padding:'10px 24px',
              fontFamily:F.h, fontWeight:700, fontSize:'.75rem', letterSpacing:'.15em', color:C.w }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            SUIVRE
          </a>
        </div>
      )}

      {/* Feed grid */}
      {loading && <Skeleton count={limit} cols={cols} />}

      {!loading && configured && media.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:6, marginTop:6 }}>
          {media.map(item => (
            <Thumb
              key={item.id}
              item={item}
              onClick={() => window.open(item.permalink, '_blank', 'noopener')}
            />
          ))}
        </div>
      )}

      {!loading && !configured && editMode && <NotConfigured />}

      {/* Bottom link */}
      {configured && !loading && (
        <div style={{ marginTop:32, textAlign:'center' }}>
          <a href={igUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none',
              border:`1px solid rgba(255,255,255,.08)`, padding:'12px 32px',
              fontFamily:F.m, fontSize:'.6rem', letterSpacing:'.2em', color:C.grey,
              transition:'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = C.grey; }}
          >
            VOIR PLUS SUR INSTAGRAM ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default InstagramSection;
