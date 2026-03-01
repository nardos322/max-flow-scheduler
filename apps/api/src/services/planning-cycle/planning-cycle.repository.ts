import type { PlanningCycle, PlanningCycleRun } from '@scheduler/domain';
import { getPrismaClient } from '../../lib/prisma.js';

function toDbCycleStatus(status: PlanningCycle['status']): 'draft' {
  return status;
}

function toDomainCycleStatus(status: string): PlanningCycle['status'] {
  return status === 'draft' ? 'draft' : 'draft';
}

function toDbCycleRunStatus(status: PlanningCycleRun['status']): 'succeeded' | 'partial_failed' | 'failed' {
  if (status === 'partial-failed') {
    return 'partial_failed';
  }
  return status;
}

function toDomainCycleRunStatus(status: string): PlanningCycleRun['status'] {
  if (status === 'partial_failed') {
    return 'partial-failed';
  }
  if (status === 'failed') {
    return 'failed';
  }
  return 'succeeded';
}

function buildCycleSprintRowId(cycleId: string, sprintId: string): string {
  return `${cycleId}::${sprintId}`;
}

function buildCycleRunItemRowId(runId: string, sprintId: string, index: number): string {
  return `${runId}::${sprintId}::${index}`;
}

async function savePlanningCyclePrisma(cycle: PlanningCycle): Promise<PlanningCycle> {
  const prisma = (await getPrismaClient()) as unknown as {
    $transaction: <T>(fn: (tx: {
      planningCycle: {
        upsert: (args: Record<string, unknown>) => Promise<unknown>;
      };
      planningCycleSprint: {
        deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
    }) => Promise<T>) => Promise<T>;
  };

  await prisma.$transaction(async (tx) => {
    await tx.planningCycle.upsert({
      where: { id: cycle.id },
      update: {
        name: cycle.name,
        status: toDbCycleStatus(cycle.status),
        updatedAt: new Date(cycle.updatedAt),
      },
      create: {
        id: cycle.id,
        name: cycle.name,
        status: toDbCycleStatus(cycle.status),
        createdAt: new Date(cycle.createdAt),
        updatedAt: new Date(cycle.updatedAt),
      },
    });

    await tx.planningCycleSprint.deleteMany({ where: { cycleId: cycle.id } });
    if (cycle.sprintIds.length > 0) {
      await tx.planningCycleSprint.createMany({
        data: cycle.sprintIds.map((sprintId, index) => ({
          id: buildCycleSprintRowId(cycle.id, sprintId),
          cycleId: cycle.id,
          sprintId,
          orderIndex: index + 1,
          createdAt: new Date(cycle.createdAt),
          updatedAt: new Date(cycle.updatedAt),
        })),
      });
    }
  });

  return cycle;
}

type PrismaCycleRecord = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sprints: Array<{
    sprintId: string;
    orderIndex: number;
  }>;
};

