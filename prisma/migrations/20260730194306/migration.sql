/*
  Warnings:

  - You are about to drop the column `cancelled_at` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "cancelled_at",
ALTER COLUMN "pgTransactionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "duration_days" INTEGER,
ADD COLUMN     "total_minutes" INTEGER;

-- CreateTable
CREATE TABLE "payment_cancels" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "pg_transaction_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_cancels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_cancels_pg_transaction_id_key" ON "payment_cancels"("pg_transaction_id");

-- CreateIndex
CREATE INDEX "payment_cancels_payment_id_idx" ON "payment_cancels"("payment_id");

-- AddForeignKey
ALTER TABLE "payment_cancels" ADD CONSTRAINT "payment_cancels_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
