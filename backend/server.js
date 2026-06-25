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

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, category, portfolio } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  if (role !== 'CLIENT' && role !== 'ARTIST')
    return res.status(400).json({ error: 'Rol inválido.' });
  if (role === 'ARTIST' && !category)
    return res.status(400).json({ error: 'La categoría es obligatoria para artistas.' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Este correo ya está registrado.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, passwordHash, role } });
      if (role === 'CLIENT') await tx.client.create({ data: { userId: user.id } });
      else await tx.artist.create({ data: { userId: user.id, category, portfolio, status: 'pending' } });
      return user;
    });
    const token = jwt.sign({ userId: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'Registro exitoso.', token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' });
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Credenciales inválidas.' });
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Inicio de sesión exitoso.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
};

// ── ARTIST PROFILE ────────────────────────────────────────────────────────────

app.get('/api/artist/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const artist = await prisma.artist.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { name: true, email: true } }, services: { orderBy: { createdAt: 'desc' } } }
    });
    if (!artist) return res.status(404).json({ error: 'Perfil no encontrado.' });
    let portfolioArray = [];
    if (artist.portfolio) { try { portfolioArray = JSON.parse(artist.portfolio); } catch(e) {} }
    res.json({ ...artist, portfolio: portfolioArray });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

app.put('/api/artist/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  const { description, category, basePrice, location, portfolio } = req.body;
  let portfolioString = null;
  if (portfolio && Array.isArray(portfolio)) {
    if (portfolio.length > 5) return res.status(400).json({ error: 'Máximo 5 enlaces en el portafolio.' });
    portfolioString = JSON.stringify(portfolio);
  }
  try {
    await prisma.artist.update({
      where: { userId: req.user.userId },
      data: { description, category, basePrice: basePrice ? parseFloat(basePrice) : null, location, portfolio: portfolioString }
    });
    res.json({ message: 'Perfil actualizado con éxito.' });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// ── SERVICES ──────────────────────────────────────────────────────────────────

app.post('/api/artist/services', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  const { name, description, duration, requirements } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'Nombre y descripción son obligatorios.' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    if (!artist) return res.status(404).json({ error: 'Perfil no encontrado.' });
    const service = await prisma.service.create({ data: { artistId: artist.id, name, description, duration, requirements } });
    res.status(201).json({ message: 'Servicio creado.', service });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

app.delete('/api/artist/services/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    const service = await prisma.service.findFirst({ where: { id: req.params.id, artistId: artist.id } });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Servicio eliminado.' });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// ── PUBLIC CATALOG ────────────────────────────────────────────────────────────

app.get('/api/artists', async (req, res) => {
  const { category, location, available } = req.query;
  try {
    const where = {};
    if (category && category !== 'all') where.category = { contains: category };
    if (location && location !== 'all') where.location = { contains: location };
    if (available === 'true') where.status = 'active';
    const artists = await prisma.artist.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, services: true }
    });
    res.json(artists.map(a => {
      let portfolioArray = [];
      if (a.portfolio) { try { portfolioArray = JSON.parse(a.portfolio); } catch(e) {} }
      return { ...a, portfolio: portfolioArray };
    }));
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

app.get('/api/artists/:id', async (req, res) => {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } }, services: true }
    });
    if (!artist) return res.status(404).json({ error: 'Artista no encontrado.' });
    let portfolioArray = [];
    if (artist.portfolio) { try { portfolioArray = JSON.parse(artist.portfolio); } catch(e) {} }
    res.json({ ...artist, portfolio: portfolioArray });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// ── AVAILABILITY — SCRUM-34, SCRUM-35 ─────────────────────────────────────────

// SCRUM-34: Artist sets their availability
app.put('/api/artist/availability', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  const { date, available } = req.body;
  if (!date) return res.status(400).json({ error: 'La fecha es obligatoria (formato YYYY-MM-DD).' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    if (!artist) return res.status(404).json({ error: 'Perfil no encontrado.' });
    const record = await prisma.availability.upsert({
      where: { artistId_date: { artistId: artist.id, date } },
      update: { available: available !== false },
      create: { artistId: artist.id, date, available: available !== false }
    });
    res.json({ message: 'Disponibilidad actualizada.', availability: record });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-34: Artist gets their own availability
app.get('/api/artist/availability', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    const records = await prisma.availability.findMany({ where: { artistId: artist.id }, orderBy: { date: 'asc' } });
    res.json(records);
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-35: Public — client reads artist availability
app.get('/api/artists/:id/availability', async (req, res) => {
  try {
    const records = await prisma.availability.findMany({
      where: { artistId: req.params.id },
      orderBy: { date: 'asc' }
    });
    res.json(records);
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// ── BOOKINGS ──────────────────────────────────────────────────────────────────

app.post('/api/bookings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'CLIENT') return res.status(403).json({ error: 'Solo los clientes pueden enviar solicitudes.' });
  const { artistId, serviceId, eventDate, message } = req.body;
  if (!artistId) return res.status(400).json({ error: 'El ID del artista es obligatorio.' });
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } });
    if (!client) return res.status(404).json({ error: 'Perfil de cliente no encontrado.' });
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) return res.status(404).json({ error: 'Artista no encontrado.' });
    const booking = await prisma.booking.create({
      data: { clientId: client.id, artistId, serviceId: serviceId || null, status: 'REQUESTED', eventDate: eventDate ? new Date(eventDate) : null, message: message || null },
      include: { artist: { include: { user: { select: { name: true } } } }, service: true }
    });
    res.status(201).json({ message: 'Solicitud enviada con éxito.', booking });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-31: Artist sees received bookings
app.get('/api/artist/bookings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    const bookings = await prisma.booking.findMany({
      where: { artistId: artist.id },
      include: { client: { include: { user: { select: { name: true, email: true } } } }, service: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-32: Artist accepts or rejects
app.patch('/api/artist/bookings/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ARTIST') return res.status(403).json({ error: 'Acceso denegado.' });
  const { status, responseMessage } = req.body;
  if (!['ACCEPTED', 'REJECTED'].includes(status))
    return res.status(400).json({ error: 'Estado inválido.' });
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user.userId } });
    const booking = await prisma.booking.findFirst({ where: { id: req.params.id, artistId: artist.id } });
    if (!booking) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    if (booking.status !== 'REQUESTED') return res.status(400).json({ error: 'Solo se pueden gestionar solicitudes pendientes.' });
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status, responseMessage: responseMessage || null },
      include: { client: { include: { user: { select: { name: true, email: true } } } }, service: true }
    });
    res.json({ message: `Solicitud ${status === 'ACCEPTED' ? 'aceptada' : 'rechazada'}.`, booking: updated });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-33 + SCRUM-37: Client sees their bookings (history panel)
app.get('/api/client/bookings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'CLIENT') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } });
    const bookings = await prisma.booking.findMany({
      where: { clientId: client.id },
      include: { artist: { include: { user: { select: { name: true } } } }, service: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

// SCRUM-38: Client marks booking as COMPLETED
app.patch('/api/client/bookings/:id/complete', authenticateToken, async (req, res) => {
  if (req.user.role !== 'CLIENT') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } });
    const booking = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: client.id } });
    if (!booking) return res.status(404).json({ error: 'Contrato no encontrado.' });
    if (booking.status !== 'ACCEPTED') return res.status(400).json({ error: 'Solo se pueden completar contratos en estado Aceptado.' });
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { artist: { include: { user: { select: { name: true } } } }, service: true }
    });
    res.json({ message: 'Contrato marcado como completado.', booking: updated });
  } catch (error) { res.status(500).json({ error: 'Error interno.' }); }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
