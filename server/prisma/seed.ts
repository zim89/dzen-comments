import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL ?? 'moderator@example.com';
const MODERATOR_PASSWORD = process.env.MODERATOR_PASSWORD ?? 'moderator123';

const ROOT_COMMENT_COUNT = 30;

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

  const now = Date.now();

  for (let i = 1; i <= ROOT_COMMENT_COUNT; i += 1) {
    const padded = String(i).padStart(2, '0');
    await prisma.comment.create({
      data: {
        userName: `user${padded}`,
        email: `user${padded}@example.com`,
        homePage: i % 3 === 0 ? `https://example.com/user${padded}` : null,
        text: `Seed root comment #${i} for pagination and sorting demo.`,
        createdAt: new Date(now - i * 60_000),
        updatedAt: new Date(now - i * 60_000),
      },
    });
  }

  const firstRoot = await prisma.comment.findFirst({
    where: { parentId: null },
    orderBy: { createdAt: 'desc' },
  });

  if (firstRoot) {
    const replyOne = await prisma.comment.create({
      data: {
        userName: 'bob',
        email: 'bob@example.com',
        text: 'Reply to the newest root comment (cascade demo).',
        parentId: firstRoot.id,
        createdAt: new Date(now - 30_000),
        updatedAt: new Date(now - 30_000),
      },
    });

    await prisma.comment.create({
      data: {
        userName: 'carol',
        email: 'carol@example.com',
        text: 'Nested reply to bob (second level).',
        parentId: replyOne.id,
        createdAt: new Date(now - 15_000),
        updatedAt: new Date(now - 15_000),
      },
    });

    await prisma.comment.create({
      data: {
        userName: 'dave',
        email: 'dave@example.com',
        text: 'Another reply on the first thread.',
        parentId: firstRoot.id,
        createdAt: new Date(now - 10_000),
        updatedAt: new Date(now - 10_000),
      },
    });
  }

  console.log(
    `Seed completed: ${ROOT_COMMENT_COUNT} root comments + nested replies.`,
  );
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
