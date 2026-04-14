-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SalonInvite" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salon_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "SalonInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalonInvite_token_key" ON "SalonInvite"("token");

-- CreateIndex
CREATE INDEX "SalonInvite_salon_id_idx" ON "SalonInvite"("salon_id");

-- CreateIndex
CREATE INDEX "SalonInvite_token_idx" ON "SalonInvite"("token");

-- AddForeignKey
ALTER TABLE "SalonInvite" ADD CONSTRAINT "SalonInvite_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
