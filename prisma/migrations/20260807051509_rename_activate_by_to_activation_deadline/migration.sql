/*
  Warnings:

  - You are about to drop the column `activate_by` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "activate_by",
ADD COLUMN     "activation_deadline" TIMESTAMP(3);
