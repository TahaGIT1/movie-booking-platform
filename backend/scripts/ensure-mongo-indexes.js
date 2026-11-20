// Creates partial unique indexes that Prisma's schema language cannot express.
// MongoDB counts every null/missing value in a plain unique index as a duplicate, so
// optional-but-unique fields are only indexed when they actually hold a string.
// Run after `prisma db push` (npm run db:push does both).
import { prisma } from '../src/config/prisma.js';

const PARTIAL_UNIQUE_INDEXES = [
  { collection: 'theatres', field: 'gst_number' },
  { collection: 'users', field: 'mobile_number' },
  { collection: 'payments', field: 'gateway_transaction_id' },
];

async function dropLegacyIndex(collection, name) {
  try {
    await prisma.$runCommandRaw({ dropIndexes: collection, index: name });
    console.log(`  dropped legacy index ${collection}.${name}`);
  } catch (err) {
    const notFound = /index not found|ns not found|IndexNotFound|NamespaceNotFound/i.test(String(err?.message));
    if (!notFound) throw err;
  }
}

async function ensureIndexes() {
  for (const { collection, field } of PARTIAL_UNIQUE_INDEXES) {
    // Index name Prisma created when the field was still @unique.
    await dropLegacyIndex(collection, `${collection}_${field}_key`);

    await prisma.$runCommandRaw({
      createIndexes: collection,
      indexes: [
        {
          key: { [field]: 1 },
          name: `${collection}_${field}_unique_when_set`,
          unique: true,
          partialFilterExpression: { [field]: { $type: 'string' } },
        },
      ],
    });
    console.log(`  ensured ${collection}.${field} unique when set`);
  }
}

ensureIndexes()
  .then(() => console.log('MongoDB partial unique indexes are in place.'))
  .catch((err) => {
    console.error('Failed to ensure MongoDB indexes:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
