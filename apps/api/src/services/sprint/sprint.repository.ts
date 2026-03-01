import { type Sprint } from '@scheduler/domain';
import { getPrismaClient } from '../../lib/prisma.js';

function toDbSprintStatus(status: Sprint['status']): 'draft' | 'ready_to_solve' | 'solved' {
  if (status === 'ready-to-solve') {
    return 'ready_to_solve';
  }
  return status;
}

function toDomainSprintStatus(status: string): Sprint['status'] {
  if (status === 'ready_to_solve') {
    return 'ready-to-solve';
  }
  if (status === 'solved') {
    return 'solved';
  }
  return 'draft';
}

function toDbAvailabilitySource(source: 'doctor-self-service' | 'planner-override'): 'doctor_self_service' | 'planner_override' {
  return source === 'doctor-self-service' ? 'doctor_self_service' : 'planner_override';
}

function toDomainAvailabilitySource(source: string): 'doctor-self-service' | 'planner-override' {
  return source === 'doctor_self_service' ? 'doctor-self-service' : 'planner-override';
}

function toDbUserRole(role: 'doctor' | 'planner'): 'doctor' | 'planner' {
  return role;
}

function buildDoctorRowId(sprintId: string, doctorId: string): string {
  return `${sprintId}::${doctorId}`;
}

function buildAvailabilityRowId(sprintId: string, doctorId: string, periodId: string, dayId: string): string {
  return `${sprintId}::${doctorId}::${periodId}::${dayId}`;
}

