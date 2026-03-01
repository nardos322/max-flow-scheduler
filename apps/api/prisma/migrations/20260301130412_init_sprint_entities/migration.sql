-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startsOn" TEXT NOT NULL,
    "endsOn" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiredDoctorsPerShift" INTEGER NOT NULL,
    "maxDaysPerDoctorDefault" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sprint_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "maxTotalDaysOverride" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sprint_doctors_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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
    CONSTRAINT "sprint_availability_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprint_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "outputSnapshot" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "sprint_runs_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "idx_sprints_status" ON "sprints"("status");

-- CreateIndex
CREATE INDEX "idx_sprints_date_range" ON "sprints"("startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "idx_sprint_doctors_sprint_id" ON "sprint_doctors"("sprintId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sprint_doctors_sprint_doctor" ON "sprint_doctors"("sprintId", "doctorId");

-- CreateIndex
CREATE INDEX "idx_sprint_availability_sprint_id" ON "sprint_availability"("sprintId");

-- CreateIndex
CREATE INDEX "idx_sprint_availability_sprint_doctor" ON "sprint_availability"("sprintId", "doctorId");

-- CreateIndex
CREATE INDEX "idx_sprint_availability_sprint_period_day" ON "sprint_availability"("sprintId", "periodId", "dayId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sprint_availability_entry" ON "sprint_availability"("sprintId", "doctorId", "periodId", "dayId");

-- CreateIndex
CREATE INDEX "idx_sprint_runs_sprint_executed_at" ON "sprint_runs"("sprintId", "executedAt");
