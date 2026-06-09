import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Artist Registration Endpoint
app.post('/api/artists/register', async (req, res) => {
  const { name, email, password, category, portfolio } = req.body;

  if (!name || !email || !password || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, contraseña, categoría).' });
  }

  // Password basic validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    // Check if email already exists
    const existingArtist = await prisma.artist.findUnique({
      where: { email },
    });

    if (existingArtist) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the artist
    const newArtist = await prisma.artist.create({
      data: {
        name,
        email,
        passwordHash,
        category,
        portfolio,
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Artista registrado con éxito. Estado pendiente de aprobación.',
      artist: {
        id: newArtist.id,
        name: newArtist.name,
        email: newArtist.email,
        status: newArtist.status,
      },
    });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
