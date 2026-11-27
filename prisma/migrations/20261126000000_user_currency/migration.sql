-- AlterTable
ALTER TABLE "users" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date");
