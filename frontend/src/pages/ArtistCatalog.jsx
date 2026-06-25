// SCRUM-27: Búsqueda por categoría
// SCRUM-28: Filtro por zona geográfica
// SCRUM-29: Filtro por disponibilidad
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, DollarSign, Palette, Filter, X } from 'lucide-react';

const CATEGORIES = ['all', 'Música', 'Danza', 'Humor', 'Teatro', 'Artes Plásticas', 'Fotografía', 'Pintura al Óleo', 'Muralismo', 'Ilustración Digital', 'Cerámica y Escultura'];
const LOCATIONS  = ['all', 'San José', 'Heredia', 'Alajuela', 'Cartago', 'Liberia', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Querétaro'];

export default function ArtistCatalog() {
  const [artists, setArtists]     = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');
  const [location, setLocation]   = useState('all');
  const [onlyAvail, setOnlyAvail] = useState(false);

  useEffect(() => { fetchArtists(); }, [category, location, onlyAvail]);

  useEffect(() => {
    // Local text search on top of server-side filters
    if (!search.trim()) { setFiltered(artists); return; }
    const q = search.toLowerCase();
    setFiltered(artists.filter(a =>
      a.user?.name?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q)
    ));
  }, [search, artists]);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (location !== 'all') params.set('location', location);
      if (onlyAvail) params.set('available', 'true');
      const res  = await fetch(`http://localhost:3001/api/artists?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar artistas');
      setArtists(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch(''); setCategory('all'); setLocation('all'); setOnlyAvail(false);
  };

  const hasFilters = search || category !== 'all' || location !== 'all' || onlyAvail;

  const statusBadge = (status) => ({
    active:  { label: 'Disponible',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    pending: { label: 'No disponible', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' });

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Explorar Artistas</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Descubre y contrata a los mejores talentos independientes.
        </p>
      </div>

      {/* ── FILTERS ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Text search */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Buscar artista
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Nombre, categoría, descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* SCRUM-27: Category filter */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <Palette size={14} style={{ marginRight: '0.3rem' }} />Categoría
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
            >
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c === 'all' ? 'Todas las categorías' : c}</option>)}
            </select>
          </div>

          {/* SCRUM-28: Location filter */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <MapPin size={14} style={{ marginRight: '0.3rem' }} />Zona
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
            >
              {LOCATIONS.map(l => <option key={l} value={l} style={{ background: '#1a1a2e' }}>{l === 'all' ? 'Todas las zonas' : l}</option>)}
            </select>
          </div>

          {/* SCRUM-29: Availability filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.1rem' }}>
            <input
              type="checkbox"
              id="avail"
              checked={onlyAvail}
              onChange={e => setOnlyAvail(e.target.checked)}
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="avail" style={{ fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Solo disponibles</label>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X size={14} /> Limpiar
            </button>
          )}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {loading ? 'Buscando...' : `${filtered.length} artista${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando catálogo...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <Filter size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No se encontraron artistas con los filtros seleccionados.</p>
          <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>Ver todos los artistas</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filtered.map(artist => {
            const badge = statusBadge(artist.status);
            return (
              <div key={artist.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>

                <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', opacity: 0.8, position: 'relative' }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.user?.name || 'Artista')}&background=random&size=100`}
                    alt={artist.user?.name}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #1a1a2e', position: 'absolute', bottom: '-40px', left: '1.5rem', objectFit: 'cover' }}
                  />
                  {/* SCRUM-29: availability badge visible on card */}
                  <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
