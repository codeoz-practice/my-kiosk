-- CreateEnum
CREATE TYPE "PaymentCancelStatus" AS ENUM ('REQUESTED', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "payment_cancels" ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "status" "PaymentCancelStatus" NOT NULL DEFAULT 'REQUESTED';

-- CreateIndex
CREATE INDEX "payment_cancels_status_idx" ON "payment_cancels"("status");
