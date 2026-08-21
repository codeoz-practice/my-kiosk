/*
  Warnings:

  - You are about to drop the column `(updated_at)` on the `tickets` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tickets_status_(updated_at)_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "(updated_at)",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "tickets_status_updated_at_idx" ON "tickets"("status", "updated_at");
