/*
  Warnings:

  - A unique constraint covering the columns `[pgTransactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_pgTransactionId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "payments_pgTransactionId_key" ON "payments"("pgTransactionId");
