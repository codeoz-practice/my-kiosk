/*
  Warnings:

  - Added the required column `usable_days` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "usable_days" INTEGER;

-- Backfill: 구매 시점 스냅샷이 없으므로 현재 Product.usable_days로 채운다
UPDATE "order_items" AS oi
SET "usable_days" = p."usable_days"
FROM "products" AS p
WHERE oi."product_id" = p."id";

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "usable_days" SET NOT NULL;
