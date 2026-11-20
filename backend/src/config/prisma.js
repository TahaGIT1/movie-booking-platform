import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// MongoDB via Prisma (schema provider = "mongodb"). Atlas runs as a replica set,
// which Prisma requires for interactive $transaction calls.
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
