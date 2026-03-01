import type {
  CreatePeriodRequest,
  PeriodCatalog,
  PeriodDemand,
  ReplacePeriodDemandsRequest,
  UpdatePeriodRequest,
} from '@scheduler/domain';
import { getPrismaClient } from '../../lib/prisma.js';

function createPeriodId(): string {
  return `per-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPeriodDemandId(periodId: string, dayId: string): string {
  return `${periodId}::${dayId}`;
}

type PeriodRow = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  createdAt: Date;
  updatedAt: Date;
  demands: Array<{
    dayId: string;
    requiredDoctors: number;
  }>;
};

function mapPeriod(row: PeriodRow): PeriodCatalog {
  return {
    id: row.id,
    name: row.name,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    demands: row.demands.map((item) => ({ dayId: item.dayId, requiredDoctors: item.requiredDoctors })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createPeriod(payload: CreatePeriodRequest): Promise<PeriodCatalog> {
  const prisma = (await getPrismaClient()) as unknown as {
    $transaction: <T>(fn: (tx: {
      period: {
        create: (args: Record<string, unknown>) => Promise<{
          id: string;
          name: string;
          startsOn: string;
          endsOn: string;
          createdAt: Date;
          updatedAt: Date;
        }>;
      };
      periodDemand: {
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
    }) => Promise<T>) => Promise<T>;
  };

  const periodId = createPeriodId();
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.period.create({
      data: {
        id: periodId,
        name: payload.name,
        startsOn: payload.startsOn,
        endsOn: payload.endsOn,
      },
    });

    if (payload.demands.length > 0) {
      await tx.periodDemand.createMany({
        data: payload.demands.map((demand) => ({
          id: createPeriodDemandId(periodId, demand.dayId),
          periodId,
          dayId: demand.dayId,
          requiredDoctors: demand.requiredDoctors,
        })),
      });
    }

    return created;
  });

  return {
    id: row.id,
    name: row.name,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    demands: [...payload.demands],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPeriods(): Promise<PeriodCatalog[]> {
  const prisma = (await getPrismaClient()) as unknown as {
    period: {
      findMany: (args: Record<string, unknown>) => Promise<PeriodRow[]>;
    };
  };

  const rows = await prisma.period.findMany({
    orderBy: { createdAt: 'asc' },
    include: { demands: { orderBy: { dayId: 'asc' } } },
  });

  return rows.map(mapPeriod);
}

export async function getPeriodById(periodId: string): Promise<PeriodCatalog | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    period: {
      findUnique: (args: Record<string, unknown>) => Promise<PeriodRow | null>;
    };
  };

  const row = await prisma.period.findUnique({
    where: { id: periodId },
    include: { demands: { orderBy: { dayId: 'asc' } } },
  });

  if (!row) {
    return null;
  }

  return mapPeriod(row);
}

export async function updatePeriod(periodId: string, payload: UpdatePeriodRequest): Promise<PeriodCatalog | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    period: {
      update: (args: Record<string, unknown>) => Promise<PeriodRow>;
    };
  };

  try {
    const row = await prisma.period.update({
      where: { id: periodId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.startsOn !== undefined ? { startsOn: payload.startsOn } : {}),
        ...(payload.endsOn !== undefined ? { endsOn: payload.endsOn } : {}),
      },
      include: { demands: { orderBy: { dayId: 'asc' } } },
    });

    return mapPeriod(row);
  } catch {
    return null;
  }
}

export async function replacePeriodDemands(
  periodId: string,
  payload: ReplacePeriodDemandsRequest,
): Promise<PeriodCatalog | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    $transaction: <T>(fn: (tx: {
      period: {
        findUnique: (args: Record<string, unknown>) => Promise<PeriodRow | null>;
      };
      periodDemand: {
        deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
    }) => Promise<T>) => Promise<T>;
  };

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.period.findUnique({
      where: { id: periodId },
      include: { demands: { orderBy: { dayId: 'asc' } } },
    });

    if (!existing) {
      return null;
    }

    await tx.periodDemand.deleteMany({ where: { periodId } });
    if (payload.demands.length > 0) {
      await tx.periodDemand.createMany({
        data: payload.demands.map((demand) => ({
          id: createPeriodDemandId(periodId, demand.dayId),
          periodId,
          dayId: demand.dayId,
          requiredDoctors: demand.requiredDoctors,
        })),
      });
    }

    return {
      ...existing,
      demands: payload.demands,
    };
  });

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    name: result.name,
    startsOn: result.startsOn,
    endsOn: result.endsOn,
    demands: result.demands.map((demand: PeriodDemand) => ({
      dayId: demand.dayId,
      requiredDoctors: demand.requiredDoctors,
    })),
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function deletePeriod(periodId: string): Promise<boolean> {
  const prisma = (await getPrismaClient()) as unknown as {
    period: {
      delete: (args: Record<string, unknown>) => Promise<unknown>;
    };
  };

  try {
    await prisma.period.delete({ where: { id: periodId } });
    return true;
  } catch {
    return false;
  }
}

export async function clearPeriodStore(): Promise<void> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintAvailability: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    sprint: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    periodDemand: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    period: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
  };

  await prisma.sprintAvailability.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.periodDemand.deleteMany({});
  await prisma.period.deleteMany({});
}
