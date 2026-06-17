import React from 'react';

// Helper pour les icônes minimalistes style Figma
const Icon = ({ name }) => {
  const icons = {
    image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    video: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    text: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
    layout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
    interaction: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  };
  return icons[name] || icons.text;
};

const COMPONENT_TYPES = [
  { category: 'Visuel', items: [
    { type: 'image', label: 'Image simple', w: 4, h: 3, icon: 'image' },
    { type: 'image-fs', label: 'Image plein écran', w: 12, h: 6, icon: 'image' },
    { type: 'image-caption', label: 'Image + légende', w: 4, h: 5, icon: 'image' },
    { type: 'gallery', label: 'Galerie', w: 8, h: 4, icon: 'image' },
    { type: 'carousel', label: 'Carrousel Swiper', w: 6, h: 4, icon: 'image' },
    { type: 'polaroid', label: 'Style Polaroid', w: 3, h: 4, icon: 'image' },
    { type: 'compare', label: 'Avant/Après', w: 6, h: 4, icon: 'image' },
    { type: 'video', label: 'Vidéo simple', w: 6, h: 4, icon: 'video' },
    { type: 'video-bg', label: 'Vidéo background', w: 12, h: 6, icon: 'video' }
  ]},
  { category: 'Contenu', items: [
    { type: 'video-overlay', label: 'Vidéo + texte', w: 8, h: 4, icon: 'video' },
    { type: 'h1', label: 'Titre H1', w: 6, h: 1, icon: 'text' },
    { type: 'text', label: 'Paragraphe', w: 4, h: 2, icon: 'text' },
    { type: 'quote', label: 'Citation stylée', w: 6, h: 2, icon: 'text' },
    { type: 'story', label: 'Storytelling', w: 8, h: 4, icon: 'text' },
    { type: 'cta', label: 'Bouton CTA', w: 3, h: 1, icon: 'interaction' },
    { type: 'about', label: 'Bloc À propos', w: 4, h: 4, icon: 'interaction' }
  ]},
  { category: 'Structure', items: [
    { type: 'spacer', label: 'Spacer', w: 12, h: 1, icon: 'layout' },
    { type: 'divider', label: 'Séparateur', w: 12, h: 1, icon: 'layout' },
    { type: 'card', label: 'Carte interactive', w: 4, h: 4, icon: 'layout' },
    { type: 'timeline', label: 'Timeline', w: 4, h: 6, icon: 'layout' },
    { type: 'counter', label: 'Compteur animé', w: 3, h: 2, icon: 'interaction' }
  ]},
  { category: 'Interaction', items: [
    { type: 'skills', label: 'Compétences', w: 6, h: 3, icon: 'interaction' },
    { type: 'social', label: 'Social Embed', w: 4, h: 4, icon: 'interaction' },
    { type: 'audio', label: 'Audio Player', w: 4, h: 1, icon: 'interaction' },
    { type: 'contact', label: 'Formulaire', w: 6, h: 6, icon: 'interaction' }
  ]}
];

const Toolbox = () => {
  const onDragStart = (e, item) => {
    // On passe les données de l'item pour l'élément "droppable"
    e.dataTransfer.setData('text/plain', ''); // Requis pour Firefox
    const itemWithDefaults = { ...item, zIndex: 1 };
    e.dataTransfer.setData('application/json', JSON.stringify(itemWithDefaults));
  };

  return (
    <aside className="toolbox">
      <div style={{ paddingBottom: '20px' }}>
        <h2 style={{ color: '#F2F2F2', fontSize: '1rem', marginBottom: '10px' }}>Toolbox</h2>
        <p style={{ color: '#BFBFBF', fontSize: '0.75rem' }}>Glissez un élément vers la grille</p>
      </div>
      
      {COMPONENT_TYPES.map(section => (
        <div key={section.category}>
          <div className="toolbox-section">{section.category}</div>
          {section.items.map(item => (
            <div
              key={item.type}
              className="toolbox-item"
              draggable={true}
              onDragStart={(e) => onDragStart(e, item)}
            >
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default Toolbox;