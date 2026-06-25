// SCRUM-31: Artista ve solicitudes recibidas
// SCRUM-32: Artista acepta o rechaza solicitudes
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, CalendarDays, User, Briefcase, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  REQUESTED:  { label: 'Pendiente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  ACCEPTED:   { label: 'Aceptado',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle },
  REJECTED:   { label: 'Rechazado',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
  COMPLETED:  { label: 'Completado', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: CheckCircle },
};

export default function ArtistBookings() {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [acting, setActing]           = useState(null); // booking id being processed
  const [responseMsg, setResponseMsg] = useState({});  // { [id]: string }
  const [feedback, setFeedback]       = useState(null);

  const token = localStorage.getItem('artsync_token');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/artist/bookings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar solicitudes');
      setBookings(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // SCRUM-32: accept or reject
  const handleAction = async (bookingId, status) => {
    setActing(bookingId);
    setFeedback(null);
    try {
      const res  = await fetch(`http://localhost:3001/api/artist/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, responseMessage: responseMsg[bookingId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar la solicitud');
      setFeedback({ type: 'success', text: data.message });
      fetchBookings();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActing(null);
    }
  };

  const grouped = {
    REQUESTED:  bookings.filter(b => b.status === 'REQUESTED'),
    ACCEPTED:   bookings.filter(b => b.status === 'ACCEPTED'),
    REJECTED:   bookings.filter(b => b.status === 'REJECTED'),
    COMPLETED:  bookings.filter(b => b.status === 'COMPLETED'),
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando solicitudes...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Solicitudes de Contrato</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Gestioná las solicitudes que recibiste de clientes.</p>

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>{error}</div>}
      {feedback && (
        <div style={{ backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#22c55e' : '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />} {feedback.text}
        </div>
      )}

      {/* Summary counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(grouped).map(([status, items]) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
              <Icon size={24} style={{ color: cfg.color, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: cfg.color }}>{items.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Aún no has recibido solicitudes de contrato.
        </div>
      ) : (
        <>
          {/* SCRUM-31: Pending requests first */}
          {grouped.REQUESTED.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f59e0b' }}>⏳ Solicitudes Pendientes ({grouped.REQUESTED.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {grouped.REQUESTED.map(b => (
                  <BookingCard key={b.id} booking={b} showActions
                    responseMsg={responseMsg[b.id] || ''}
                    onResponseMsg={val => setResponseMsg(prev => ({ ...prev, [b.id]: val }))}
                    onAccept={() => handleAction(b.id, 'ACCEPTED')}
                    onReject={() => handleAction(b.id, 'REJECTED')}
                    acting={acting === b.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other statuses */}
          {['ACCEPTED', 'COMPLETED', 'REJECTED'].map(status => grouped[status].length > 0 && (
            <div key={status} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: STATUS_CONFIG[status].color }}>
                {STATUS_CONFIG[status].label} ({grouped[status].length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {grouped[status].map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function BookingCard({ booking: b, showActions, responseMsg, onResponseMsg, onAccept, onReject, acting }) {
  const cfg  = STATUS_CONFIG[b.status];
  const Icon = cfg.icon;
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `3px solid ${cfg.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={20} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{b.client?.user?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.client?.user?.email}</div>
          </div>
        </div>
        <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', color: cfg.color, background: cfg.bg, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icon size={14} /> {cfg.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {b.service && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={15} style={{ color: 'var(--accent-primary)' }} /> {b.service.name}</div>}
        {b.eventDate && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarDays size={15} style={{ color: 'var(--accent-primary)' }} /> {new Date(b.eventDate).toLocaleDateString('es-CR')}</div>}
        <div style={{ fontSize: '0.8rem' }}>Recibido: {new Date(b.createdAt).toLocaleDateString('es-CR')}</div>
      </div>

      {b.message && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
          <MessageSquare size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <span>{b.message}</span>
        </div>
      )}

      {b.responseMessage && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(129,140,248,0.06)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Tu respuesta:</strong> {b.responseMessage}
        </div>
      )}

      {/* SCRUM-32: accept/reject actions */}
      {showActions && (
        <div style={{ marginTop: '1rem' }}>
          <textarea
            placeholder="Mensaje de respuesta (opcional)..."
            value={responseMsg}
            onChange={e => onResponseMsg(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', marginBottom: '0.75rem', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onAccept} disabled={acting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', opacity: acting ? 0.7 : 1 }}>
              <CheckCircle size={16} /> {acting ? 'Procesando...' : 'Aceptar'}
            </button>
            <button onClick={onReject} disabled={acting} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: acting ? 0.7 : 1 }}>
              <XCircle size={16} /> Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
