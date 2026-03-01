import type { CreateDoctorRequest, DoctorCatalog, UpdateDoctorRequest } from '@scheduler/domain';
import { getPrismaClient } from '../../lib/prisma.js';

function createDoctorId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type DoctorRow = {
  id: string;
  name: string;
  active: boolean;
  maxTotalDaysDefault: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapDoctor(row: DoctorRow): DoctorCatalog {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    ...(row.maxTotalDaysDefault !== null ? { maxTotalDaysDefault: row.maxTotalDaysDefault } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createDoctor(payload: CreateDoctorRequest): Promise<DoctorCatalog> {
  const prisma = (await getPrismaClient()) as unknown as {
    doctor: {
      create: (args: Record<string, unknown>) => Promise<DoctorRow>;
    };
  };

  const row = await prisma.doctor.create({
    data: {
      id: createDoctorId(),
      name: payload.name,
      active: payload.active ?? true,
      maxTotalDaysDefault: payload.maxTotalDaysDefault ?? null,
    },
  });

  return mapDoctor(row);
}

export async function listDoctors(): Promise<DoctorCatalog[]> {
  const prisma = (await getPrismaClient()) as unknown as {
    doctor: {
      findMany: (args: Record<string, unknown>) => Promise<DoctorRow[]>;
    };
  };

  const rows = await prisma.doctor.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapDoctor);
}

export async function getDoctorById(doctorId: string): Promise<DoctorCatalog | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    doctor: {
      findUnique: (args: Record<string, unknown>) => Promise<DoctorRow | null>;
    };
  };

  const row = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!row) {
    return null;
  }

  return mapDoctor(row);
}

export async function updateDoctor(doctorId: string, payload: UpdateDoctorRequest): Promise<DoctorCatalog | null> {
  const prisma = (await getPrismaClient()) as unknown as {
    doctor: {
      update: (args: Record<string, unknown>) => Promise<DoctorRow>;
    };
  };

  try {
    const row = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.maxTotalDaysDefault !== undefined ? { maxTotalDaysDefault: payload.maxTotalDaysDefault } : {}),
      },
    });

    return mapDoctor(row);
  } catch {
    return null;
  }
}

export async function deleteDoctor(doctorId: string): Promise<boolean> {
  const prisma = (await getPrismaClient()) as unknown as {
    doctor: {
      delete: (args: Record<string, unknown>) => Promise<unknown>;
    };
  };

  try {
    await prisma.doctor.delete({ where: { id: doctorId } });
    return true;
  } catch {
    return false;
  }
}

export async function clearDoctorStore(): Promise<void> {
  const prisma = (await getPrismaClient()) as unknown as {
    sprintAvailability: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    sprintDoctor: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
    doctor: {
      deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
    };
  };

  await prisma.sprintAvailability.deleteMany({});
  await prisma.sprintDoctor.deleteMany({});
  await prisma.doctor.deleteMany({});
}
