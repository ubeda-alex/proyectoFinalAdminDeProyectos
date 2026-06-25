// SCRUM-34: Artista registra disponibilidad en calendario
// SCRUM-36: Artista ve contratos aceptados en su agenda
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar, User, Briefcase } from 'lucide-react';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export default function ArtistAgenda() {
  const today = new Date();
  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [availability, setAvail]  = useState({}); // { "YYYY-MM-DD": true|false }
  const [bookings, setBookings]   = useState([]);
  const [saving, setSaving]       = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const token = localStorage.getItem('artsync_token');

  useEffect(() => { fetchAvailability(); fetchBookings(); }, []);

  const fetchAvailability = async () => {
    try {
      const res  = await fetch('http://localhost:3001/api/artist/availability', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const map = {};
      data.forEach(r => { map[r.date] = r.available; });
      setAvail(map);
    } catch (err) { console.error(err); }
  };

  // SCRUM-36: get accepted bookings for agenda
  const fetchBookings = async () => {
    try {
      const res  = await fetch('http://localhost:3001/api/artist/bookings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(data.filter(b => b.status === 'ACCEPTED' || b.status === 'COMPLETED'));
    } catch (err) { console.error(err); }
  };

  // SCRUM-34: toggle availability for a day
  const toggleDay = async (dateStr) => {
    const current  = availability[dateStr];
    const newValue = current === undefined ? false : !current; // undefined = available by default → click = mark unavailable
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3001/api/artist/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: dateStr, available: newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvail(prev => ({ ...prev, [dateStr]: newValue }));
      setFeedback({ type: 'success', text: `${dateStr}: marcado como ${newValue ? 'disponible' : 'no disponible'}.` });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally { setSaving(false); }
  };

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const bookingsByDate = {};
  bookings.forEach(b => {
    if (b.eventDate) {
      const d = b.eventDate.split('T')[0];
      if (!bookingsByDate[d]) bookingsByDate[d] = [];
      bookingsByDate[d].push(b);
    }
  });

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mi Agenda</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Gestioná tu disponibilidad y mirá los eventos confirmados.
      </p>

      {feedback && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.9rem', backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#22c55e' : '#ef4444' }}>
          {feedback.text}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
        {[
          { color: 'rgba(34,197,94,0.2)', border: '2px solid #22c55e', label: 'Disponible (por defecto)' },
          { color: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', label: 'No disponible' },
          { color: 'rgba(129,140,248,0.3)', border: '2px solid #818cf8', label: 'Evento confirmado' },
          { color: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.3)', label: 'Hoy' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: color, border }} />
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={prevMonth} className="btn" style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600' }}>{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="btn" style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.4rem 0', fontWeight: '600' }}>{d}</div>)}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1;
            const dateStr = toDateStr(year, month, day);
            const avail   = availability[dateStr];          // undefined = default available
            const hasEvent = bookingsByDate[dateStr]?.length > 0;
            const isToday  = dateStr === todayStr;
            const isPast   = dateStr < todayStr;

            let bg     = 'rgba(34,197,94,0.1)';
            let border = '1px solid rgba(34,197,94,0.3)';
            let color  = '#22c55e';

            if (hasEvent) {
              bg = 'rgba(129,140,248,0.2)'; border = '1px solid #818cf8'; color = '#818cf8';
            } else if (avail === false) {
              bg = 'rgba(239,68,68,0.15)'; border = '1px solid rgba(239,68,68,0.4)'; color = '#ef4444';
            } else if (isPast) {
              bg = 'rgba(255,255,255,0.03)'; border = '1px solid rgba(255,255,255,0.06)'; color = 'var(--text-secondary)';
            }

            if (isToday) border = '2px solid rgba(255,255,255,0.4)';

            return (
              <button
                key={day}
                onClick={() => !isPast && !hasEvent && toggleDay(dateStr)}
                disabled={saving || isPast || hasEvent}
                title={hasEvent ? `${bookingsByDate[dateStr].length} evento(s) confirmado(s)` : isPast ? 'Fecha pasada' : avail === false ? 'No disponible — click para disponible' : 'Disponible — click para bloquear'}
                style={{
                  padding: '0.5rem 0', textAlign: 'center', borderRadius: '6px',
                  background: bg, border, color,
                  fontSize: '0.9rem', fontWeight: isToday ? '700' : '400',
                  cursor: isPast || hasEvent ? 'default' : 'pointer',
                  transition: 'all 0.15s', opacity: isPast ? 0.4 : 1,
                  position: 'relative',
                }}
              >
                {day}
                {hasEvent && (
                  <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', display: 'block' }} />
                )}
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Hacé clic en un día para alternar su disponibilidad. Los días con eventos no se pueden modificar.
        </p>
      </div>

      {/* SCRUM-36: Upcoming confirmed events */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={22} style={{ color: '#818cf8' }} /> Eventos Confirmados
      </h2>
      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No tenés eventos confirmados aún. Cuando aceptes solicitudes aparecerán acá.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(b => (
            <div key={b.id} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `3px solid ${b.status === 'COMPLETED' ? '#818cf8' : '#22c55e'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{b.client?.user?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.client?.user?.email}</div>
                  </div>
                </div>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', color: b.status === 'COMPLETED' ? '#818cf8' : '#22c55e', background: b.status === 'COMPLETED' ? 'rgba(129,140,248,0.12)' : 'rgba(34,197,94,0.12)' }}>
                  {b.status === 'COMPLETED' ? 'Completado' : 'Confirmado'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {b.service && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={14} style={{ color: 'var(--accent-primary)' }} />{b.service.name}</span>}
                {b.eventDate && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} style={{ color: 'var(--accent-primary)' }} />{new Date(b.eventDate).toLocaleDateString('es-CR')}</span>}
              </div>
              {b.message && <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{b.message}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
