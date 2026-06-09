import { useState } from 'react';
import { UserPlus, Mail, Lock, Briefcase, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterArtist() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    category: '',
    portfolio: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Músico / Banda',
    'Bailarín / Grupo de Baile',
    'Humorista / Stand Up',
    'Pintor / Artista Plástico',
    'Escultor',
    'Malabarista / Circo',
    'Actor / Actriz',
    'Otro'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    
    // Basic frontend validation
    if (formData.password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/artists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || 'Ocurrió un error al registrar el artista.' });
      } else {
        setStatus({ type: 'success', message: data.message || 'Registro exitoso.' });
        setFormData({ name: '', email: '', password: '', category: '', portfolio: '' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'No se pudo conectar con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Registro de Artista</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Completa tus datos para ofrecer tus servicios</p>
        </div>

        {status.message && (
          <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre Completo / Nombre Artístico</label>
            <div style={{ position: 'relative' }}>
              <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                id="name" 
                name="name" 
                className="form-control w-full" 
                style={{ paddingLeft: '2.5rem' }} 
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej. Juan Pérez o Banda Los Gatos"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="form-control w-full" 
                style={{ paddingLeft: '2.5rem' }} 
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                id="password" 
                name="password" 
                className="form-control w-full" 
                style={{ paddingLeft: '2.5rem' }} 
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría Artística</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <select 
                id="category" 
                name="category" 
                className="form-control w-full" 
                style={{ paddingLeft: '2.5rem', appearance: 'none' }} 
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="portfolio">Enlace al Portafolio (Opcional)</label>
            <div style={{ position: 'relative' }}>
              <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="url" 
                id="portfolio" 
                name="portfolio" 
                className="form-control w-full" 
                style={{ paddingLeft: '2.5rem' }} 
                value={formData.portfolio}
                onChange={handleChange}
                placeholder="https://tu-portafolio.com"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta de Artista'}
          </button>
        </form>
      </div>
    </div>
  );
}
