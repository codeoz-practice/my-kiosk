/*
  Warnings:

  - Added the required column `pgTransactionId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "pgTransactionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "payments_pgTransactionId_idx" ON "payments"("pgTransactionId");
