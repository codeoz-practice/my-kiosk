/*
  Warnings:

  - You are about to drop the `ticket-pauses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ticket-pauses" DROP CONSTRAINT "ticket-pauses_ticket-id_fkey";

-- DropTable
DROP TABLE "ticket-pauses";

-- CreateTable
CREATE TABLE "ticket_pauses" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "paused_at" TIMESTAMP(3) NOT NULL,
    "resumed_at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "ticket_pauses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_pauses" ADD CONSTRAINT "ticket_pauses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
