/*
  Warnings:

  - You are about to drop the column `owner_id` on the `shops` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "shops" DROP CONSTRAINT "shops_owner_id_fkey";

-- AlterTable
ALTER TABLE "shops" DROP COLUMN "owner_id";

-- CreateTable
CREATE TABLE "shop_owners" (
    "shop_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_owners_pkey" PRIMARY KEY ("shop_id","user_id")
);

-- AddForeignKey
ALTER TABLE "shop_owners" ADD CONSTRAINT "shop_owners_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_owners" ADD CONSTRAINT "shop_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
