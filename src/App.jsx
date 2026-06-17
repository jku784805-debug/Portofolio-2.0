import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import GridEditor from './GridEditor';
import Toolbox from './Toolbox';
import Portfolio from './Portfolio';
import Decouvrir from './pages/Decouvrir';
import Galerie from './pages/Galerie';
import Contact from './pages/Contact';
import Disponibilites from './pages/Disponibilites';
import SeancesAdmin from './pages/admin/SeancesAdmin';
import './GridEditor.css';

function App() {
  const [studioMode, setStudioMode] = useState(false);

  // Studio / GridEditor (kept outside router — full-screen overlay)
  if (studioMode) {
    return (
      <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{
          padding: '10px 20px', background: '#0D0D0D', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid #2E2E2E', gap: 12,
        }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0, color: '#D4A017', whiteSpace: 'nowrap' }}>MDSGN / STUDIO</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStudioMode(false)} style={{
              padding: '8px 16px', backgroundColor: '#1A1A2E', color: '#C49A3C',
              border: '1px solid #C49A3C', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.1em',
            }}>👁 RETOUR PORTFOLIO</button>
          </div>
        </header>
        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Toolbox />
          <div style={{ flexGrow: 1, overflowY: 'auto' }}>
            <GridEditor isEditMode={true} />
          </div>
        </div>
      </div>
    );
  }

  // Multi-page portfolio with React Router
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<Portfolio />} />
          <Route path="/decouvrir"       element={<Decouvrir />} />
          <Route path="/galerie"         element={<Galerie />} />
          <Route path="/contact"           element={<Contact />} />
          <Route path="/disponibilites"  element={<Disponibilites />} />
          <Route path="/admin/seances"   element={<SeancesAdmin />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
