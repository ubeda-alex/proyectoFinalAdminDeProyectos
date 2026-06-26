// SCRUM-41: Consistent navigation — 404 fallback page
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '6rem', padding: '0 1rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🎭</div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Página no encontrada</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '450px', margin: '0 auto 2rem' }}>
        La página que buscás no existe o fue movida. Volvé al inicio o explorá el catálogo de artistas.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Home size={18} /> Ir al inicio
        </Link>
        <Link to="/artists" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Search size={18} /> Explorar artistas
        </Link>
      </div>
    </div>
  );
}
