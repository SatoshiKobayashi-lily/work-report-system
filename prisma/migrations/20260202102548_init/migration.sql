-- CreateTable
CREATE TABLE "reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "work_date" DATETIME NOT NULL,
    "worker_name" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "site_address" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "work_type" TEXT NOT NULL,
    "work_type_other" TEXT,
    "has_fault_code" BOOLEAN NOT NULL,
    "fault_code_content" TEXT,
    "part_number" TEXT,
    "part_quantity" INTEGER,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_customer_name" ON "reports"("customer_name");

-- CreateIndex
CREATE INDEX "idx_serial_number" ON "reports"("serial_number");

-- CreateIndex
CREATE INDEX "idx_part_number" ON "reports"("part_number");

-- CreateIndex
CREATE INDEX "idx_work_date" ON "reports"("work_date");
