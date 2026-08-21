-- CreateTable
CREATE TABLE "payment_cancel_items" (
    "id" TEXT NOT NULL,
    "payment_cancel_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_cancel_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_cancel_items_payment_cancel_id_idx" ON "payment_cancel_items"("payment_cancel_id");

-- CreateIndex
CREATE INDEX "payment_cancel_items_order_item_id_idx" ON "payment_cancel_items"("order_item_id");

-- AddForeignKey
ALTER TABLE "payment_cancel_items" ADD CONSTRAINT "payment_cancel_items_payment_cancel_id_fkey" FOREIGN KEY ("payment_cancel_id") REFERENCES "payment_cancels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_cancel_items" ADD CONSTRAINT "payment_cancel_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
