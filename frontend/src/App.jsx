import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterArtist from './pages/RegisterArtist';
import { Sparkles } from 'lucide-react';
import './App.css'; // Let's just use index.css entirely or clean App.css

function Layout({ children }) {
  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          <Sparkles className="brand-icon" />
          <span>ArtSync Platform</span>
        </div>
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/register-artist" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Soy Artista
          </Link>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="hero-section text-center" style={{ marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Conecta tu Arte con el <span style={{ color: 'var(--accent-primary)' }}>Mundo</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
        La plataforma centralizada para artistas independientes. Ofrece tus servicios, gestiona tus contratos y coordina tu agenda en un solo lugar.
      </p>
      <Link to="/register-artist" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
        Únete como Artista
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register-artist" element={<RegisterArtist />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
