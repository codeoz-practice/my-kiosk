/*
  Warnings:

  - The values [CREATED] on the enum `UsageSessionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UsageSessionStatus_new" AS ENUM ('ACTIVE', 'ENDED', 'JOB_CREATION_FAILED', 'JOB_REGISTER_FAILED', 'EXTERNAL_API_FAILED');
ALTER TABLE "public"."usage_sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "usage_sessions" ALTER COLUMN "status" TYPE "UsageSessionStatus_new" USING ("status"::text::"UsageSessionStatus_new");
ALTER TYPE "UsageSessionStatus" RENAME TO "UsageSessionStatus_old";
ALTER TYPE "UsageSessionStatus_new" RENAME TO "UsageSessionStatus";
DROP TYPE "public"."UsageSessionStatus_old";
ALTER TABLE "usage_sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "usage_sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
