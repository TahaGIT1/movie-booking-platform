import { prisma } from './src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'admin@cineverse.com';
  const passwordHash = await bcrypt.hash('Pass@123', 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'SUPER_ADMIN', fullName: 'Admin' },
    create: {
      email,
      fullName: 'Admin',
      passwordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin seeded: admin@cineverse.com / Pass@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
