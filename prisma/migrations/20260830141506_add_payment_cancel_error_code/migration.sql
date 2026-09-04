-- CreateEnum
CREATE TYPE "PaymentCancelFailureCode" AS ENUM ('AMOUNT_MISMATCH');

-- AlterTable
ALTER TABLE "payment_cancels"
  ADD COLUMN "pg_error_code" TEXT,
  ADD COLUMN "failure_code" "PaymentCancelFailureCode";

-- CreateIndex
CREATE INDEX "payment_cancels_pg_error_code_idx" ON "payment_cancels"("pg_error_code");

-- CreateIndex
CREATE INDEX "payment_cancels_failure_code_idx" ON "payment_cancels"("failure_code");
