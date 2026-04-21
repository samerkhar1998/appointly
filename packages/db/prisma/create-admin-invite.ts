/**
 * Creates an AdminInvite and prints the registration URL.
 *
 * First-time setup (no admin exists yet):
 *   npx tsx prisma/create-admin-invite.ts --bootstrap
 *
 * After first admin exists, generate more invites by passing their email:
 *   npx tsx prisma/create-admin-invite.ts admin@example.com
 */

import { PrismaClient } from '../src/generated/client';

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const arg = args[0];

  if (!arg) {
    console.error('Usage:');
    console.error('  First time:  npx tsx prisma/create-admin-invite.ts --bootstrap');
    console.error('  After that:  npx tsx prisma/create-admin-invite.ts <admin-email>');
    process.exit(1);
  }

  let creatorId: string;

  if (arg === '--bootstrap') {
    // Bootstrap: create a temporary system user to own the first invite
    const existing = await db.user.findFirst({ where: { global_role: 'SUPER_ADMIN' } });
    if (existing) {
      creatorId = existing.id;
      console.log(`Using existing admin: ${existing.email}`);
    } else {
      const systemUser = await db.user.upsert({
        where: { email: 'system@appointly.internal' },
        update: {},
        create: {
          email: 'system@appointly.internal',
          name: 'System',
          password_hash: 'bootstrap',
          global_role: 'SUPER_ADMIN',
        },
      });
      creatorId = systemUser.id;
      console.log('Created bootstrap system user.');
    }
  } else {
    // Look up by email
    const creator = await db.user.findUnique({ where: { email: arg } });
    if (!creator) {
      console.error(`Error: No user found with email "${arg}"`);
      process.exit(1);
    }
    if (creator.global_role !== 'SUPER_ADMIN') {
      console.error(`Error: "${arg}" is not a SUPER_ADMIN (role: ${creator.global_role})`);
      process.exit(1);
    }
    creatorId = creator.id;
  }

  const invite = await db.adminInvite.create({
    data: { created_by: creatorId },
  });

  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const url = `${baseUrl}/admin/register?token=${invite.token}`;

  console.log('');
  console.log('✅ Admin invite created!');
  console.log('');
  console.log('Open this URL to register:');
  console.log(url);
  console.log('');
  console.log('Single-use — expires after registration.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => { void db.$disconnect(); });
