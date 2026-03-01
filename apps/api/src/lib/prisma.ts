export type PrismaClientLike = {
  $disconnect: () => Promise<void>;
};

const globalForPrisma = globalThis as { prisma?: PrismaClientLike };

export async function getPrismaClient(): Promise<PrismaClientLike> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const moduleRef = (await import('@prisma/client')) as {
    PrismaClient?: new (options: unknown) => PrismaClientLike;
  };
  const adapterModule = (await import('@prisma/adapter-libsql')) as {
    PrismaLibSql?: new (config: { url: string }) => unknown;
  };

  if (!moduleRef.PrismaClient || !adapterModule.PrismaLibSql) {
    throw new Error('Prisma client is not generated. Run `pnpm --filter @scheduler/api run db:generate`.');
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const adapter = new adapterModule.PrismaLibSql({ url: databaseUrl });
  const client = new moduleRef.PrismaClient({ adapter } as never);

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}
