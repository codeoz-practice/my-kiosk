-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "seats" ADD COLUMN     "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE';
