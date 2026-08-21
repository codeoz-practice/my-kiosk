-- RenameColumn (데이터 보존을 위해 RENAME 사용, DROP+ADD 아님)
ALTER TABLE "tickets" RENAME COLUMN "total_minutes" TO "purchased_minutes";
ALTER TABLE "tickets" RENAME COLUMN "duration_days" TO "purchased_duration_days";

ALTER TABLE "products" RENAME COLUMN "total_minutes" TO "purchased_minutes";
ALTER TABLE "products" RENAME COLUMN "duration_days" TO "purchased_duration_days";

ALTER TABLE "order_items" RENAME COLUMN "total_minutes" TO "purchased_minutes";
ALTER TABLE "order_items" RENAME COLUMN "duration_days" TO "purchased_duration_days";
