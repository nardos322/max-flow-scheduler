PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "sprint_runs";
DROP TABLE IF EXISTS "sprint_availability";
DROP TABLE IF EXISTS "sprint_doctors";
DROP TABLE IF EXISTS "sprints";

CREATE TABLE "doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "maxTotalDaysDefault" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startsOn" TEXT NOT NULL,
    "endsOn" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "period_demands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "requiredDoctors" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "period_demands_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "sprints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiredDoctorsPerShift" INTEGER NOT NULL,
    "maxDaysPerDoctorDefault" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sprints_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sprint_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sprint_doctors_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sprint_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sprint_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "updatedByRole" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sprint_availability_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sprint_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sprint_availability_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sprint_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "inputSnapshot" JSON NOT NULL,
    "outputSnapshot" JSON,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "sprint_runs_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_doctors_active" ON "doctors"("active");
CREATE INDEX "idx_periods_date_range" ON "periods"("startsOn", "endsOn");
CREATE UNIQUE INDEX "uq_period_demands_period_day" ON "period_demands"("periodId", "dayId");
CREATE INDEX "idx_period_demands_period_id" ON "period_demands"("periodId");
CREATE INDEX "idx_sprints_period_id" ON "sprints"("periodId");
CREATE INDEX "idx_sprints_status" ON "sprints"("status");
CREATE INDEX "idx_sprint_doctors_sprint_id" ON "sprint_doctors"("sprintId");
CREATE INDEX "idx_sprint_doctors_doctor_id" ON "sprint_doctors"("doctorId");
CREATE UNIQUE INDEX "uq_sprint_doctors_sprint_doctor" ON "sprint_doctors"("sprintId", "doctorId");
CREATE INDEX "idx_sprint_availability_sprint_id" ON "sprint_availability"("sprintId");
CREATE INDEX "idx_sprint_availability_sprint_doctor" ON "sprint_availability"("sprintId", "doctorId");
CREATE INDEX "idx_sprint_availability_sprint_period_day" ON "sprint_availability"("sprintId", "periodId", "dayId");
CREATE UNIQUE INDEX "uq_sprint_availability_entry" ON "sprint_availability"("sprintId", "doctorId", "periodId", "dayId");
CREATE INDEX "idx_sprint_runs_sprint_executed_at" ON "sprint_runs"("sprintId", "executedAt");

PRAGMA foreign_keys=ON;
