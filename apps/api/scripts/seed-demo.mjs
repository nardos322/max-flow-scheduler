import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
});

async function run() {
  const now = new Date();

  const doctorOneId = 'doc-seed-ana';
  const doctorTwoId = 'doc-seed-bruno';
  const periodId = 'period-seed-mar-2026';
  const sprintId = 'sprint-seed-mar-1';
  const cycleId = 'cycle-seed-q2';

  await prisma.doctor.upsert({
    where: { id: doctorOneId },
    create: {
      id: doctorOneId,
      name: 'Dra. Ana Seed',
      active: true,
      maxTotalDaysDefault: 5,
    },
    update: {
      name: 'Dra. Ana Seed',
      active: true,
      maxTotalDaysDefault: 5,
    },
  });

  await prisma.doctor.upsert({
    where: { id: doctorTwoId },
    create: {
      id: doctorTwoId,
      name: 'Dr. Bruno Seed',
      active: true,
      maxTotalDaysDefault: 4,
    },
    update: {
      name: 'Dr. Bruno Seed',
      active: true,
      maxTotalDaysDefault: 4,
    },
  });

  await prisma.period.upsert({
    where: { id: periodId },
    create: {
      id: periodId,
      name: 'Periodo Demo Marzo 2026',
      startsOn: '2026-03-02',
      endsOn: '2026-03-06',
    },
    update: {
      name: 'Periodo Demo Marzo 2026',
      startsOn: '2026-03-02',
      endsOn: '2026-03-06',
    },
  });

  await prisma.periodDemand.deleteMany({ where: { periodId } });
  await prisma.periodDemand.createMany({
    data: [
      { id: 'pd-seed-1', periodId, dayId: '2026-03-02', requiredDoctors: 1 },
      { id: 'pd-seed-2', periodId, dayId: '2026-03-03', requiredDoctors: 1 },
      { id: 'pd-seed-3', periodId, dayId: '2026-03-04', requiredDoctors: 1 },
      { id: 'pd-seed-4', periodId, dayId: '2026-03-05', requiredDoctors: 1 },
      { id: 'pd-seed-5', periodId, dayId: '2026-03-06', requiredDoctors: 1 },
    ],
  });

  await prisma.sprint.upsert({
    where: { id: sprintId },
    create: {
      id: sprintId,
      name: 'Sprint Demo Marzo',
      periodId,
      status: 'ready_to_solve',
      requiredDoctorsPerShift: 1,
      maxDaysPerDoctorDefault: 5,
    },
    update: {
      name: 'Sprint Demo Marzo',
      periodId,
      status: 'ready_to_solve',
      requiredDoctorsPerShift: 1,
      maxDaysPerDoctorDefault: 5,
    },
  });

  await prisma.sprintDoctor.deleteMany({ where: { sprintId } });
  await prisma.sprintDoctor.createMany({
    data: [
      { id: 'sd-seed-1', sprintId, doctorId: doctorOneId },
      { id: 'sd-seed-2', sprintId, doctorId: doctorTwoId },
    ],
  });

  await prisma.sprintAvailability.deleteMany({ where: { sprintId } });
  await prisma.sprintAvailability.createMany({
    data: [
      {
        id: 'sa-seed-1',
        sprintId,
        doctorId: doctorOneId,
        periodId,
        dayId: '2026-03-02',
        source: 'planner_override',
        updatedByUserId: 'planner-seed',
        updatedByRole: 'planner',
        updatedAt: now,
      },
      {
        id: 'sa-seed-2',
        sprintId,
        doctorId: doctorOneId,
        periodId,
        dayId: '2026-03-04',
        source: 'planner_override',
        updatedByUserId: 'planner-seed',
        updatedByRole: 'planner',
        updatedAt: now,
      },
      {
        id: 'sa-seed-3',
        sprintId,
        doctorId: doctorTwoId,
        periodId,
        dayId: '2026-03-03',
        source: 'planner_override',
        updatedByUserId: 'planner-seed',
        updatedByRole: 'planner',
        updatedAt: now,
      },
      {
        id: 'sa-seed-4',
        sprintId,
        doctorId: doctorTwoId,
        periodId,
        dayId: '2026-03-05',
        source: 'planner_override',
        updatedByUserId: 'planner-seed',
        updatedByRole: 'planner',
        updatedAt: now,
      },
    ],
  });

  await prisma.planningCycle.upsert({
    where: { id: cycleId },
    create: {
      id: cycleId,
      name: 'Ciclo Demo Q2',
      status: 'draft',
    },
    update: {
      name: 'Ciclo Demo Q2',
      status: 'draft',
    },
  });

  await prisma.planningCycleSprint.deleteMany({ where: { cycleId } });
  await prisma.planningCycleSprint.create({
    data: {
      id: 'pcs-seed-1',
      cycleId,
      sprintId,
      orderIndex: 1,
    },
  });

  // Reset demo run history to keep setup deterministic.
  await prisma.planningCycleRunItem.deleteMany({
    where: { run: { cycleId } },
  });
  await prisma.planningCycleRun.deleteMany({ where: { cycleId } });
  await prisma.sprintRun.deleteMany({ where: { sprintId } });

  console.log('Demo seed ready:');
  console.log(`- doctors: ${doctorOneId}, ${doctorTwoId}`);
  console.log(`- period: ${periodId}`);
  console.log(`- sprint: ${sprintId} (ready_to_solve)`);
  console.log(`- planning cycle: ${cycleId}`);
}

run()
  .catch((error) => {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
