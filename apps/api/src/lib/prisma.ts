export type PrismaClientLike = {
  $disconnect: () => Promise<void>;
};

const globalForPrisma = globalThis as { prisma?: PrismaClientLike };

export async function getPrismaClient(): Promise<PrismaClientLike> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const moduleRef = (await import('@prisma/client')) as {
    PrismaClient?: new () => PrismaClientLike;
  };

  if (!moduleRef.PrismaClient) {
    throw new Error('Prisma client is not generated. Run `pnpm --filter @scheduler/api run db:generate`.');
  }

  const client = new moduleRef.PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}
