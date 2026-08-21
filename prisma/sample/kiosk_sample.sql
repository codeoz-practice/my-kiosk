-- -------------------------------------------------------------
-- TablePlus 26.8.6(752)
--
-- https://tableplus.com/
--
-- Database: myapp_db
-- Generation Time: 2026-08-13 00:57:46.5240
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."orders";
-- Table Definition
CREATE TABLE "public"."orders" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "original_price" int4 NOT NULL,
    "discount_amount" int4 NOT NULL DEFAULT 0,
    "total_amount" int4 NOT NULL,
    "shop_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payments";
DROP TYPE IF EXISTS "public"."PaymentType";
CREATE TYPE "public"."PaymentType" AS ENUM ('CARD', 'CASH');
DROP TYPE IF EXISTS "public"."PaymentStatus";
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'REQUESTED', 'SUCCESS', 'FAILED', 'CANCELLED');
DROP TYPE IF EXISTS "public"."VanType";
CREATE TYPE "public"."VanType" AS ENUM ('NICE', 'KCP', 'KSNET');

-- Table Definition
CREATE TABLE "public"."payments" (
    "id" text NOT NULL,
    "type" "public"."PaymentType" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING'::"PaymentStatus",
    "order_id" text NOT NULL,
    "price" int4 NOT NULL,
    "van" "public"."VanType",
    "requested_at" timestamp(3),
    "approved_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pgTransactionId" text,
    "reason" text,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."ticket_pauses";
-- Table Definition
CREATE TABLE "public"."ticket_pauses" (
    "id" text NOT NULL,
    "ticket_id" text NOT NULL,
    "paused_at" timestamp(3) NOT NULL,
    "resumed_at" timestamp(3),
    "paused_by" text NOT NULL,
    "paused_reason" text,
    "resumed_by" text,
    "resumed_reason" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."ledger";
DROP TYPE IF EXISTS "public"."ledger_status";
CREATE TYPE "public"."ledger_status" AS ENUM ('HELD', 'RELEASABLE', 'SETTLED', 'CLAWBACK_PENDING');

-- Table Definition
CREATE TABLE "public"."ledger" (
    "id" text NOT NULL,
    "sellerId" text NOT NULL,
    "tradeId" text NOT NULL,
    "amount" int4 NOT NULL,
    "status" "public"."ledger_status" NOT NULL,
    "settled_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."tickets";
DROP TYPE IF EXISTS "public"."TicketType";
CREATE TYPE "public"."TicketType" AS ENUM ('TIME', 'PERIOD');
DROP TYPE IF EXISTS "public"."TicketStatus";
CREATE TYPE "public"."TicketStatus" AS ENUM ('UNUSED', 'ACTIVE', 'EXPIRED', 'EXHAUSTED', 'REVOKED');

-- Table Definition
CREATE TABLE "public"."tickets" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "type" "public"."TicketType" NOT NULL,
    "activated_at" timestamp(3),
    "expires_at" timestamp(3),
    "order_item_id" text NOT NULL,
    "remaining_minutes" int4,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'UNUSED'::"TicketStatus",
    "purchased_duration_days" int4,
    "purchased_minutes" int4,
    "activation_deadline" timestamp(3),
    "minute_expire_deadline" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."usage_sessions";
DROP TYPE IF EXISTS "public"."UsageSessionStatus";
CREATE TYPE "public"."UsageSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'JOB_CREATION_FAILED', 'JOB_REGISTER_FAILED', 'EXTERNAL_API_FAILED');

-- Table Definition
CREATE TABLE "public"."usage_sessions" (
    "id" text NOT NULL,
    "ticket_id" text NOT NULL,
    "seat_id" text NOT NULL,
    "shop_id" text NOT NULL,
    "user_id" text NOT NULL,
    "started_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planned_end_at" timestamp(3) NOT NULL,
    "ended_at" timestamp(3),
    "status" "public"."UsageSessionStatus" NOT NULL DEFAULT 'ACTIVE'::"UsageSessionStatus",
    "bullmqJobId" text,
    "failure_reason" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."order_items";
DROP TYPE IF EXISTS "public"."TicketType";
CREATE TYPE "public"."TicketType" AS ENUM ('TIME', 'PERIOD');

-- Table Definition
CREATE TABLE "public"."order_items" (
    "id" text NOT NULL,
    "price" int4 NOT NULL,
    "purchased_minutes" int4,
    "purchased_duration_days" int4,
    "order_id" text NOT NULL,
    "product_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "discount_amount" int4 NOT NULL,
    "ticket_type" "public"."TicketType" NOT NULL,
    "usable_days" int4 NOT NULL,
    "original_price" int4 NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_cancels";
-- Table Definition
CREATE TABLE "public"."payment_cancels" (
    "id" text NOT NULL,
    "payment_id" text NOT NULL,
    "amount" int4 NOT NULL,
    "reason" text,
    "pg_transaction_id" text,
    "requested_at" timestamp(3) NOT NULL,
    "cancelled_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user";
DROP TYPE IF EXISTS "public"."UserType";
CREATE TYPE "public"."UserType" AS ENUM ('USER', 'MANAGER', 'OWNER');

-- Table Definition
CREATE TABLE "public"."user" (
    "id" text NOT NULL,
    "email" text NOT NULL,
    "user_type" "public"."UserType" NOT NULL DEFAULT 'USER'::"UserType",
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."shops";
-- Table Definition
CREATE TABLE "public"."shops" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    "is_active" bool NOT NULL DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."shop_owners";
-- Table Definition
CREATE TABLE "public"."shop_owners" (
    "shop_id" text NOT NULL,
    "user_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("shop_id","user_id")
);

DROP TABLE IF EXISTS "public"."seats";
DROP TYPE IF EXISTS "public"."SeatStatus";
CREATE TYPE "public"."SeatStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- Table Definition
CREATE TABLE "public"."seats" (
    "id" text NOT NULL,
    "number" int4 NOT NULL,
    "name" text NOT NULL DEFAULT ''::text,
    "shop_id" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "status" "public"."SeatStatus" NOT NULL DEFAULT 'AVAILABLE'::"SeatStatus",
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."products";
DROP TYPE IF EXISTS "public"."TicketType";
CREATE TYPE "public"."TicketType" AS ENUM ('TIME', 'PERIOD');

-- Table Definition
CREATE TABLE "public"."products" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    "price" int4 NOT NULL,
    "shop_id" text NOT NULL,
    "purchased_minutes" int4,
    "purchased_duration_days" int4,
    "usable_days" int4 NOT NULL,
    "is_active" bool NOT NULL DEFAULT true,
    "ticket_type" "public"."TicketType" NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" timestamp(3),
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."product_histories";
-- Table Definition
CREATE TABLE "public"."product_histories" (
    "id" text NOT NULL,
    "change_group_id" text NOT NULL,
    "product_id" text NOT NULL,
    "changed_field" text NOT NULL,
    "old_value" text,
    "new_value" text,
    "changed_by" text NOT NULL,
    "changed_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

INSERT INTO "public"."orders" ("id", "user_id", "original_price", "discount_amount", "total_amount", "shop_id", "created_at", "updated_at") VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 100000, 0, 100000, '20000000-0000-0000-0000-000000000001', '2026-07-23 10:10:14.825', '2026-08-12 10:10:14.825'),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 50000, 0, 50000, '20000000-0000-0000-0000-000000000001', '2026-08-02 10:10:14.825', '2026-08-12 10:10:14.825'),
('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 90000, 0, 90000, '20000000-0000-0000-0000-000000000002', '2026-08-07 10:10:14.825', '2026-08-12 10:10:14.825'),
('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 100000, 10000, 90000, '20000000-0000-0000-0000-000000000001', '2026-07-08 10:10:14.825', '2026-08-12 10:10:14.825'),
('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 100000, 0, 100000, '20000000-0000-0000-0000-000000000001', '2026-06-13 10:10:14.825', '2026-08-12 10:10:14.825');

INSERT INTO "public"."payments" ("id", "type", "status", "order_id", "price", "van", "requested_at", "approved_at", "created_at", "pgTransactionId", "reason", "updated_at") VALUES
('90000000-0000-0000-0000-000000000001', 'CARD', 'SUCCESS', '50000000-0000-0000-0000-000000000001', 100000, 'NICE', '2026-07-23 15:55:41.592', '2026-07-23 15:55:41.592', '2026-07-23 15:55:41.592', 'pg-txn-0001', NULL, '2026-07-23 15:55:41.592'),
('90000000-0000-0000-0000-000000000002', 'CARD', 'SUCCESS', '50000000-0000-0000-0000-000000000002', 50000, 'KCP', '2026-08-02 15:55:41.592', '2026-08-02 15:55:41.592', '2026-08-02 15:55:41.592', 'pg-txn-0002', NULL, '2026-08-02 15:55:41.592'),
('90000000-0000-0000-0000-000000000003', 'CASH', 'SUCCESS', '50000000-0000-0000-0000-000000000003', 90000, NULL, '2026-08-07 15:55:41.592', '2026-08-07 15:55:41.592', '2026-08-07 15:55:41.592', NULL, NULL, '2026-08-07 15:55:41.592'),
('90000000-0000-0000-0000-000000000004', 'CARD', 'FAILED', '50000000-0000-0000-0000-000000000004', 90000, 'KSNET', '2026-07-08 15:55:41.592', NULL, '2026-07-08 15:55:41.592', NULL, '카드 한도 초과', '2026-07-08 15:55:41.592'),
('90000000-0000-0000-0000-000000000005', 'CARD', 'SUCCESS', '50000000-0000-0000-0000-000000000004', 90000, 'KSNET', '2026-07-08 16:00:41.592', '2026-07-08 16:00:41.592', '2026-07-08 16:00:41.592', 'pg-txn-0005', NULL, '2026-07-08 16:00:41.592'),
('90000000-0000-0000-0000-000000000006', 'CARD', 'SUCCESS', '50000000-0000-0000-0000-000000000005', 100000, 'NICE', '2026-06-13 15:55:41.592', '2026-06-13 15:55:41.592', '2026-06-13 15:55:41.592', 'pg-txn-0006', NULL, '2026-06-13 15:55:41.592');

INSERT INTO "public"."ticket_pauses" ("id", "ticket_id", "paused_at", "resumed_at", "paused_by", "paused_reason", "resumed_by", "resumed_reason", "created_at", "updated_at") VALUES
('93000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '2026-07-28 15:55:41.592', '2026-08-02 15:55:41.592', '10000000-0000-0000-0000-000000000001', '여행으로 인한 일시정지', '10000000-0000-0000-0000-000000000001', '여행 종료로 재개', '2026-07-28 15:55:41.592', '2026-08-02 15:55:41.592'),
('93000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000004', '2026-08-10 15:55:41.592', NULL, '10000000-0000-0000-0000-000000000004', '관리자 확인 필요로 인한 임시 정지', NULL, NULL, '2026-08-10 15:55:41.592', '2026-08-10 15:55:41.592');

INSERT INTO "public"."tickets" ("id", "user_id", "type", "activated_at", "expires_at", "order_item_id", "remaining_minutes", "status", "purchased_duration_days", "purchased_minutes", "activation_deadline", "minute_expire_deadline", "created_at", "updated_at") VALUES
('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PERIOD', '2026-08-07 10:10:14.825', '2026-09-06 10:10:14.825', '60000000-0000-0000-0000-000000000001', NULL, 'ACTIVE', 30, NULL, '2026-08-22 10:10:14.825', NULL, '2026-07-23 10:10:14.825', '2026-08-12 10:10:14.825'),
('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'TIME', NULL, NULL, '60000000-0000-0000-0000-000000000002', 300, 'ACTIVE', NULL, 600, NULL, '2026-11-05 10:10:14.825', '2026-08-02 10:10:14.825', '2026-08-12 10:10:14.825'),
('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'PERIOD', NULL, NULL, '60000000-0000-0000-0000-000000000003', NULL, 'UNUSED', 30, NULL, '2026-09-06 10:10:14.825', NULL, '2026-08-07 10:10:14.825', '2026-08-12 10:10:14.825'),
('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'PERIOD', '2026-07-23 10:10:14.825', '2026-08-22 10:10:14.825', '60000000-0000-0000-0000-000000000004', NULL, 'ACTIVE', 30, NULL, '2026-08-07 10:10:14.825', NULL, '2026-07-08 10:10:14.825', '2026-08-12 10:10:14.825'),
('70000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'PERIOD', '2026-06-18 10:10:14.825', '2026-07-18 10:10:14.825', '60000000-0000-0000-0000-000000000005', NULL, 'EXPIRED', 30, NULL, '2026-07-13 10:10:14.825', NULL, '2026-06-13 10:10:14.825', '2026-08-12 10:10:14.825');

INSERT INTO "public"."usage_sessions" ("id", "ticket_id", "seat_id", "shop_id", "user_id", "started_at", "planned_end_at", "ended_at", "status", "bullmqJobId", "failure_reason", "created_at", "updated_at") VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-08-12 15:21:05.577', '2026-08-12 20:21:05.577', NULL, 'ACTIVE', 'job-active-001', NULL, '2026-08-12 15:21:05.577', '2026-08-12 15:51:05.577'),
('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-08-10 15:51:05.577', '2026-08-10 17:21:05.577', '2026-08-10 17:21:05.577', 'ENDED', NULL, NULL, '2026-08-10 15:51:05.577', '2026-08-10 15:51:05.577'),
('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-08-11 15:51:05.577', '2026-08-11 16:51:05.577', '2026-08-11 16:51:05.577', 'ENDED', NULL, NULL, '2026-08-11 15:51:05.577', '2026-08-11 15:51:05.577'),
('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-08-09 15:51:05.577', '2026-08-09 16:36:05.577', '2026-08-09 16:36:05.577', 'ENDED', NULL, NULL, '2026-08-09 15:51:05.577', '2026-08-09 15:51:05.577'),
('80000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-08-08 15:51:05.577', '2026-08-08 15:51:05.577', '2026-08-08 15:51:05.577', 'JOB_CREATION_FAILED', NULL, 'BullMQ job registration timeout', '2026-08-08 15:51:05.577', '2026-08-08 15:51:05.577');

INSERT INTO "public"."order_items" ("id", "price", "purchased_minutes", "purchased_duration_days", "order_id", "product_id", "created_at", "updated_at", "discount_amount", "ticket_type", "usable_days", "original_price") VALUES
('60000000-0000-0000-0000-000000000001', 100000, NULL, 30, '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-07-23 10:10:14.825', '2026-08-12 10:10:14.825', 0, 'PERIOD', 30, 100000),
('60000000-0000-0000-0000-000000000002', 50000, 600, NULL, '50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2026-08-02 10:10:14.825', '2026-08-12 10:10:14.825', 0, 'TIME', 90, 50000),
('60000000-0000-0000-0000-000000000003', 90000, NULL, 30, '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2026-08-07 10:10:14.825', '2026-08-12 10:10:14.825', 0, 'PERIOD', 30, 90000),
('60000000-0000-0000-0000-000000000004', 90000, NULL, 30, '50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '2026-07-08 10:10:14.825', '2026-08-12 10:10:14.825', 10000, 'PERIOD', 30, 100000),
('60000000-0000-0000-0000-000000000005', 100000, NULL, 30, '50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '2026-06-13 10:10:14.825', '2026-08-12 10:10:14.825', 0, 'PERIOD', 30, 100000);

INSERT INTO "public"."payment_cancels" ("id", "payment_id", "amount", "reason", "pg_transaction_id", "requested_at", "cancelled_at", "created_at", "updated_at") VALUES
('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000006', 100000, '고객 단순 변심', 'pg-cancel-0001', '2026-06-15 15:55:41.592', '2026-06-15 15:55:41.592', '2026-06-15 15:55:41.592', '2026-06-15 15:55:41.592'),
('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 20000, '이용권 일부 환불 요청', NULL, '2026-08-11 15:55:41.592', NULL, '2026-08-11 15:55:41.592', '2026-08-11 15:55:41.592');

INSERT INTO "public"."user" ("id", "email", "user_type", "created_at", "updated_at") VALUES
('10000000-0000-0000-0000-000000000001', 'user1@test.com', 'USER', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825'),
('10000000-0000-0000-0000-000000000002', 'user2@test.com', 'USER', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825'),
('10000000-0000-0000-0000-000000000003', 'owner1@test.com', 'OWNER', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825'),
('10000000-0000-0000-0000-000000000004', 'manager1@test.com', 'MANAGER', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825');

INSERT INTO "public"."shops" ("id", "name", "created_at", "updated_at", "deleted_at", "is_active") VALUES
('20000000-0000-0000-0000-000000000001', '강남점', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825', NULL, 't'),
('20000000-0000-0000-0000-000000000002', '홍대점', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825', NULL, 't');

INSERT INTO "public"."shop_owners" ("shop_id", "user_id", "created_at") VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '2026-08-12 10:10:14.825'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '2026-08-12 10:10:14.825');

INSERT INTO "public"."seats" ("id", "number", "name", "shop_id", "created_at", "updated_at", "status") VALUES
('40000000-0000-0000-0000-000000000001', 1, 'A1', '20000000-0000-0000-0000-000000000001', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825', 'AVAILABLE'),
('40000000-0000-0000-0000-000000000002', 2, 'A2', '20000000-0000-0000-0000-000000000001', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825', 'AVAILABLE'),
('40000000-0000-0000-0000-000000000003', 1, 'B1', '20000000-0000-0000-0000-000000000002', '2026-08-12 10:10:14.825', '2026-08-12 10:10:14.825', 'AVAILABLE');

INSERT INTO "public"."products" ("id", "name", "price", "shop_id", "purchased_minutes", "purchased_duration_days", "usable_days", "is_active", "ticket_type", "created_at", "deleted_at", "updated_at") VALUES
('30000000-0000-0000-0000-000000000001', '한달 정기권', 100000, '20000000-0000-0000-0000-000000000001', NULL, 30, 30, 't', 'PERIOD', '2026-08-12 10:10:14.825', NULL, '2026-08-12 10:10:14.825'),
('30000000-0000-0000-0000-000000000002', '10시간 이용권', 50000, '20000000-0000-0000-0000-000000000001', 600, NULL, 90, 't', 'TIME', '2026-08-12 10:10:14.825', NULL, '2026-08-12 10:10:14.825'),
('30000000-0000-0000-0000-000000000003', '한달 정기권', 90000, '20000000-0000-0000-0000-000000000002', NULL, 30, 30, 't', 'PERIOD', '2026-08-12 10:10:14.825', NULL, '2026-08-12 10:10:14.825');

INSERT INTO "public"."product_histories" ("id", "change_group_id", "product_id", "changed_field", "old_value", "new_value", "changed_by", "changed_at") VALUES
('92000000-0000-0000-0000-000000000001', 'g-2024-001', '30000000-0000-0000-0000-000000000001', 'price', '90000', '100000', '10000000-0000-0000-0000-000000000003', '2026-07-03 15:55:41.592'),
('92000000-0000-0000-0000-000000000002', 'g-2024-001', '30000000-0000-0000-0000-000000000001', 'usableDays', '20', '30', '10000000-0000-0000-0000-000000000003', '2026-07-03 15:55:41.592'),
('92000000-0000-0000-0000-000000000003', 'g-2024-002', '30000000-0000-0000-0000-000000000002', 'price', '55000', '50000', '10000000-0000-0000-0000-000000000004', '2026-07-28 15:55:41.592');



-- Indices
CREATE INDEX orders_user_id_created_at_idx ON public.orders USING btree (user_id, created_at);
ALTER TABLE "public"."orders" ADD FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."orders" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX "payments_pgTransactionId_key" ON public.payments USING btree ("pgTransactionId");
CREATE INDEX payments_order_id_idx ON public.payments USING btree (order_id);
ALTER TABLE "public"."payments" ADD FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX ticket_pauses_ticket_id_updated_at_idx ON public.ticket_pauses USING btree (ticket_id, updated_at);
CREATE UNIQUE INDEX unique_active_ticket_pause ON public.ticket_pauses USING btree (ticket_id) WHERE (resumed_at IS NULL);
ALTER TABLE "public"."ticket_pauses" ADD FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX "ledger_sellerId_idx" ON public.ledger USING btree ("sellerId");
CREATE INDEX "ledger_tradeId_idx" ON public.ledger USING btree ("tradeId");


-- Indices
CREATE INDEX tickets_user_id_created_at_idx ON public.tickets USING btree (user_id, created_at);
CREATE INDEX tickets_status_updated_at_idx ON public.tickets USING btree (status, updated_at);
CREATE INDEX tickets_user_id_minute_expire_deadline_idx ON public.tickets USING btree (user_id, minute_expire_deadline);
CREATE UNIQUE INDEX tickets_order_item_id_key ON public.tickets USING btree (order_item_id);
CREATE INDEX tickets_user_id_expires_at_idx ON public.tickets USING btree (user_id, expires_at);
ALTER TABLE "public"."tickets" ADD FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."tickets" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX usage_sessions_user_id_status_updated_at_idx ON public.usage_sessions USING btree (user_id, status, updated_at);
CREATE UNIQUE INDEX unique_active_usage_session ON public.usage_sessions USING btree (ticket_id) WHERE (ended_at IS NULL);
CREATE INDEX usage_sessions_shop_id_status_idx ON public.usage_sessions USING btree (shop_id, status);
ALTER TABLE "public"."usage_sessions" ADD FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."usage_sessions" ADD FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."usage_sessions" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."usage_sessions" ADD FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);
ALTER TABLE "public"."order_items" ADD FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."order_items" ADD FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX payment_cancels_pg_transaction_id_key ON public.payment_cancels USING btree (pg_transaction_id);
CREATE INDEX payment_cancels_payment_id_idx ON public.payment_cancels USING btree (payment_id);
ALTER TABLE "public"."payment_cancels" ADD FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);


-- Indices
CREATE INDEX shops_name_idx ON public.shops USING btree (name);
CREATE UNIQUE INDEX shops_name_key ON public.shops USING btree (name);
ALTER TABLE "public"."shop_owners" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."shop_owners" ADD FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX seats_shop_id_number_key ON public.seats USING btree (shop_id, number);
ALTER TABLE "public"."seats" ADD FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX products_shop_id_idx ON public.products USING btree (shop_id);
ALTER TABLE "public"."products" ADD FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX product_histories_product_id_changed_at_idx ON public.product_histories USING btree (product_id, changed_at);
CREATE INDEX product_histories_change_group_id_idx ON public.product_histories USING btree (change_group_id);
ALTER TABLE "public"."product_histories" ADD FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."product_histories" ADD FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
