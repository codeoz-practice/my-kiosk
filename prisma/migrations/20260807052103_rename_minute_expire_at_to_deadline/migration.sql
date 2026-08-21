/*
  Warnings:

  - You are about to drop the column `minute_expire_at` on the `tickets` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tickets_user_id_minute_expire_at_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "minute_expire_at",
ADD COLUMN     "minute_expire_deadline" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tickets_user_id_minute_expire_deadline_idx" ON "tickets"("user_id", "minute_expire_deadline");
