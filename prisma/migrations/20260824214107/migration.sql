/*
  Warnings:

  - You are about to drop the column `token_hash` on the `refresh_tokens` table. All the data in the column will be lost.
  - Added the required column `jti` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "refresh_tokens_token_hash_idx";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "token_hash",
ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");
