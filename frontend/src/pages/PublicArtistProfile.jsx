// SCRUM-30: Cliente envía solicitud de contrato desde el perfil del artista
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, DollarSign, Palette, ExternalLink, ArrowLeft, Clock, List, ClipboardList, Briefcase, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function PublicArtistProfile() {
  const { id } = useParams();
  const [artist, setArtist]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitMsg, setSubmitMsg]     = useState(null); // { type: 'success'|'error', text }
  const [form, setForm]               = useState({ serviceId: '', eventDate: '', message: '' });

  const token    = localStorage.getItem('artsync_token');
  const userStr  = localStorage.getItem('artsync_user');
  const user     = userStr ? JSON.parse(userStr) : null;
  const isClient = user?.role === 'CLIENT';

  useEffect(() => { fetchArtist(); }, [id]);

  const fetchArtist = async () => {
    try {
      const res  = await fetch(`http://localhost:3001/api/artists/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar el perfil');
      setArtist(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // SCRUM-30: send booking request
  const handleSubmit = async () => {
    if (!form.message.trim()) { setSubmitMsg({ type: 'error', text: 'Por favor describe el evento o servicio que necesitás.' }); return; }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res  = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artistId: id, serviceId: form.serviceId || undefined, eventDate: form.eventDate || undefined, message: form.message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar la solicitud');
      setSubmitMsg({ type: 'success', text: '¡Solicitud enviada! El artista la revisará pronto.' });
      setForm({ serviceId: '', eventDate: '', message: '' });
      setShowForm(false);
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando perfil del artista...</div>;

  if (error || !artist) return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>{error || 'Artista no encontrado'}</div>
      <Link to="/artists" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><ArrowLeft size={16} /> Volver al catálogo</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/artists" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al catálogo
      </Link>

      {/* Success/Error message after booking */}
      {submitMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', backgroundColor: submitMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: submitMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
          {submitMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {submitMsg.text}
        </div>
      )}

      {/* Profile header */}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: '500' }}>
                <Palette size={18} /> {artist.category}
              </span>
            </div>

            {/* SCRUM-30: Solicitar button — only for logged-in clients */}
            {isClient ? (
              <button
                onClick={() => { setShowForm(!showForm); setSubmitMsg(null); }}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
              >
                <Send size={18} /> {showForm ? 'Cancelar' : 'Solicitar Contrato'}
              </button>
            ) : !token ? (
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} /> Iniciar sesión para contratar
              </Link>
            ) : null}
          </div>

          {/* SCRUM-30: Booking form */}
          {showForm && isClient && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem' }}>Enviar solicitud de contrato</h3>

              {artist.services && artist.services.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Servicio (opcional)</label>
                  <select
                    value={form.serviceId}
                    onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                  >
                    <option value="" style={{ background: '#1a1a2e' }}>Sin servicio específico</option>
                    {artist.services.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Fecha del evento (opcional)</label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Mensaje / descripción del evento *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describí el tipo de evento, cantidad de asistentes, duración esperada, requisitos especiales..."
                  rows={4}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}
              >
                <Send size={16} /> {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }}>
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
                {artist.portfolio.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)' }}>
                    <ExternalLink size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ClipboardList size={24} style={{ color: 'var(--accent-primary)' }} /> Servicios Ofrecidos
      </h2>
      {(!artist.services || artist.services.length === 0) ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Este artista no ha publicado servicios específicos todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {artist.services.map(service => (
            <div key={service.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{service.name}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>{service.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                {service.duration && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Duración:</span> {service.duration}</div>}
                {service.requirements && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><List size={16} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Requisitos:</span> {service.requirements}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
