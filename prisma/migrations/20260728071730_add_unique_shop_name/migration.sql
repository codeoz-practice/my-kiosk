/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `shops` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "shops_name_key" ON "shops"("name");
