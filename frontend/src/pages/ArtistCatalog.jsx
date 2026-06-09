import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, DollarSign, Palette, Star } from 'lucide-react';

export default function ArtistCatalog() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/artists');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Error al cargar artistas');
      
      setArtists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Cargando catálogo de artistas...
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Explorar Artistas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Descubre y contrata a los mejores talentos independientes.</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {artists.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No se encontraron artistas disponibles en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {artists.map(artist => (
            <div key={artist.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', opacity: 0.8, position: 'relative' }}>
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.user?.name || 'Artista')}&background=random&size=100`} 
                  alt={artist.user?.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #1a1a2e', position: 'absolute', bottom: '-40px', left: '1.5rem', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '3.5rem 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{artist.user?.name}</h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>
                  <Palette size={16} /> {artist.category}
                </span>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {artist.description || 'Sin descripción disponible.'}
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> {artist.location || 'Ubicación no especificada'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} /> {artist.basePrice ? `Desde $${artist.basePrice}` : 'Precio a convenir'}
                  </div>
                </div>

                <Link to={`/artists/${artist.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
