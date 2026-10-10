import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma.js';

async function seed() {
  console.log('🌱 Starting CineVerse database seed...');

  // 1. Roles and Permissions
  const permissions = [
    { role: 'CUSTOMER', permission: 'VIEW_MOVIES' },
    { role: 'CUSTOMER', permission: 'BOOK_TICKETS' },
    { role: 'CUSTOMER', permission: 'VIEW_OWN_BOOKINGS' },
    { role: 'CUSTOMER', permission: 'CANCEL_OWN_BOOKING' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_THEATRE' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_SCREEN' },
    { role: 'THEATRE_MANAGER', permission: 'MANAGE_SEATS' },
    { role: 'THEATRE_MANAGER', permission: 'CREATE_SHOW' },
    { role: 'THEATRE_MANAGER', permission: 'VIEW_THEATRE_ANALYTICS' },
    { role: 'THEATRE_MANAGER', permission: 'BOOK_TICKETS' },
    { role: 'THEATRE_STAFF', permission: 'SCAN_TICKET' },
    { role: 'THEATRE_STAFF', permission: 'VIEW_TODAY_SHOWS' },
    { role: 'THEATRE_STAFF', permission: 'VIEW_MOVIES' },
    { role: 'SUPER_ADMIN', permission: 'CREATE_MOVIE' },
    { role: 'SUPER_ADMIN', permission: 'MANAGE_USERS' },
    { role: 'SUPER_ADMIN', permission: 'APPROVE_THEATRE' },
    { role: 'SUPER_ADMIN', permission: 'GLOBAL_OVERRIDE' },
  ];

  console.log('🔒 Seeding roles & permissions...');
  for (const item of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role: item.role,
          permission: item.permission,
        },
      },
      update: {},
      create: {
        role: item.role,
        permission: item.permission,
      },
    });
  }

  // 2. Theatres
  console.log('🏛️ Seeding theatres...');
  const theatresData = [
    {
      name: 'IMAX Pavilion Elite KL',
      legalEntityName: 'Pavilion Cineplex Sdn Bhd',
      addressLine: 'Level 8, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postalCode: '55100',
      status: 'ACTIVE',
      amenities: ['IMAX Laser', 'Dolby Atmos', 'VIP Lounge', 'Recliner Luxury', 'Valet Parking'],
    },
    {
      name: 'GSC Mid Valley Megamall',
      legalEntityName: 'Golden Screen Cinemas Sdn Bhd',
      addressLine: 'Level 4, Mid Valley Megamall, Lingkaran Syed Putra',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postalCode: '59200',
      status: 'ACTIVE',
      amenities: ['4DX Motion', 'Dolby Atmos', 'ScreenX 270', 'Popcorn Bar'],
    },
    {
      name: 'TGV Sunway Pyramid',
      legalEntityName: 'TGV Cinemas Sdn Bhd',
      addressLine: 'Level 1, Sunway Pyramid, No. 3, Jalan PJS 11/15',
      city: 'Petaling Jaya',
      state: 'Selangor',
      postalCode: '47500',
      status: 'ACTIVE',
      amenities: ['IMAX', 'INDULGE Lounge', 'Kids Hall', 'Dolby Surround 7.1'],
    },
    {
      name: 'Aurum Theatre The Gardens',
      legalEntityName: 'Aurum Experiences Sdn Bhd',
      addressLine: 'The Gardens Mall, Mid Valley City',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postalCode: '59200',
      status: 'ACTIVE',
      amenities: ['Private Cabins', 'Fine Dining In-Hall', 'Getha Recliners', 'Complimentary Champagne'],
    },
  ];

  const createdTheatres = [];
  for (const t of theatresData) {
    const existing = await prisma.theatre.findFirst({ where: { name: t.name } });
    if (existing) {
      createdTheatres.push(existing);
    } else {
      const created = await prisma.theatre.create({ data: t });
      createdTheatres.push(created);
    }
  }

  // 3. Default Users
  console.log('👤 Seeding default users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const usersData = [
    {
      fullName: 'Marcus Levin',
      email: 'customer@cinepass.com',
      mobileNumber: '+60123456789',
      role: 'CUSTOMER',
      passwordHash,
    },
    {
      fullName: 'Sarah Jenkins',
      email: 'manager@cinepass.com',
      mobileNumber: '+60123456790',
      role: 'THEATRE_MANAGER',
      theatreId: createdTheatres[0].id,
      passwordHash,
    },
    {
      fullName: 'Alex Tan',
      email: 'staff@cinepass.com',
      mobileNumber: '+60123456791',
      role: 'THEATRE_STAFF',
      theatreId: createdTheatres[0].id,
      passwordHash,
    },
    {
      fullName: 'Super Admin',
      email: 'admin@cinepass.com',
      mobileNumber: '+60123456792',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, fullName: u.fullName, passwordHash: u.passwordHash },
      create: u,
    });
  }

  // 4. Screens and Seats
  console.log('🪑 Seeding screens and tiered seats...');
  const mainTheatre = createdTheatres[0];
  let screen1 = await prisma.screen.findFirst({
    where: { theatreId: mainTheatre.id, screenNumber: 'Hall 1' },
  });

  if (!screen1) {
    screen1 = await prisma.screen.create({
      data: {
        theatreId: mainTheatre.id,
        screenNumber: 'Hall 1',
        name: 'IMAX Laser Hall 1',
        supportedFormats: ['IMAX', 'TWO_D', 'THREE_D'],
        soundSystem: 'Dolby Atmos 12-Channel',
        totalCapacity: 60,
        isActive: true,
      },
    });

    const seatCreates = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let rIdx = 0; rIdx < rowLabels.length; rIdx++) {
      const row = rowLabels[rIdx];
      const tier = rIdx < 2 ? 'NORMAL' : rIdx < 4 ? 'PREMIUM' : 'RECLINER';
      for (let c = 1; c <= 10; c++) {
        seatCreates.push({
          screenId: screen1.id,
          rowLabel: row,
          seatNumber: c,
          tier,
          gridX: c,
          gridY: rIdx + 1,
        });
      }
    }
    await prisma.seat.createMany({ data: seatCreates });
  }

  const allSeats = await prisma.seat.findMany({ where: { screenId: screen1.id } });

  // 5. Movies
  console.log('🎞️ Seeding movies...');
  const moviesList = [
    {
      title: 'The Batman',
      synopsis: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.',
      durationMinutes: 176,
      censorCertificate: '13+',
      originalLanguage: 'English',
      supportedLanguages: ['English', 'Malay', 'Mandarin'],
      genres: ['Action', 'Crime', 'Drama'],
      director: 'Matt Reeves',
      posterUrl: '/images/movies/the-batman.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
      releaseDate: new Date('2022-03-04'),
    },
    {
      title: 'Dune: Part Two',
      synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      durationMinutes: 166,
      censorCertificate: '13+',
      originalLanguage: 'English',
      supportedLanguages: ['English', 'Malay'],
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      director: 'Denis Villeneuve',
      posterUrl: '/images/movies/dune.jpg',
      releaseDate: new Date('2024-03-01'),
    },
    {
      title: 'Inception',
      synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      durationMinutes: 148,
      censorCertificate: '13+',
      originalLanguage: 'English',
      genres: ['Action', 'Sci-Fi', 'Thriller'],
      director: 'Christopher Nolan',
      posterUrl: '/images/movies/inception.jpg',
      releaseDate: new Date('2010-07-16'),
    },
    {
      title: 'Oppenheimer',
      synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      durationMinutes: 180,
      censorCertificate: '18+',
      originalLanguage: 'English',
      genres: ['Biography', 'Drama', 'History'],
      director: 'Christopher Nolan',
      posterUrl: '/images/movies/oppenheimer.jpg',
      releaseDate: new Date('2023-07-21'),
    },
  ];

  const createdMovies = [];
  for (const m of moviesList) {
    const existing = await prisma.movie.findFirst({ where: { title: m.title } });
    if (existing) {
      createdMovies.push(existing);
    } else {
      const created = await prisma.movie.create({ data: m });
      createdMovies.push(created);
    }
  }

  // 6. Shows and ShowSeatStatus
  console.log('⏰ Seeding shows and seat statuses...');
  const batman = createdMovies[0];
  const now = new Date();
  const times = [
    { startH: 11, startM: 30, endH: 14, endM: 30 },
    { startH: 14, startM: 45, endH: 17, endM: 45 },
    { startH: 18, startM: 30, endH: 21, endM: 30 },
    { startH: 21, startM: 45, endH: 0, endM: 45 },
  ];

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    for (const t of times) {
      const startTime = new Date(now);
      startTime.setDate(now.getDate() + dayOffset);
      startTime.setHours(t.startH, t.startM, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(t.endH + (t.endH < t.startH ? 24 : 0), t.endM, 0, 0);

      const existingShow = await prisma.show.findFirst({
        where: {
          theatreId: mainTheatre.id,
          screenId: screen1.id,
          movieId: batman.id,
          startTime,
        },
      });

      let show = existingShow;
      if (!show) {
        show = await prisma.show.create({
          data: {
            theatreId: mainTheatre.id,
            screenId: screen1.id,
            movieId: batman.id,
            startTime,
            endTime,
            visualFormat: 'IMAX',
            languageVersion: 'English ATMOS',
            baseTierPricing: {
              NORMAL: 3800,
              PREMIUM: 4500,
              RECLINER: 5500,
            },
          },
        });

        // Initialize seat statuses for this show
        const statuses = allSeats.map((seat) => {
          const isPreBooked = (seat.rowLabel === 'B' && (seat.seatNumber === 4 || seat.seatNumber === 5));
          return {
            showId: show.id,
            seatId: seat.id,
            status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
          };
        });

        await prisma.showSeatStatus.createMany({ data: statuses });
      }
    }
  }

  // 7. Coupons
  console.log('🏷️ Seeding coupons...');
  const coupons = [
    { code: 'CINEPASS20', discountPercentage: 20.0 },
    { code: 'WELCOME50', discountPercentage: 50.0 },
  ];

  for (const c of coupons) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (!existing) {
      await prisma.coupon.create({ data: c });
    }
  }

  console.log('✅ CineVerse database seeded successfully!');
  console.log('Credentials:');
  console.log('  Customer: customer@cinepass.com / Password123!');
  console.log('  Manager:  manager@cinepass.com / Password123!');
  console.log('  Staff:    staff@cinepass.com / Password123!');
  console.log('  Admin:    admin@cinepass.com / Password123!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
