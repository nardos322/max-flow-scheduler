-- CreateTable
CREATE TABLE "planning_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "planning_cycle_sprints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "planning_cycle_sprints_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "planning_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planning_cycle_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    CONSTRAINT "planning_cycle_runs_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "planning_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planning_cycle_run_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "inputSnapshot" JSON,
    "outputSnapshot" JSON,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "planning_cycle_run_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "planning_cycle_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "idx_planning_cycles_status" ON "planning_cycles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_planning_cycle_sprints_cycle_sprint" ON "planning_cycle_sprints"("cycleId", "sprintId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_planning_cycle_sprints_cycle_order" ON "planning_cycle_sprints"("cycleId", "orderIndex");

-- CreateIndex
CREATE INDEX "idx_planning_cycle_sprints_cycle_id" ON "planning_cycle_sprints"("cycleId");

-- CreateIndex
CREATE INDEX "idx_planning_cycle_sprints_sprint_id" ON "planning_cycle_sprints"("sprintId");

-- CreateIndex
CREATE INDEX "idx_planning_cycle_runs_cycle_executed_at" ON "planning_cycle_runs"("cycleId", "executedAt");

-- CreateIndex
CREATE INDEX "idx_planning_cycle_run_items_run_id" ON "planning_cycle_run_items"("runId");

-- CreateIndex
CREATE INDEX "idx_planning_cycle_run_items_sprint_id" ON "planning_cycle_run_items"("sprintId");
