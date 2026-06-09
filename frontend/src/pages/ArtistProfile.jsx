import { useState, useEffect } from 'react';
import { User, Image as ImageIcon, MapPin, DollarSign, Briefcase, Plus, Trash2, AlertCircle, Save, List, Clock, ClipboardList } from 'lucide-react';

export default function ArtistProfile() {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    basePrice: '',
    location: '',
    portfolio: [],
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', duration: '', requirements: '' });
  const [isAddingService, setIsAddingService] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('artsync_token');
      const response = await fetch('http://localhost:3001/api/artist/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setFormData({
        description: data.description || '',
        category: data.category || '',
        basePrice: data.basePrice || '',
        location: data.location || '',
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
      });
      setServices(data.services || []);
    } catch (err) {
      setError(err.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePortfolioChange = (index, value) => {
    const newPortfolio = [...formData.portfolio];
    newPortfolio[index] = value;
    setFormData({ ...formData, portfolio: newPortfolio });
  };

  const addPortfolioItem = () => {
    if (formData.portfolio.length < 5) {
      setFormData({ ...formData, portfolio: [...formData.portfolio, ''] });
    }
  };

  const removePortfolioItem = (index) => {
    const newPortfolio = formData.portfolio.filter((_, i) => i !== index);
    setFormData({ ...formData, portfolio: newPortfolio });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('artsync_token');
      const response = await fetch('http://localhost:3001/api/artist/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newService)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setServices([data.service, ...services]);
      setNewService({ name: '', description: '', duration: '', requirements: '' });
      setIsAddingService(false);
      setMessage('Servicio añadido exitosamente');
    } catch (err) {
      setError(err.message || 'Error al añadir servicio');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      const token = localStorage.getItem('artsync_token');
      const response = await fetch(`http://localhost:3001/api/artist/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setServices(services.filter(s => s.id !== id));
      setMessage('Servicio eliminado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al eliminar servicio');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('artsync_token');
      // Filter out empty links
      const cleanPortfolio = formData.portfolio.filter(link => link.trim() !== '');

      const response = await fetch('http://localhost:3001/api/artist/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          portfolio: cleanPortfolio
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessage('Perfil guardado exitosamente');
      setFormData({ ...formData, portfolio: cleanPortfolio });
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando perfil...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User style={{ color: 'var(--accent-primary)' }} /> Mi Perfil de Artista
        </h2>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}
        
        {message && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Especialidad / Categoría</label>
            <div className="input-group">
              <Briefcase className="input-icon" size={20} />
              <input type="text" name="category" className="form-input" value={formData.category} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea 
              name="description" 
              className="form-input" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4" 
              placeholder="Cuéntanos sobre ti, tu experiencia y tu arte..."
              style={{ padding: '1rem', minHeight: '100px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Precio Base (Estimado)</label>
              <div className="input-group">
                <DollarSign className="input-icon" size={20} />
                <input type="number" name="basePrice" className="form-input" value={formData.basePrice} onChange={handleChange} placeholder="Ej: 50.00" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Zona Geográfica</label>
              <div className="input-group">
                <MapPin className="input-icon" size={20} />
                <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} placeholder="Ej: Ciudad de México" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
              <ImageIcon style={{ color: 'var(--accent-primary)' }} size={20} /> Portafolio (Máximo 5 enlaces)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.portfolio.map((link, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    className="form-input"
                    value={link}
                    onChange={(e) => handlePortfolioChange(index, e.target.value)}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={() => removePortfolioItem(index)} className="btn" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              
              {formData.portfolio.length < 5 && (
                <button type="button" onClick={addPortfolioItem} className="btn" style={{ border: '1px dashed rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} style={{ marginRight: '0.5rem' }} /> Añadir enlace ({formData.portfolio.length}/5)
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={saving}>
            <Save size={20} style={{ marginRight: '0.5rem' }} /> {saving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList style={{ color: 'var(--accent-primary)' }} /> Mis Servicios
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => setIsAddingService(!isAddingService)}
          >
            {isAddingService ? 'Cancelar' : <><Plus size={16} /> Añadir Servicio</>}
          </button>
        </h2>

        {isAddingService && (
          <form onSubmit={handleAddService} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre del Servicio *</label>
              <input type="text" className="form-input" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} required placeholder="Ej: Retrato a Lápiz" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <textarea className="form-input" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} required rows="2" placeholder="Detalles del servicio..."></textarea>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Duración Estimada</label>
                <div className="input-group">
                  <Clock className="input-icon" size={16} />
                  <input type="text" className="form-input" value={newService.duration} onChange={(e) => setNewService({...newService, duration: e.target.value})} placeholder="Ej: 3 días, 2 horas" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Requisitos Previos</label>
                <div className="input-group">
                  <List className="input-icon" size={16} />
                  <input type="text" className="form-input" value={newService.requirements} onChange={(e) => setNewService({...newService, requirements: e.target.value})} placeholder="Ej: Foto de referencia" />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              Guardar Servicio
            </button>
          </form>
        )}

        {services.length === 0 && !isAddingService ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No has añadido ningún servicio todavía.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {services.map(service => (
              <div key={service.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '1.5rem', position: 'relative' }}>
                <button 
                  onClick={() => handleDeleteService(service.id)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                  title="Eliminar servicio"
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                  <Trash2 size={18} />
                </button>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', paddingRight: '2rem' }}>{service.name}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>{service.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {service.duration && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: 'var(--accent-primary)' }} /> {service.duration}
                    </div>
                  )}
                  {service.requirements && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={16} style={{ color: 'var(--accent-primary)' }} /> {service.requirements}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
