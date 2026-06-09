import { useState, useEffect } from 'react';
import { User, Image as ImageIcon, MapPin, DollarSign, Briefcase, Plus, Trash2, AlertCircle, Save } from 'lucide-react';

export default function ArtistProfile() {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    basePrice: '',
    location: '',
    portfolio: [],
  });
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
    </div>
  );
}
