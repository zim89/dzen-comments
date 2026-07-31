import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL ?? 'moderator@example.com';
const MODERATOR_PASSWORD = process.env.MODERATOR_PASSWORD ?? 'moderator123';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(MODERATOR_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: MODERATOR_EMAIL },
    update: { passwordHash, role: UserRole.MODERATOR },
    create: {
      email: MODERATOR_EMAIL,
      passwordHash,
      role: UserRole.MODERATOR,
    },
  });

  const existingComments = await prisma.comment.count();
  if (existingComments > 0) {
    console.log('Comments already seeded, skipping comment fixtures.');
    return;
  }

  const rootOne = await prisma.comment.create({
    data: {
      userName: 'alice',
      email: 'alice@example.com',
      homePage: 'https://example.com/alice',
      text: 'First root comment with <strong>allowed</strong> HTML.',
    },
  });

  const replyOne = await prisma.comment.create({
    data: {
      userName: 'bob',
      email: 'bob@example.com',
      text: 'Reply to the first comment.',
      parentId: rootOne.id,
    },
  });

  await prisma.comment.create({
    data: {
      userName: 'carol',
      email: 'carol@example.com',
      text: 'Nested reply to bob.',
      parentId: replyOne.id,
    },
  });

  await prisma.comment.create({
    data: {
      userName: 'dave',
      email: 'dave@example.com',
      text: 'Another reply on the first thread.',
      parentId: rootOne.id,
    },
  });

  await prisma.comment.create({
    data: {
      userName: 'eve',
      email: 'eve@example.com',
      homePage: 'https://example.com/eve',
      text: 'Second root comment for sorting and pagination tests.',
    },
  });

  await prisma.comment.create({
    data: {
      userName: 'frank',
      email: 'frank@example.com',
      text: 'Third root comment (LIFO default check).',
    },
  });

  console.log('Seed completed.');
  console.log(`Moderator: ${MODERATOR_EMAIL}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
