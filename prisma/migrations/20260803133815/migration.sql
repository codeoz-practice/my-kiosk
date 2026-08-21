/*
  Warnings:

  - You are about to drop the `ticket_product_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_product_histories" DROP CONSTRAINT "ticket_product_histories_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "ticket_product_histories" DROP CONSTRAINT "ticket_product_histories_ticket_product_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_products" DROP CONSTRAINT "ticket_products_shop_id_fkey";

-- DropTable
DROP TABLE "ticket_product_histories";

-- DropTable
DROP TABLE "ticket_products";

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "price" INTEGER NOT NULL,
    "shop_id" TEXT NOT NULL,
    "total_minutes" INTEGER,
    "duration_days" INTEGER,
    "usable_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_histories" (
    "id" TEXT NOT NULL,
    "change_group_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "changed_field" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_shop_id_idx" ON "products"("shop_id");

-- CreateIndex
CREATE INDEX "product_histories_product_id_changed_at_idx" ON "product_histories"("product_id", "changed_at");

-- CreateIndex
CREATE INDEX "product_histories_change_group_id_idx" ON "product_histories"("change_group_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_histories" ADD CONSTRAINT "product_histories_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_histories" ADD CONSTRAINT "product_histories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
