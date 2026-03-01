import type { SprintRun } from '@scheduler/domain';
import { getPrismaClient } from '../../lib/prisma.js';

function mapDbRunStatus(status: SprintRun['status']): 'succeeded' | 'failed' {
  return status;
}

function mapDomainRunStatus(status: string): SprintRun['status'] {
  return status === 'failed' ? 'failed' : 'succeeded';
}

async function appendSprintRunPrisma(run: SprintRun): Promise<SprintRun> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintRun: {
      create: (args: Record<string, unknown>) => Promise<unknown>;
    };
  };

  await prisma.sprintRun.create({
    data: {
      id: run.id,
      sprintId: run.sprintId,
      executedAt: new Date(run.executedAt),
      status: mapDbRunStatus(run.status),
      inputSnapshot: run.inputSnapshot,
      outputSnapshot: run.outputSnapshot ?? null,
      errorCode: run.error?.code ?? null,
      errorMessage: run.error?.message ?? null,
    },
  });

  return run;
}

type PrismaRunRecord = {
  id: string;
  sprintId: string;
  executedAt: Date;
  status: string;
  inputSnapshot: unknown;
  outputSnapshot: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
};

function mapPrismaRunRecordToDomain(record: PrismaRunRecord): SprintRun {
  return {
    id: record.id,
    sprintId: record.sprintId,
    executedAt: record.executedAt.toISOString(),
    status: mapDomainRunStatus(record.status),
    inputSnapshot: record.inputSnapshot as SprintRun['inputSnapshot'],
    ...(record.outputSnapshot ? { outputSnapshot: record.outputSnapshot as SprintRun['outputSnapshot'] } : {}),
    ...(record.errorCode && record.errorMessage ? { error: { code: record.errorCode, message: record.errorMessage } } : {}),
  };
}

async function listSprintRunsPrisma(sprintId: string): Promise<SprintRun[]> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintRun: {
      findMany: (args: Record<string, unknown>) => Promise<PrismaRunRecord[]>;
    };
  };

  const rows = await prisma.sprintRun.findMany({
    where: { sprintId },
    orderBy: { executedAt: 'asc' },
  });

  return rows.map(mapPrismaRunRecordToDomain);
}

async function clearSprintRunStorePrisma(): Promise<void> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintRun: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
  };

  await prisma.sprintRun.deleteMany({});
}

export async function appendSprintRun(run: SprintRun): Promise<SprintRun> {
  return appendSprintRunPrisma(run);
}

export async function listSprintRuns(sprintId: string): Promise<SprintRun[]> {
  return listSprintRunsPrisma(sprintId);
}

export async function clearSprintRunStore(): Promise<void> {
  await clearSprintRunStorePrisma();
}
