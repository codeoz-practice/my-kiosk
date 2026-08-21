/*
  Warnings:

  - You are about to drop the column `originalPrice` on the `order_items` table. All the data in the column will be lost.
  - Added the required column `original_price` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "originalPrice",
ADD COLUMN     "original_price" INTEGER NOT NULL;