function mapPrismaCycleRecordToDomain(record: PrismaCycleRecord): PlanningCycle {
  return {
    id: record.id,
    name: record.name,
    status: toDomainCycleStatus(record.status),
    sprintIds: record.sprints.sort((a, b) => a.orderIndex - b.orderIndex).map((entry) => entry.sprintId),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getPlanningCycleByIdPrisma(cycleId: string): Promise<PlanningCycle | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    planningCycle: {
      findUnique: (args: Record<string, unknown>) => Promise<PrismaCycleRecord | null>;
    };
  };

  const record = await prisma.planningCycle.findUnique({
    where: { id: cycleId },
    include: {
      sprints: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!record) {
    return null;
  }

  return mapPrismaCycleRecordToDomain(record);
}

export type PlanningCyclePageOptions = {
  limit: number;
  cursor?: string;
};

export type PlanningCyclePageResult = {
  items: PlanningCycle[];
  nextCursor?: string;
};

async function listPlanningCyclesPagePrisma(options: PlanningCyclePageOptions): Promise<PlanningCyclePageResult> {
  const prisma = (await getPrismaClient()) as unknown as {
    planningCycle: {
      findMany: (args: Record<string, unknown>) => Promise<PrismaCycleRecord[]>;
    };
  };

  const cursorDate = options.cursor ? new Date(options.cursor) : null;
  const records = await prisma.planningCycle.findMany({
    ...(cursorDate ? { where: { createdAt: { gt: cursorDate } } } : {}),
    take: options.limit + 1,
    orderBy: { createdAt: 'asc' },
    include: {
      sprints: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  const mapped = records.map(mapPrismaCycleRecordToDomain);
  const hasMore = mapped.length > options.limit;
  const items = hasMore ? mapped.slice(0, options.limit) : mapped;
  const nextCursor = hasMore ? items[items.length - 1]?.createdAt : undefined;

  return { items, ...(nextCursor ? { nextCursor } : {}) };
}

type PrismaCycleRunItemRecord = {
  sprintId: string;
  executedAt: Date;
  status: string;
  inputSnapshot: unknown | null;
  outputSnapshot: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
};

type PrismaCycleRunRecord = {
  id: string;
  cycleId: string;
  executedAt: Date;
  status: string;
  items: PrismaCycleRunItemRecord[];
};

function mapPrismaCycleRunRecordToDomain(record: PrismaCycleRunRecord): PlanningCycleRun {
  return {
    id: record.id,
    cycleId: record.cycleId,
    executedAt: record.executedAt.toISOString(),
    status: toDomainCycleRunStatus(record.status),
    items: record.items
      .sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime())
      .map((item) => ({
        sprintId: item.sprintId,
        executedAt: item.executedAt.toISOString(),
        status: item.status === 'failed' ? 'failed' : 'succeeded',
        ...(item.inputSnapshot ? { inputSnapshot: item.inputSnapshot as PlanningCycleRun['items'][number]['inputSnapshot'] } : {}),
        ...(item.outputSnapshot ? { outputSnapshot: item.outputSnapshot as PlanningCycleRun['items'][number]['outputSnapshot'] } : {}),
        ...(item.errorCode && item.errorMessage
          ? {
              error: {
                code: item.errorCode,
                message: item.errorMessage,
              },
            }
          : {}),
      })),
  };
}

async function appendPlanningCycleRunPrisma(run: PlanningCycleRun): Promise<PlanningCycleRun> {
  const prisma = (await getPrismaClient()) as unknown as {
    $transaction: <T>(fn: (tx: {
      planningCycleRun: {
        create: (args: Record<string, unknown>) => Promise<unknown>;
      };
      planningCycleRunItem: {
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
    }) => Promise<T>) => Promise<T>;
  };

  await prisma.$transaction(async (tx) => {
    await tx.planningCycleRun.create({
      data: {
        id: run.id,
        cycleId: run.cycleId,
        executedAt: new Date(run.executedAt),
        status: toDbCycleRunStatus(run.status),
      },
    });

    if (run.items.length > 0) {
      await tx.planningCycleRunItem.createMany({
        data: run.items.map((item, index) => ({
          id: buildCycleRunItemRowId(run.id, item.sprintId, index),
          runId: run.id,
          sprintId: item.sprintId,
          executedAt: new Date(item.executedAt),
          status: item.status,
          inputSnapshot: item.inputSnapshot ?? null,
          outputSnapshot: item.outputSnapshot ?? null,
          errorCode: item.error?.code ?? null,
          errorMessage: item.error?.message ?? null,
        })),
      });
    }
  });

  return run;
}

export type PlanningCycleRunPageOptions = {
  limit: number;
  cursor?: string;
};

export type PlanningCycleRunPageResult = {
  items: PlanningCycleRun[];
  nextCursor?: string;
};

async function listPlanningCycleRunsPagePrisma(
  cycleId: string,
  options: PlanningCycleRunPageOptions,
): Promise<PlanningCycleRunPageResult> {
  const prisma = (await getPrismaClient()) as unknown as {
    planningCycleRun: {
      findMany: (args: Record<string, unknown>) => Promise<PrismaCycleRunRecord[]>;
    };
  };

  const cursorDate = options.cursor ? new Date(options.cursor) : null;
  const rows = await prisma.planningCycleRun.findMany({
    where: {
      cycleId,
      ...(cursorDate ? { executedAt: { gt: cursorDate } } : {}),
    },
    take: options.limit + 1,
    orderBy: { executedAt: 'asc' },
    include: {
      items: true,
    },
  });

  const mapped = rows.map(mapPrismaCycleRunRecordToDomain);
  const hasMore = mapped.length > options.limit;
  const items = hasMore ? mapped.slice(0, options.limit) : mapped;
  const nextCursor = hasMore ? items[items.length - 1]?.executedAt : undefined;

  return { items, ...(nextCursor ? { nextCursor } : {}) };
}

async function clearPlanningCycleStorePrisma(): Promise<void> {
  const prisma = (await getPrismaClient()) as unknown as {
    planningCycleRunItem: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    planningCycleRun: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    planningCycleSprint: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    planningCycle: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
  };

  await prisma.planningCycleRunItem.deleteMany({});
  await prisma.planningCycleRun.deleteMany({});
  await prisma.planningCycleSprint.deleteMany({});
  await prisma.planningCycle.deleteMany({});
}

export async function savePlanningCycle(cycle: PlanningCycle): Promise<PlanningCycle> {
  return savePlanningCyclePrisma(cycle);
}

export async function getPlanningCycleById(cycleId: string): Promise<PlanningCycle | null> {
  return getPlanningCycleByIdPrisma(cycleId);
}

export async function listPlanningCyclesPage(options: PlanningCyclePageOptions): Promise<PlanningCyclePageResult> {
  return listPlanningCyclesPagePrisma(options);
}

export async function appendPlanningCycleRun(run: PlanningCycleRun): Promise<PlanningCycleRun> {
  return appendPlanningCycleRunPrisma(run);
}

export async function listPlanningCycleRunsPage(
  cycleId: string,
  options: PlanningCycleRunPageOptions,
): Promise<PlanningCycleRunPageResult> {
  return listPlanningCycleRunsPagePrisma(cycleId, options);
}

export async function clearPlanningCycleStore(): Promise<void> {
  await clearPlanningCycleStorePrisma();
}
