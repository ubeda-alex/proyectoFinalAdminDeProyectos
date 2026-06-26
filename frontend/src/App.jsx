// SCRUM-41: Fluent navigation, protected routes, consistent layout
// SCRUM-42: Full E2E flow accessible from every entry point
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import ArtistProfile from './pages/ArtistProfile';
import ArtistCatalog from './pages/ArtistCatalog';
import PublicArtistProfile from './pages/PublicArtistProfile';
import ArtistBookings from './pages/ArtistBookings';
import ArtistAgenda from './pages/ArtistAgenda';
import ClientBookings from './pages/ClientBookings';
import NotFound from './pages/NotFound';
import { Sparkles, LogOut, User, FileText, CalendarDays, ClipboardList, Search } from 'lucide-react';
import './App.css';

// SCRUM-41: Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// SCRUM-41: Protected route wrapper — redirects to /login if no token
function ProtectedRoute({ children, requiredRole }) {
  const token   = localStorage.getItem('artsync_token');
  const userStr = localStorage.getItem('artsync_user');
  const user    = userStr ? JSON.parse(userStr) : null;

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function Layout({ children }) {
  const token   = localStorage.getItem('artsync_token');
  const userStr = localStorage.getItem('artsync_user');
  const user    = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('artsync_token');
    localStorage.removeItem('artsync_user');
    window.location.href = '/';
  };

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
          <Sparkles className="brand-icon" /><span>ArtisLink</span>
        </Link>
        <div className="nav-links">
          <Link to="/artists" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Search size={15} /> Explorar
          </Link>
          {token ? (
            <>
              {user?.role === 'ARTIST' && (
                <>
                  <Link to="/profile"         style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><User size={15} /> Perfil</Link>
                  <Link to="/mis-solicitudes" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={15} /> Solicitudes</Link>
                  <Link to="/mi-agenda"       style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={15} /> Agenda</Link>
                </>
              )}
              {user?.role === 'CLIENT' && (
                <Link to="/mis-contratos" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardList size={15} /> Contratos</Link>
              )}
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <User size={16} /> {user?.name}
              </span>
              <button onClick={handleLogout} className="btn" title="Cerrar sesión" style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '0.5rem' }}>Iniciar Sesión</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Registrarse</Link>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">{children}</main>
      {/* SCRUM-41: Consistent footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4rem' }}>
        ArtisLink © 2026 — Plataforma de Gestión de Servicios Artísticos
      </footer>
    </div>
  );
}

// SCRUM-42: Home shows clear CTA for the full E2E flow
function Home() {
  const token   = localStorage.getItem('artsync_token');
  const userStr = localStorage.getItem('artsync_user');
  const user    = userStr ? JSON.parse(userStr) : null;

  return (
    <div>
      <div className="hero-section text-center" style={{ marginTop: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Conecta tu Arte con el <span style={{ color: 'var(--accent-primary)' }}>Mundo</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          La plataforma centralizada para artistas independientes y clientes. Buscá, contratá y gestioná eventos en un solo lugar.
        </p>

        {!token ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>Únete como Artista o Cliente</Link>
            <Link to="/artists"  className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.2)' }}>Explorar Artistas</Link>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>¡Hola, {user?.name}!</h3>
            {user?.role === 'ARTIST' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/profile"         className="btn btn-primary" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Mi Perfil</Link>
                <Link to="/mis-solicitudes" className="btn" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.2)' }}><FileText size={16} /> Solicitudes Recibidas</Link>
                <Link to="/mi-agenda"       className="btn" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.2)' }}><CalendarDays size={16} /> Mi Agenda</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/artists"       className="btn btn-primary" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> Buscar Artistas</Link>
                <Link to="/mis-contratos" className="btn" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.2)' }}><ClipboardList size={16} /> Mis Contratos</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCRUM-42: How it works section — shows the full E2E flow */}
      {!token && (
        <div style={{ maxWidth: '900px', margin: '5rem auto', padding: '0 1rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>¿Cómo funciona?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '1', icon: '🎨', title: 'Registrate', desc: 'Creá tu cuenta como artista o como cliente en segundos.' },
              { step: '2', icon: '🔍', title: 'Explorá', desc: 'Buscá artistas por categoría, zona o disponibilidad.' },
              { step: '3', icon: '📋', title: 'Contratá', desc: 'Enviá una solicitud directa al artista con los detalles del evento.' },
              { step: '4', icon: '✅', title: 'Confirmá', desc: 'El artista acepta y el evento queda confirmado en su agenda.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                <div style={{ display: 'inline-block', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', fontSize: '0.85rem', fontWeight: '700', lineHeight: '28px', marginBottom: '0.75rem' }}>{step}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/artists"  element={<ArtistCatalog />} />
          <Route path="/artists/:id" element={<PublicArtistProfile />} />

          {/* SCRUM-41: Protected routes redirect to login if no session */}
          <Route path="/profile"         element={<ProtectedRoute requiredRole="ARTIST"><ArtistProfile /></ProtectedRoute>} />
          <Route path="/mis-solicitudes" element={<ProtectedRoute requiredRole="ARTIST"><ArtistBookings /></ProtectedRoute>} />
          <Route path="/mi-agenda"       element={<ProtectedRoute requiredRole="ARTIST"><ArtistAgenda /></ProtectedRoute>} />
          <Route path="/mis-contratos"   element={<ProtectedRoute requiredRole="CLIENT"><ClientBookings /></ProtectedRoute>} />

          {/* SCRUM-41: 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
