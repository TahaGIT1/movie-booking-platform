import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles and Permissions
  const permissions = [
    // SUPER_ADMIN permissions
    { role: 'SUPER_ADMIN', permission: 'MANAGE_USERS' },
    { role: 'SUPER_ADMIN', permission: 'MANAGE_MOVIES' },
    { role: 'SUPER_ADMIN', permission: 'APPROVE_THEATRES' },
    { role: 'SUPER_ADMIN', permission: 'VIEW_AUDIT_LOGS' },
    
    // THEATRE_MANAGER permissions
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_THEATRE' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_SCREENS' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_SHOWS' },
    { role: 'THEATRE_MANAGER', permission: 'VIEW_REPORTS' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_STAFF' },
    
    // THEATRE_STAFF permissions
    { role: 'THEATRE_STAFF', permission: 'SCAN_TICKETS' },
    { role: 'THEATRE_STAFF', permission: 'VIEW_TODAYS_SHOWS' },
    
    // CUSTOMER permissions
    { role: 'CUSTOMER', permission: 'BOOK_TICKETS' },
    { role: 'CUSTOMER', permission: 'VIEW_BOOKINGS' },
    { role: 'CUSTOMER', permission: 'LEAVE_REVIEWS' },
  ];

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: perm.role,
          permission: perm.permission,
        }
      },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // 2. Seed a default SUPER_ADMIN user
  const adminEmail = 'admin@cineverse.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Super Admin',
        mobileNumber: '1234567890',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Default Super Admin seeded (admin@cineverse.com / Admin@123).');
  } else {
    console.log('Super Admin already exists.');
  }

  // 3. Seed some basic movies for testing P0-006 (Movie CRUD)
  const movies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      durationMins: 148,
      language: 'English',
      genre: 'Sci-Fi',
      releaseDate: new Date('2010-07-16'),
      baseFormat: '2D',
      posterUrl: 'https://example.com/inception.jpg',
      trailerUrl: 'https://youtube.com/inception',
    },
    {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
      durationMins: 166,
      language: 'English',
      genre: 'Sci-Fi',
      releaseDate: new Date('2024-03-01'),
      baseFormat: 'IMAX',
      posterUrl: 'https://example.com/dune2.jpg',
      trailerUrl: 'https://youtube.com/dune2',
    }
  ];

  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { title: movie.title },
      update: {},
      create: movie,
    });
  }
  console.log('Sample movies seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
