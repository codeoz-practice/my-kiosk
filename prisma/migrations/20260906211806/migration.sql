/*
  Warnings:

  - You are about to drop the `payment_cancel_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `order_item_id` to the `payment_cancels` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payment_cancel_items" DROP CONSTRAINT "payment_cancel_items_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "payment_cancel_items" DROP CONSTRAINT "payment_cancel_items_payment_cancel_id_fkey";

-- AlterTable
ALTER TABLE "payment_cancels" ADD COLUMN     "order_item_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "payment_cancel_items";

-- CreateIndex
CREATE INDEX "payment_cancels_order_item_id_idx" ON "payment_cancels"("order_item_id");

-- AddForeignKey
ALTER TABLE "payment_cancels" ADD CONSTRAINT "payment_cancels_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
