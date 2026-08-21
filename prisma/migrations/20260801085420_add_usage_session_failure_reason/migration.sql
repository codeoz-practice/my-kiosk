-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UsageSessionStatus" ADD VALUE 'JOB_CREATION_FAILED';
ALTER TYPE "UsageSessionStatus" ADD VALUE 'EXTERNAL_API_FAILED';
ALTER TYPE "UsageSessionStatus" ADD VALUE 'SEAT_ASSIGNMENT_FAILED';

-- AlterTable
ALTER TABLE "usage_sessions" ADD COLUMN     "failure_reason" TEXT;
