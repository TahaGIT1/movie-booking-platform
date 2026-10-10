import { prisma } from './src/config/prisma.js';
async function main() {
  await prisma.rolePermission.create({
    data: { role: 'SUPER_ADMIN', permission: 'GLOBAL_OVERRIDE' }
  }).catch(() => console.log('Already exists or error'));
  console.log('Added GLOBAL_OVERRIDE permission for SUPER_ADMIN');
}
main().catch(console.error).finally(() => prisma.$disconnect());
