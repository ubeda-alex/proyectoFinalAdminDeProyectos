import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('password123', saltRounds);

  const artistsData = [
    {
      name: 'Elena Rodríguez',
      email: 'elena.art@example.com',
      category: 'Pintura al Óleo',
      description: 'Artista visual especializada en retratos hiperrealistas al óleo con más de 10 años de experiencia.',
      basePrice: 150.00,
      location: 'Ciudad de México',
    },
    {
      name: 'Carlos Mendoza',
      email: 'carlos.m@example.com',
      category: 'Muralismo',
      description: 'Muralista urbano enfocado en arte contemporáneo y geometría espacial para interiores y exteriores.',
      basePrice: 500.00,
      location: 'Guadalajara',
    },
    {
      name: 'Sofía Valdés',
      email: 'sofia.ilustra@example.com',
      category: 'Ilustración Digital',
      description: 'Ilustradora freelance creando arte conceptual para videojuegos y portadas de libros de fantasía.',
      basePrice: 80.00,
      location: 'Monterrey',
    },
    {
      name: 'Javier Luna',
      email: 'javier.luna@example.com',
      category: 'Fotografía',
      description: 'Fotógrafo especializado en sesiones artísticas al aire libre, bodas y eventos culturales.',
      basePrice: 200.00,
      location: 'Cancún',
    },
    {
      name: 'Valeria Castro',
      email: 'valeria.ceramica@example.com',
      category: 'Cerámica y Escultura',
      description: 'Artesana y escultora que diseña piezas únicas en cerámica y arcilla para decoración moderna.',
      basePrice: 120.00,
      location: 'Querétaro',
    }
  ];

  for (const data of artistsData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'ARTIST',
          artistProfile: {
            create: {
              category: data.category,
              description: data.description,
              basePrice: data.basePrice,
              location: data.location,
              status: 'active'
            }
          }
        }
      });
      console.log(`Created artist: ${data.name}`);
    } else {
      console.log(`Artist already exists: ${data.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
