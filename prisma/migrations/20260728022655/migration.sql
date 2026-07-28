/*
  Warnings:

  - You are about to drop the column `reason` on the `ticket_pauses` table. All the data in the column will be lost.
  - You are about to drop the column `total_minutes` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `valid-until` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `valid_days` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `Ledger` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_item_id]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paused_by` to the `ticket_pauses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ticket_pauses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_item_id` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('UNUSED', 'ACTIVE', 'EXPIRED', 'EXHAUSTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CARD', 'CASH');

-- CreateEnum
CREATE TYPE "VanType" AS ENUM ('NICE', 'KCP', 'KSNET');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUESTED', 'SUCCESS', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ticket_pauses" DROP COLUMN "reason",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paused_by" TEXT NOT NULL,
ADD COLUMN     "paused_reason" TEXT,
ADD COLUMN     "resumed_by" TEXT,
ADD COLUMN     "resumed_reason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "total_minutes",
DROP COLUMN "valid-until",
DROP COLUMN "valid_days",
ADD COLUMN     "activate_by" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "minute_expire_at" TIMESTAMP(3),
ADD COLUMN     "order_item_id" TEXT NOT NULL,
ADD COLUMN     "remaining_minutes" INTEGER,
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'UNUSED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Ledger";

-- DropEnum
DROP TYPE "LedgerStatus";

-- CreateTable
CREATE TABLE "ticket_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "price" INTEGER NOT NULL,
    "total_minutes" INTEGER,
    "duration_days" INTEGER,
    "usable_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_price" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "total_minutes" INTEGER,
    "duration_days" INTEGER,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "order_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "van" "VanType",
    "requested_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_user_id_createdAt_idx" ON "orders"("user_id", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "ticket_pauses_ticket_id_updatedAt_idx" ON "ticket_pauses"("ticket_id", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_order_item_id_key" ON "tickets"("order_item_id");

-- CreateIndex
CREATE INDEX "tickets_status_updatedAt_idx" ON "tickets"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "tickets_user_id_expires_at_idx" ON "tickets"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "tickets_user_id_minute_expire_at_idx" ON "tickets"("user_id", "minute_expire_at");

-- CreateIndex
CREATE INDEX "tickets_user_id_createdAt_idx" ON "tickets"("user_id", "createdAt");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ticket_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
