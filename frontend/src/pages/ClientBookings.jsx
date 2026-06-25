// SCRUM-37: Panel del cliente con historial completo de contratos
// SCRUM-38: Cliente marca contrato como completado
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, CalendarDays, Palette, Briefcase, MessageSquare, Star } from 'lucide-react';

const STATUS_CONFIG = {
  REQUESTED:  { label: 'Solicitado',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock,        desc: 'Esperando respuesta del artista.' },
  ACCEPTED:   { label: 'Aceptado',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle,  desc: '¡El artista aceptó! Podés marcar como completado cuando recibas el servicio.' },
  REJECTED:   { label: 'Rechazado',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle,      desc: 'El artista no pudo aceptar esta solicitud.' },
  COMPLETED:  { label: 'Completado',  color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: Star,         desc: 'Servicio completado. ¡Gracias por usar ArtisLink!' },
};

export default function ClientBookings() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [completing, setCompleting] = useState(null);
  const [feedback, setFeedback]   = useState(null);

  const token = localStorage.getItem('artsync_token');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res  = await fetch('http://localhost:3001/api/client/bookings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar solicitudes');
      setBookings(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // SCRUM-38: Mark as completed
  const markCompleted = async (bookingId) => {
    setCompleting(bookingId);
    setFeedback(null);
    try {
      const res  = await fetch(`http://localhost:3001/api/client/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al completar el contrato');
      setFeedback({ type: 'success', text: '¡Contrato marcado como completado!' });
      fetchBookings();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally { setCompleting(null); }
  };

  const counts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(s => [s, bookings.filter(b => b.status === s).length]));
  const displayed = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tus contratos...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mis Contratos</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Historial y estado de todas tus solicitudes de contrato.</p>

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>{error}</div>}
      {feedback && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#22c55e' : '#ef4444' }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />} {feedback.text}
        </div>
      )}

      {/* SCRUM-37: Summary counters — filterable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon  = cfg.icon;
          const count = counts[status] || 0;
          const active = filter === status;
          return (
            <div key={status} className="glass-panel"
              onClick={() => setFilter(active ? 'all' : status)}
              style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: active ? `1px solid ${cfg.color}` : '1px solid transparent', transition: 'border 0.2s' }}>
              <Icon size={22} style={{ color: cfg.color, marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: cfg.color }}>{count}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {filter !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Mostrando: <strong style={{ color: STATUS_CONFIG[filter].color }}>{STATUS_CONFIG[filter].label}</strong>
          </span>
          <button onClick={() => setFilter('all')} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Ver todas</button>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          {bookings.length === 0 ? 'Aún no has enviado solicitudes de contrato.' : 'No hay contratos con ese estado.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map(b => {
            const cfg  = STATUS_CONFIG[b.status];
            const Icon = cfg.icon;
            return (
              <div key={b.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `3px solid ${cfg.color}` }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Palette size={20} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{b.artist?.user?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.artist?.category}</div>
                    </div>
                  </div>
                  <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', color: cfg.color, background: cfg.bg, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon size={14} /> {cfg.label}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: cfg.color, marginBottom: '0.75rem' }}>{cfg.desc}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {b.service && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={14} style={{ color: 'var(--accent-primary)' }} />{b.service.name}</span>}
                  {b.eventDate && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarDays size={14} style={{ color: 'var(--accent-primary)' }} />{new Date(b.eventDate).toLocaleDateString('es-CR')}</span>}
                  <span style={{ fontSize: '0.8rem' }}>Enviado: {new Date(b.createdAt).toLocaleDateString('es-CR')}</span>
                  {b.completedAt && <span style={{ fontSize: '0.8rem' }}>Completado: {new Date(b.completedAt).toLocaleDateString('es-CR')}</span>}
                </div>

                {b.message && (
                  <div style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginBottom: b.responseMessage ? '0.5rem' : 0 }}>
                    <MessageSquare size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong style={{ color: 'var(--text-primary)' }}>Tu mensaje:</strong> {b.message}</span>
                  </div>
                )}

                {b.responseMessage && (
                  <div style={{ padding: '0.65rem 1rem', background: 'rgba(129,140,248,0.06)', borderRadius: 'var(--radius)', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <MessageSquare size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong style={{ color: 'var(--text-primary)' }}>Respuesta del artista:</strong> {b.responseMessage}</span>
                  </div>
                )}

                {/* SCRUM-38: Complete button — only for ACCEPTED bookings */}
                {b.status === 'ACCEPTED' && (
                  <button
                    onClick={() => markCompleted(b.id)}
                    disabled={completing === b.id}
                    className="btn btn-primary"
                    style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', opacity: completing === b.id ? 0.7 : 1 }}
                  >
                    <Star size={16} /> {completing === b.id ? 'Procesando...' : 'Marcar como Completado'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
