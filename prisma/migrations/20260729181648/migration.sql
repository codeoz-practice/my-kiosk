/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,number]` on the table `seats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "seats_shop_id_number_idx";

-- CreateIndex
CREATE UNIQUE INDEX "seats_shop_id_number_key" ON "seats"("shop_id", "number");
