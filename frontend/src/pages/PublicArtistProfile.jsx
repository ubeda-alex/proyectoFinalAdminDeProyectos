import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, DollarSign, Palette, ExternalLink, ArrowLeft, Clock, List, ClipboardList, Briefcase, Mail } from 'lucide-react';

export default function PublicArtistProfile() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const fetchArtist = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/artists/${id}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Error al cargar el perfil del artista');
      
      setArtist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Cargando perfil del artista...
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          {error || 'Artista no encontrado'}
        </div>
        <Link to="/artists" className="btn" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/artists" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.2s' }}>
        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al catálogo
      </Link>

      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ height: '150px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', opacity: 0.8, position: 'relative' }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.user?.name || 'Artista')}&background=random&size=150`} 
            alt={artist.user?.name}
            style={{ width: '120px', height: '120px', borderRadius: '50%', border: '5px solid #1a1a2e', position: 'absolute', bottom: '-60px', left: '2rem', objectFit: 'cover' }}
          />
        </div>

        <div style={{ padding: '5rem 2rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{artist.user?.name}</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '500' }}>
                <Palette size={18} /> {artist.category}
              </span>
            </div>
            
            <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Mail size={18} /> Contactar
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <MapPin size={18} /> {artist.location || 'Ubicación no especificada'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <DollarSign size={18} /> {artist.basePrice ? `Precio base: $${artist.basePrice}` : 'Precio a convenir'}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Sobre mí</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {artist.description || 'Este artista aún no ha agregado una descripción.'}
            </p>
          </div>

          {artist.portfolio && artist.portfolio.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} style={{ color: 'var(--accent-primary)' }} /> Portafolio
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {artist.portfolio.map((link, index) => (
                  <a 
                    key={index} 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  >
                    <ExternalLink size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ClipboardList size={24} style={{ color: 'var(--accent-primary)' }} /> Servicios Ofrecidos
      </h2>

      {(!artist.services || artist.services.length === 0) ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Este artista no ha publicado servicios específicos todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {artist.services.map(service => (
            <div key={service.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{service.name}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>{service.description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                {service.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} style={{ color: 'var(--accent-primary)' }} /> 
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Duración:</span> {service.duration}
                  </div>
                )}
                {service.requirements && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <List size={16} style={{ color: 'var(--accent-primary)' }} /> 
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Requisitos:</span> {service.requirements}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