async function saveSprintPrisma(sprint: Sprint): Promise<Sprint> {
  const prisma = (await getPrismaClient()) as unknown as {
    $transaction: <T>(fn: (tx: {
      sprint: {
        upsert: (args: Record<string, unknown>) => Promise<unknown>;
      };
      sprintDoctor: {
        deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
      sprintAvailability: {
        deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
        createMany: (args: Record<string, unknown>) => Promise<unknown>;
      };
    }) => Promise<T>) => Promise<T>;
  };

  await prisma.$transaction(async (tx) => {
    await tx.sprint.upsert({
      where: { id: sprint.id },
      update: {
        name: sprint.name,
        periodId: sprint.periodId,
        status: toDbSprintStatus(sprint.status),
        requiredDoctorsPerShift: sprint.globalConfig.requiredDoctorsPerShift,
        maxDaysPerDoctorDefault: sprint.globalConfig.maxDaysPerDoctorDefault,
        updatedAt: new Date(sprint.updatedAt),
      },
      create: {
        id: sprint.id,
        name: sprint.name,
        periodId: sprint.periodId,
        status: toDbSprintStatus(sprint.status),
        requiredDoctorsPerShift: sprint.globalConfig.requiredDoctorsPerShift,
        maxDaysPerDoctorDefault: sprint.globalConfig.maxDaysPerDoctorDefault,
        createdAt: new Date(sprint.createdAt),
        updatedAt: new Date(sprint.updatedAt),
      },
    });

    await tx.sprintDoctor.deleteMany({ where: { sprintId: sprint.id } });
    if (sprint.doctorIds.length > 0) {
      await tx.sprintDoctor.createMany({
        data: sprint.doctorIds.map((doctorId) => ({
          id: buildDoctorRowId(sprint.id, doctorId),
          sprintId: sprint.id,
          doctorId,
          createdAt: new Date(sprint.createdAt),
          updatedAt: new Date(sprint.updatedAt),
        })),
      });
    }

    await tx.sprintAvailability.deleteMany({ where: { sprintId: sprint.id } });
    if (sprint.availability.length > 0) {
      await tx.sprintAvailability.createMany({
        data: sprint.availability.map((entry) => ({
          id: buildAvailabilityRowId(sprint.id, entry.doctorId, entry.periodId, entry.dayId),
          sprintId: sprint.id,
          doctorId: entry.doctorId,
          periodId: entry.periodId,
          dayId: entry.dayId,
          source: toDbAvailabilitySource(entry.source),
          updatedByUserId: entry.updatedByUserId,
          updatedByRole: toDbUserRole(entry.updatedByRole),
          updatedAt: new Date(entry.updatedAt),
        })),
      });
    }
  });

  return sprint;
}

function mapPrismaSprintRecordToDomain(record: {
  id: string;
  name: string;
  periodId: string;
  status: string;
  requiredDoctorsPerShift: number;
  maxDaysPerDoctorDefault: number;
  createdAt: Date;
  updatedAt: Date;
  doctors: Array<{
    doctorId: string;
  }>;
  availabilityEntries: Array<{
    doctorId: string;
    periodId: string;
    dayId: string;
    source: string;
    updatedByUserId: string;
    updatedByRole: string;
    updatedAt: Date;
  }>;
}): Sprint {
  return {
    id: record.id,
    name: record.name,
    periodId: record.periodId,
    status: toDomainSprintStatus(record.status),
    globalConfig: {
      requiredDoctorsPerShift: record.requiredDoctorsPerShift,
      maxDaysPerDoctorDefault: record.maxDaysPerDoctorDefault,
    },
    doctorIds: record.doctors.map((doctor) => doctor.doctorId),
    availability: record.availabilityEntries.map((entry) => ({
      doctorId: entry.doctorId,
      periodId: entry.periodId,
      dayId: entry.dayId,
      source: toDomainAvailabilitySource(entry.source),
      updatedByUserId: entry.updatedByUserId,
      updatedByRole: entry.updatedByRole === 'planner' ? 'planner' : 'doctor',
      updatedAt: entry.updatedAt.toISOString(),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getSprintByIdPrisma(id: string): Promise<Sprint | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprint: {
      findUnique: (args: Record<string, unknown>) => Promise<{
        id: string;
        name: string;
        periodId: string;
        status: string;
        requiredDoctorsPerShift: number;
        maxDaysPerDoctorDefault: number;
        createdAt: Date;
        updatedAt: Date;
        doctors: Array<{
          doctorId: string;
        }>;
        availabilityEntries: Array<{
          doctorId: string;
          periodId: string;
          dayId: string;
          source: string;
          updatedByUserId: string;
          updatedByRole: string;
          updatedAt: Date;
        }>;
      } | null>;
    };
  };

  const record = await prisma.sprint.findUnique({
    where: { id },
    include: {
      doctors: {
        orderBy: { doctorId: 'asc' },
      },
      availabilityEntries: {
        orderBy: [{ doctorId: 'asc' }, { periodId: 'asc' }, { dayId: 'asc' }],
      },
    },
  });

  if (!record) {
    return null;
  }

  return mapPrismaSprintRecordToDomain(record);
}

async function listSprintsPrisma(): Promise<Sprint[]> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprint: {
      findMany: (args: Record<string, unknown>) => Promise<Array<{
        id: string;
        name: string;
        periodId: string;
        status: string;
        requiredDoctorsPerShift: number;
        maxDaysPerDoctorDefault: number;
        createdAt: Date;
        updatedAt: Date;
        doctors: Array<{
          doctorId: string;
        }>;
        availabilityEntries: Array<{
          doctorId: string;
          periodId: string;
          dayId: string;
          source: string;
          updatedByUserId: string;
          updatedByRole: string;
          updatedAt: Date;
        }>;
      }>>;
    };
  };

  const records = await prisma.sprint.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      doctors: {
        orderBy: { doctorId: 'asc' },
      },
      availabilityEntries: {
        orderBy: [{ doctorId: 'asc' }, { periodId: 'asc' }, { dayId: 'asc' }],
      },
    },
  });

  return records.map(mapPrismaSprintRecordToDomain);
}

async function clearSprintStorePrisma(): Promise<void> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintAvailability: { deleteMany: (args?: Record<string, unknown>) => Promise<unknown> };
    sprintDoctor: { deleteMany: (args?: Record<string, unknown>) => Promise<unknown> };
    sprint: { deleteMany: (args?: Record<string, unknown>) => Promise<unknown> };
  };

  await prisma.sprintAvailability.deleteMany({});
  await prisma.sprintDoctor.deleteMany({});
  await prisma.sprint.deleteMany({});
}

export async function saveSprint(sprint: Sprint): Promise<Sprint> {
  return saveSprintPrisma(sprint);
}

export async function getSprintById(id: string): Promise<Sprint | null> {
  return getSprintByIdPrisma(id);
}

export async function listSprints(): Promise<Sprint[]> {
  return listSprintsPrisma();
}

export async function clearSprintStore(): Promise<void> {
  await clearSprintStorePrisma();
}
