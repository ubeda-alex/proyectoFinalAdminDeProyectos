import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ArtistProfile from './pages/ArtistProfile';
import ArtistCatalog from './pages/ArtistCatalog';
import PublicArtistProfile from './pages/PublicArtistProfile';
import ArtistBookings from './pages/ArtistBookings';
import ArtistAgenda from './pages/ArtistAgenda';
import ClientBookings from './pages/ClientBookings';
import { Sparkles, LogOut, User, FileText, CalendarDays, ClipboardList } from 'lucide-react';
import './App.css';

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
          <Link to="/artists" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', fontWeight: '500' }}>Explorar</Link>
          {token ? (
            <>
              {user?.role === 'ARTIST' && (
                <>
                  <Link to="/profile" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><User size={15} /> Perfil</Link>
                  <Link to="/mis-solicitudes" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={15} /> Solicitudes</Link>
                  <Link to="/mi-agenda" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={15} /> Agenda</Link>
                </>
              )}
              {user?.role === 'CLIENT' && (
                <Link to="/mis-contratos" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardList size={15} /> Mis Contratos</Link>
              )}
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <User size={16} /> {user?.name}
              </span>
              <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Iniciar Sesión</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Registrarse</Link>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}

function Home() {
  const token   = localStorage.getItem('artsync_token');
  const userStr = localStorage.getItem('artsync_user');
  const user    = userStr ? JSON.parse(userStr) : null;
  return (
    <div className="hero-section text-center" style={{ marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Conecta tu Arte con el <span style={{ color: 'var(--accent-primary)' }}>Mundo</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
        La plataforma centralizada para artistas independientes y clientes. Busca, contrata y gestiona eventos en un solo lugar.
      </p>
      {!token ? (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>Únete a la Plataforma</Link>
          <Link to="/artists" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.2)' }}>Explorar Artistas</Link>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '440px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1rem' }}>¡Hola, {user?.name}!</h3>
          {user?.role === 'ARTIST' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/profile"        className="btn btn-primary" style={{ justifyContent: 'center' }}>Mi Perfil</Link>
              <Link to="/mis-solicitudes" className="btn" style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>Solicitudes Recibidas</Link>
              <Link to="/mi-agenda"      className="btn" style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>Mi Agenda</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/artists"       className="btn btn-primary" style={{ justifyContent: 'center' }}>Buscar Artistas</Link>
              <Link to="/mis-contratos" className="btn" style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>Mis Contratos</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/profile"         element={<ArtistProfile />} />
          <Route path="/artists"         element={<ArtistCatalog />} />
          <Route path="/artists/:id"     element={<PublicArtistProfile />} />
          <Route path="/mis-solicitudes" element={<ArtistBookings />} />
          <Route path="/mi-agenda"       element={<ArtistAgenda />} />
          <Route path="/mis-contratos"   element={<ClientBookings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
