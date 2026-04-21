/**
 * Usage: npx tsx prisma/create-admin-invite.ts <creator-user-id>
 *
 * Creates an AdminInvite record and prints the registration URL.
 * The creator-user-id must belong to an existing SUPER_ADMIN user.
 * If no user exists yet, pass --bootstrap to create the first invite
 * using a special seed admin user (only works on an empty admin table).
 *
 * Example:
 *   npx tsx prisma/create-admin-invite.ts cm1abc123
 */

import { PrismaClient } from '../src/generated/client';

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const creatorId = args[0];

  if (!creatorId) {
    console.error('Usage: npx tsx prisma/create-admin-invite.ts <creator-user-id>');
    console.error('');
    console.error('You can find the creator user ID in the database, or use --first-admin');
    console.error('to create the first invite via an interactive prompt.');
    process.exit(1);
  }

  // Verify creator exists and is SUPER_ADMIN
  const creator = await db.user.findUnique({ where: { id: creatorId } });

  if (!creator) {
    console.error(`Error: No user found with id "${creatorId}"`);
    process.exit(1);
  }

  if (creator.global_role !== 'SUPER_ADMIN') {
    console.error(`Error: User "${creator.email}" is not a SUPER_ADMIN (role: ${creator.global_role})`);
    process.exit(1);
  }

  const invite = await db.adminInvite.create({
    data: { created_by: creatorId },
  });

  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const url = `${baseUrl}/admin/register?token=${invite.token}`;

  console.log('');
  console.log('✅ Admin invite created successfully!');
  console.log('');
  console.log('Registration URL:');
  console.log(url);
  console.log('');
  console.log('This link is single-use and will expire after registration.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => { void db.$disconnect(); });
