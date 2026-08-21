/*
  Warnings:

  - You are about to drop the column `type` on the `products` table. All the data in the column will be lost.
  - Added the required column `ticket_type` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_type` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "ticket_type" "TicketType" NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "type",
ADD COLUMN     "ticket_type" "TicketType" NOT NULL;
