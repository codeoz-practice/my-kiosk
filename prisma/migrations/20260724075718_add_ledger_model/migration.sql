/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('HELD', 'RELEASABLE', 'SETTLED', 'CLAWBACK_PENDING');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "LedgerStatus" NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ledger_id_status_idx" ON "Ledger"("id", "status");
