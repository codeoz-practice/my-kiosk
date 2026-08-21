/*
  Warnings:

  - You are about to drop the column `createdAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payment_cancels` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ticket_pauses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ticket_pauses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `usage_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `usage_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Ledger` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payment_cancels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ticket_pauses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `(updated_at)` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `usage_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ledger_status" AS ENUM ('HELD', 'RELEASABLE', 'SETTLED', 'CLAWBACK_PENDING');

-- DropIndex
DROP INDEX "orders_user_id_createdAt_idx";

-- DropIndex
DROP INDEX "ticket_pauses_ticket_id_updatedAt_idx";

-- DropIndex
DROP INDEX "tickets_status_updatedAt_idx";

-- DropIndex
DROP INDEX "tickets_user_id_createdAt_idx";

-- DropIndex
DROP INDEX "usage_sessions_user_id_status_updatedAt_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "payment_cancels" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ticket_pauses" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "(updated_at)" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "usage_sessions" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Ledger";

-- DropEnum
DROP TYPE "LedgerStatus";

-- CreateTable
CREATE TABLE "ledger" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ledger_status" NOT NULL,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_sellerId_idx" ON "ledger"("sellerId");

-- CreateIndex
CREATE INDEX "ledger_tradeId_idx" ON "ledger"("tradeId");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_pauses_ticket_id_updated_at_idx" ON "ticket_pauses"("ticket_id", "updated_at");

-- CreateIndex
CREATE INDEX "tickets_status_(updated_at)_idx" ON "tickets"("status", "(updated_at)");

-- CreateIndex
CREATE INDEX "tickets_user_id_created_at_idx" ON "tickets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "usage_sessions_user_id_status_updated_at_idx" ON "usage_sessions"("user_id", "status", "updated_at");
