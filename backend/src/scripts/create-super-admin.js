import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';

const fullName = process.env.SUPER_ADMIN_NAME?.trim();
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;

try {
  if (!fullName || !email || !password || password.length < 12) {
    throw new Error('Set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD (at least 12 characters).');
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') throw new Error('That email already belongs to a non-admin account. Choose another email.');
    console.log(`Super Admin account already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { fullName, email, passwordHash, role: 'SUPER_ADMIN' } });
    console.log(`Super Admin account created: ${email}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
