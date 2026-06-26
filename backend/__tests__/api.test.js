// SCRUM-39: Suite de pruebas unitarias — no requieren servidor corriendo
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock de Prisma ────────────────────────────────────────────────────────────
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    artist: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    availability: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

// ── Mock de bcrypt ────────────────────────────────────────────────────────────
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_123'),
    compare: vi.fn(),
  }
}));

// ── Mock de jsonwebtoken ──────────────────────────────────────────────────────
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_jwt_token_123'),
    verify: vi.fn(),
  }
}));

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ── Helpers que replican la lógica del server ─────────────────────────────────
async function registerUser({ name, email, password, role, category }) {
  if (!name || !email || !password || !role)
    return { status: 400, body: { error: 'Faltan campos obligatorios.' } };
  if (password.length < 8)
    return { status: 400, body: { error: 'La contraseña debe tener al menos 8 caracteres.' } };
  if (role !== 'CLIENT' && role !== 'ARTIST')
    return { status: 400, body: { error: 'Rol inválido.' } };
  if (role === 'ARTIST' && !category)
    return { status: 400, body: { error: 'La categoría es obligatoria para artistas.' } };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return { status: 409, body: { error: 'Este correo ya está registrado.' } };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async () => ({ id: 'uuid-123', name, email, passwordHash, role }));
  const token = jwt.sign({ userId: user.id, role, email }, 'secret', { expiresIn: '24h' });
  return { status: 201, body: { token, user: { id: user.id, name, email, role } } };
}

async function loginUser({ email, password }) {
  if (!email || !password)
    return { status: 400, body: { error: 'Faltan campos obligatorios.' } };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 401, body: { error: 'Credenciales inválidas.' } };

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return { status: 401, body: { error: 'Credenciales inválidas.' } };

  const token = jwt.sign({ userId: user.id, role: user.role, email }, 'secret', { expiresIn: '24h' });
  return { status: 200, body: { token, user: { id: user.id, name: user.name, email, role: user.role } } };
}

async function getArtists({ category, location, available } = {}) {
  const where = {};
  if (category && category !== 'all') where.category = category;
  if (location && location !== 'all') where.location = location;
  if (available === 'true') where.status = 'active';
  const artists = await prisma.artist.findMany({ where });
  return { status: 200, body: artists };
}

function verifyToken(token) {
  if (!token) return { status: 401, body: { error: 'Acceso denegado. No hay token.' } };
  try {
    return { status: 200, user: jwt.verify(token, 'secret') };
  } catch {
    return { status: 403, body: { error: 'Token inválido o expirado.' } };
  }
}

async function createBooking({ clientUserId, artistId, message }) {
  if (!artistId) return { status: 400, body: { error: 'El ID del artista es obligatorio.' } };
  const client = await prisma.client.findUnique({ where: { userId: clientUserId } });
  if (!client) return { status: 404, body: { error: 'Perfil de cliente no encontrado.' } };
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) return { status: 404, body: { error: 'Artista no encontrado.' } };
  const booking = await prisma.booking.create({ data: { clientId: client.id, artistId, status: 'REQUESTED', message } });
  return { status: 201, body: { booking } };
}

async function updateBookingStatus({ artistUserId, bookingId, status }) {
  if (!['ACCEPTED', 'REJECTED'].includes(status))
    return { status: 400, body: { error: 'Estado inválido.' } };
  const artist = await prisma.artist.findUnique({ where: { userId: artistUserId } });
  if (!artist) return { status: 404, body: { error: 'Perfil no encontrado.' } };
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, artistId: artist.id } });
  if (!booking) return { status: 404, body: { error: 'Solicitud no encontrada.' } };
  if (booking.status !== 'REQUESTED') return { status: 400, body: { error: 'Solo se pueden gestionar solicitudes pendientes.' } };
  const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  return { status: 200, body: { booking: updated } };
}

// ═══════════════════════════════════════════════════════════════════
// SUITE DE PRUEBAS
// ═══════════════════════════════════════════════════════════════════

