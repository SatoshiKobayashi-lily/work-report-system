-- CreateTable
CREATE TABLE "serial_number_masters" (
    "id" SERIAL NOT NULL,
    "serial_number" TEXT NOT NULL,
    "customer_name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_number_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_number_masters" (
    "id" SERIAL NOT NULL,
    "part_number" TEXT NOT NULL,
    "part_name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_number_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "serial_number_masters_serial_number_key" ON "serial_number_masters"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "part_number_masters_part_number_key" ON "part_number_masters"("part_number");
