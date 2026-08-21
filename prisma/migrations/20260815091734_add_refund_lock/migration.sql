-- CreateTable
CREATE TABLE "refund_locks" (
    "order_item_id" TEXT NOT NULL,
    "payment_cancel_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_locks_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateIndex
CREATE INDEX "refund_locks_expires_at_idx" ON "refund_locks"("expires_at");

-- AddForeignKey
ALTER TABLE "refund_locks" ADD CONSTRAINT "refund_locks_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_locks" ADD CONSTRAINT "refund_locks_payment_cancel_id_fkey" FOREIGN KEY ("payment_cancel_id") REFERENCES "payment_cancels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
