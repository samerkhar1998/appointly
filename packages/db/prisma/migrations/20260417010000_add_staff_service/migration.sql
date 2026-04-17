-- CreateTable
CREATE TABLE "StaffService" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staff_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    CONSTRAINT "StaffService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffService_staff_id_service_id_key" ON "StaffService"("staff_id", "service_id");

-- CreateIndex
CREATE INDEX "StaffService_staff_id_idx" ON "StaffService"("staff_id");

-- CreateIndex
CREATE INDEX "StaffService_service_id_idx" ON "StaffService"("service_id");

-- AddForeignKey
ALTER TABLE "StaffService" ADD CONSTRAINT "StaffService_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffService" ADD CONSTRAINT "StaffService_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
