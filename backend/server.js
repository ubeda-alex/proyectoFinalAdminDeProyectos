import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

app.use(cors());
app.use(express.json());

// Unified Registration Endpoint (Client and Artist)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, category, portfolio } = req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, contraseña, rol).' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  if (role !== 'CLIENT' && role !== 'ARTIST') {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  if (role === 'ARTIST' && !category) {
    return res.status(400).json({ error: 'La categoría es obligatoria para artistas.' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Use a transaction to create the User and their Profile
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create the base User
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      // 2. Create the specific profile
      if (role === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === 'ARTIST') {
        await tx.artist.create({
          data: {
            userId: user.id,
            category,
            portfolio,
            status: 'pending',
          },
        });
      }

      return user;
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registro exitoso.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Unified Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (email, contraseña).' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
};

// Get Artist Profile
app.get('/api/artist/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') {
    return res.status(403).json({ error: 'Solo los artistas pueden acceder a este perfil.' });
  }

  try {
    const artist = await prisma.artist.findUnique({
      where: { userId: req.user.userId },
      include: { 
        user: { select: { name: true, email: true } },
        services: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!artist) {
      return res.status(404).json({ error: 'Perfil de artista no encontrado.' });
    }

    // Parse JSON string back to array if exists
    let portfolioArray = [];
    if (artist.portfolio) {
      try { portfolioArray = JSON.parse(artist.portfolio); } catch(e) {}
    }
    
    res.json({ ...artist, portfolio: portfolioArray });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Update Artist Profile
app.put('/api/artist/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') {
    return res.status(403).json({ error: 'Solo los artistas pueden editar este perfil.' });
  }

  const { description, category, basePrice, location, portfolio } = req.body;

  // Validate portfolio limit
  let portfolioString = null;
  if (portfolio && Array.isArray(portfolio)) {
    if (portfolio.length > 5) {
      return res.status(400).json({ error: 'No puedes agregar más de 5 enlaces en el portafolio.' });
    }
    portfolioString = JSON.stringify(portfolio);
  } else if (portfolio === null) {
    portfolioString = null;
  }

  try {
    const updatedArtist = await prisma.artist.update({
      where: { userId: req.user.userId },
      data: {
        description,
        category,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        location,
        portfolio: portfolioString,
      },
    });

    res.json({ message: 'Perfil actualizado con éxito.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Create Service
app.post('/api/artist/services', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') {
    return res.status(403).json({ error: 'Solo los artistas pueden agregar servicios.' });
  }

  const { name, description, duration, requirements } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Nombre y descripción son obligatorios.' });
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    if (!artist) return res.status(404).json({ error: 'Perfil de artista no encontrado.' });

    const newService = await prisma.service.create({
      data: {
        artistId: artist.id,
        name,
        description,
        duration,
        requirements,
      },
    });

    res.status(201).json({ message: 'Servicio creado con éxito.', service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Delete Service
app.delete('/api/artist/services/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') {
    return res.status(403).json({ error: 'Solo los artistas pueden eliminar servicios.' });
  }

  const { id } = req.params;

  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    if (!artist) return res.status(404).json({ error: 'Perfil de artista no encontrado.' });

    // Validate that the service belongs to the artist
    const service = await prisma.service.findFirst({
      where: { id, artistId: artist.id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado o no autorizado.' });
    }

    await prisma.service.delete({ where: { id } });

    res.json({ message: 'Servicio eliminado con éxito.' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Get all artists (Public Catalog)
app.get('/api/artists', async (req, res) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { name: true, email: true } },
        services: true
      }
    });

    // Parse portfolio JSON if needed
    const mappedArtists = artists.map(artist => {
      let portfolioArray = [];
      if (artist.portfolio) {
        try { portfolioArray = JSON.parse(artist.portfolio); } catch(e) {}
      }
      return { ...artist, portfolio: portfolioArray };
    });

    res.json(mappedArtists);
  } catch (error) {
    console.error('Error fetching artists catalog:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Get specific artist (Public Profile)
app.get('/api/artists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        services: true
      }
    });

    if (!artist) {
      return res.status(404).json({ error: 'Artista no encontrado.' });
    }

    // Parse portfolio JSON if needed
    let portfolioArray = [];
    if (artist.portfolio) {
      try { portfolioArray = JSON.parse(artist.portfolio); } catch(e) {}
    }
    
    res.json({ ...artist, portfolio: portfolioArray });
  } catch (error) {
    console.error('Error fetching artist profile:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
