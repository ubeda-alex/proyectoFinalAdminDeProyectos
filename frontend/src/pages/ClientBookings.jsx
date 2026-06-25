// SCRUM-33: Cliente ve el estado de sus solicitudes de contrato
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, CalendarDays, Palette, Briefcase, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  REQUESTED:  { label: 'Solicitado',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock,        desc: 'El artista aún no ha respondido.' },
  ACCEPTED:   { label: 'Aceptado',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle,  desc: '¡El artista aceptó tu solicitud!' },
  REJECTED:   { label: 'Rechazado',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle,      desc: 'El artista no pudo aceptar esta solicitud.' },
  COMPLETED:  { label: 'Completado',  color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: CheckCircle,  desc: 'Servicio completado.' },
};

export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');

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

  const displayed = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tus solicitudes...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mis Solicitudes</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Seguí el estado de todas tus solicitudes de contrato.</p>

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          const count = bookings.filter(b => b.status === status).length;
          return (
            <div key={status} className="glass-panel" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: filter === status ? `1px solid ${cfg.color}` : '1px solid transparent', transition: 'border 0.2s' }}
              onClick={() => setFilter(filter === status ? 'all' : status)}>
              <Icon size={22} style={{ color: cfg.color, marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: cfg.color }}>{count}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter label */}
      {filter !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mostrando: <strong style={{ color: STATUS_CONFIG[filter].color }}>{STATUS_CONFIG[filter].label}</strong></span>
          <button onClick={() => setFilter('all')} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Ver todas</button>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          {bookings.length === 0 ? 'Aún no has enviado solicitudes de contrato.' : 'No hay solicitudes con ese estado.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map(b => {
            const cfg  = STATUS_CONFIG[b.status];
            const Icon = cfg.icon;
            return (
              <div key={b.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
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

                <p style={{ fontSize: '0.85rem', color: cfg.color, marginBottom: '1rem' }}>{cfg.desc}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {b.service && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={15} style={{ color: 'var(--accent-primary)' }} /> {b.service.name}</div>}
                  {b.eventDate && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarDays size={15} style={{ color: 'var(--accent-primary)' }} /> {new Date(b.eventDate).toLocaleDateString('es-CR')}</div>}
                  <div style={{ fontSize: '0.8rem' }}>Enviado: {new Date(b.createdAt).toLocaleDateString('es-CR')}</div>
                </div>

                {b.message && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginBottom: b.responseMessage ? '0.75rem' : 0 }}>
                    <MessageSquare size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong style={{ color: 'var(--text-primary)' }}>Tu mensaje:</strong> {b.message}</span>
                  </div>
                )}

                {b.responseMessage && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(129,140,248,0.06)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                    <MessageSquare size={15} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong style={{ color: 'var(--text-primary)' }}>Respuesta del artista:</strong> {b.responseMessage}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
