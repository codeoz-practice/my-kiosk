-- AlterEnum
ALTER TYPE "UsageSessionStatus" ADD VALUE 'CREATED';

-- AlterTable
ALTER TABLE "usage_sessions" ALTER COLUMN "status" SET DEFAULT 'CREATED';
