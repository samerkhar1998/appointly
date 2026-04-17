-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_phone_key" ON "CustomerProfile"("phone");

-- CreateIndex
CREATE INDEX "CustomerProfile_phone_idx" ON "CustomerProfile"("phone");