describe('ArtisLink — Suite de pruebas unitarias (SCRUM-39)', () => {

  beforeEach(() => { vi.clearAllMocks(); });

  // ── REGISTRO ─────────────────────────────────────────────────────

  describe('Registro de usuarios', () => {
    it('debería registrar un cliente exitosamente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue({ id: 'uuid-1', name: 'Test Cliente', email: 'c@test.com', role: 'CLIENT' });

      const res = await registerUser({ name: 'Test Cliente', email: 'c@test.com', password: 'test1234', role: 'CLIENT' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('CLIENT');
    });

    it('debería registrar un artista exitosamente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue({ id: 'uuid-2', name: 'Test Artista', email: 'a@test.com', role: 'ARTIST' });

      const res = await registerUser({ name: 'Test Artista', email: 'a@test.com', password: 'test1234', role: 'ARTIST', category: 'Música' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('ARTIST');
    });

    it('debería rechazar contraseña menor a 8 caracteres', async () => {
      const res = await registerUser({ name: 'Test', email: 'x@test.com', password: '123', role: 'CLIENT' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 caracteres');
    });

    it('debería rechazar email duplicado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });
      const res = await registerUser({ name: 'Dup', email: 'dup@test.com', password: 'test1234', role: 'CLIENT' });
      expect(res.status).toBe(409);
    });

    it('debería rechazar artista sin categoría', async () => {
      const res = await registerUser({ name: 'Sin Cat', email: 'sc@test.com', password: 'test1234', role: 'ARTIST' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('categoría');
    });

    it('debería rechazar rol inválido', async () => {
      const res = await registerUser({ name: 'Test', email: 'x@test.com', password: 'test1234', role: 'ADMIN' });
      expect(res.status).toBe(400);
    });
  });

  // ── LOGIN ────────────────────────────────────────────────────────

  describe('Autenticación', () => {
    it('debería autenticar con credenciales válidas y retornar JWT', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', name: 'Test', email: 'ok@test.com', passwordHash: 'hash', role: 'CLIENT' });
      bcrypt.compare.mockResolvedValue(true);

      const res = await loginUser({ email: 'ok@test.com', password: 'test1234' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'ok@test.com');
    });

    it('debería rechazar usuario inexistente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await loginUser({ email: 'noexiste@test.com', password: 'test1234' });
      expect(res.status).toBe(401);
    });

    it('debería rechazar contraseña incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'ok@test.com', passwordHash: 'hash', role: 'CLIENT' });
      bcrypt.compare.mockResolvedValue(false);
      const res = await loginUser({ email: 'ok@test.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('debería rechazar login sin campos obligatorios', async () => {
      const res = await loginUser({ email: '', password: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── CATÁLOGO ─────────────────────────────────────────────────────

  describe('Catálogo de artistas (SCRUM-27/28/29)', () => {
    it('debería retornar todos los artistas sin filtros', async () => {
      prisma.artist.findMany.mockResolvedValue([
        { id: '1', category: 'Música', status: 'active' },
        { id: '2', category: 'Danza', status: 'active' },
      ]);
      const res = await getArtists();
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('debería filtrar por categoría (SCRUM-27)', async () => {
      prisma.artist.findMany.mockResolvedValue([{ id: '1', category: 'Música', status: 'active' }]);
      const res = await getArtists({ category: 'Música' });
      expect(res.status).toBe(200);
      expect(prisma.artist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'Música' }) })
      );
    });

    it('debería filtrar solo artistas activos (SCRUM-29)', async () => {
      prisma.artist.findMany.mockResolvedValue([{ id: '1', category: 'Teatro', status: 'active' }]);
      const res = await getArtists({ available: 'true' });
      expect(res.status).toBe(200);
      expect(prisma.artist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'active' }) })
      );
    });

    it('debería retornar lista vacía si no hay artistas', async () => {
      prisma.artist.findMany.mockResolvedValue([]);
      const res = await getArtists({ category: 'Escultura' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  // ── AUTH MIDDLEWARE ───────────────────────────────────────────────

  describe('Protección de rutas con JWT', () => {
    it('debería retornar 401 sin token', () => {
      const res = verifyToken(null);
      expect(res.status).toBe(401);
    });

    it('debería retornar 403 con token inválido', () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });
      const res = verifyToken('token_invalido');
      expect(res.status).toBe(403);
    });

    it('debería aceptar token válido', () => {
      jwt.verify.mockReturnValue({ userId: 'uuid-1', role: 'CLIENT' });
      const res = verifyToken('token_valido');
      expect(res.status).toBe(200);
      expect(res.user).toHaveProperty('userId');
    });
  });

  // ── CONTRATACIÓN ─────────────────────────────────────────────────

  describe('Flujo de contratación (SCRUM-30/31/32)', () => {
    it('debería crear una solicitud de contrato (SCRUM-30)', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'client-1', userId: 'user-1' });
      prisma.artist.findUnique.mockResolvedValue({ id: 'artist-1' });
      prisma.booking.create.mockResolvedValue({ id: 'booking-1', status: 'REQUESTED', artistId: 'artist-1', clientId: 'client-1' });

      const res = await createBooking({ clientUserId: 'user-1', artistId: 'artist-1', message: 'Hola' });

      expect(res.status).toBe(201);
      expect(res.body.booking.status).toBe('REQUESTED');
    });

    it('debería rechazar contrato sin artistId', async () => {
      const res = await createBooking({ clientUserId: 'user-1', artistId: null, message: 'Test' });
      expect(res.status).toBe(400);
    });

    it('debería aceptar una solicitud pendiente (SCRUM-32)', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'artist-1', userId: 'user-artist-1' });
      prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1', status: 'REQUESTED', artistId: 'artist-1' });
      prisma.booking.update.mockResolvedValue({ id: 'booking-1', status: 'ACCEPTED' });

      const res = await updateBookingStatus({ artistUserId: 'user-artist-1', bookingId: 'booking-1', status: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('ACCEPTED');
    });

    it('debería rechazar una solicitud pendiente (SCRUM-32)', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'artist-1', userId: 'user-artist-1' });
      prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1', status: 'REQUESTED', artistId: 'artist-1' });
      prisma.booking.update.mockResolvedValue({ id: 'booking-1', status: 'REJECTED' });

      const res = await updateBookingStatus({ artistUserId: 'user-artist-1', bookingId: 'booking-1', status: 'REJECTED' });

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('REJECTED');
    });

    it('debería rechazar estado inválido en actualización', async () => {
      const res = await updateBookingStatus({ artistUserId: 'user-1', bookingId: 'b-1', status: 'PENDIENTE' });
      expect(res.status).toBe(400);
    });

    it('no debería permitir gestionar solicitudes ya procesadas', async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: 'artist-1', userId: 'user-artist-1' });
      prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1', status: 'ACCEPTED', artistId: 'artist-1' });

      const res = await updateBookingStatus({ artistUserId: 'user-artist-1', bookingId: 'booking-1', status: 'REJECTED' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('pendientes');
    });
  });

});
