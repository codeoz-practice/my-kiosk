-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('HELD', 'RELEASABLE', 'SETTLED', 'CLAWBACK_PENDING');

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
CREATE INDEX "Ledger_sellerId_idx" ON "Ledger"("sellerId");

-- CreateIndex
CREATE INDEX "Ledger_tradeId_idx" ON "Ledger"("tradeId");
