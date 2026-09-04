-- 금전 필드명을 amount로 통일 (price/originalPrice → amount/originalAmount)
-- 컬럼 삭제 후 재생성이 아닌 RENAME으로 처리해 기존 데이터를 보존한다.

-- AlterTable: products
ALTER TABLE "products" RENAME COLUMN "price" TO "amount";

-- AlterTable: orders
ALTER TABLE "orders" RENAME COLUMN "original_price" TO "original_amount";

-- AlterTable: order_items
ALTER TABLE "order_items" RENAME COLUMN "original_price" TO "original_amount";
ALTER TABLE "order_items" RENAME COLUMN "price" TO "amount";

-- AlterTable: payments
ALTER TABLE "payments" RENAME COLUMN "price" TO "amount";
