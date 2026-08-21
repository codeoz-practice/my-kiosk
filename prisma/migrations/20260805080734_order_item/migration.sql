/*
  Warnings:

  - Added the required column `discount_amount` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPrice` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "discount_amount" INTEGER NOT NULL,
ADD COLUMN     "originalPrice" INTEGER NOT NULL;
