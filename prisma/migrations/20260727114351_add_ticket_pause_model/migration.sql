/*
  Warnings:

  - You are about to drop the `Tickets` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('TIME', 'PERIOD');

-- DropForeignKey
ALTER TABLE "Tickets" DROP CONSTRAINT "Tickets_user_id_fkey";

-- DropTable
DROP TABLE "Tickets";

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "valid-until" TIMESTAMP(3) NOT NULL,
    "total_minutes" INTEGER,
    "valid_days" INTEGER,
    "activated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket-pauses" (
    "id" TEXT NOT NULL,
    "ticket-id" TEXT NOT NULL,
    "paused-at" TIMESTAMP(3) NOT NULL,
    "resumed-at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "ticket-pauses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket-pauses" ADD CONSTRAINT "ticket-pauses_ticket-id_fkey" FOREIGN KEY ("ticket-id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
