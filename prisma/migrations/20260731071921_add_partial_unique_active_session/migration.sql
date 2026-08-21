-- 활성 UsageSession은 ticketId당 하나만 허용 (ended_at IS NULL인 행)
CREATE UNIQUE INDEX "unique_active_usage_session"
ON "usage_sessions" ("ticket_id")
WHERE "ended_at" IS NULL;

-- 활성 TicketPause는 ticketId당 하나만 허용 (resumed_at IS NULL인 행)
CREATE UNIQUE INDEX "unique_active_ticket_pause"
ON "ticket_pauses" ("ticket_id")
WHERE "resumed_at" IS NULL;
