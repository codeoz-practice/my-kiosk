# TODO / 미결 정책

아직 결정되지 않은 비즈니스 정책, 나중에 구현해야 할 작업을 모아둔다.
결정되면 이 문서에서 지우고 관련 설계 문서(`docs/이용권_시스템_설계_정리.md` 등)나
코드로 옮긴다.

---

## 매장 삭제(폐점) 시 판매된 이용권 처리 정책

**관련 코드**: [src/shop/repository/shop.repository.ts](../src/shop/repository/shop.repository.ts) `deleteShop`

### 문제

`deleteShop`은 소프트 삭제(`Shop.deletedAt` 세팅)만 수행한다. 매장이 폐점해도
그 매장에서 판매된 `Ticket`(정기권/시간권)과 진행 중인 `UsageSession`은
그대로 남아있는데, 이걸 어떻게 처리할지 정책이 정해지지 않았다.

### 확인해야 할 것

- 이용 중인 좌석(`UsageSession.status = 'ACTIVE'`)이 있는데 매장을 삭제하면?
- 아직 유효한 이용권(`Ticket.status IN ('UNUSED', 'ACTIVE')`)을 가진 고객이 있는데
  매장을 삭제하면?
  - `Ticket`은 `shopId`를 직접 갖지 않고 `orderItem.product.shopId`로 간접 연결됨

### 후보안

1. **그대로 유효 — 결제 후 사용 가능**: 폐점 후에도 고객은 기존 이용권을 그대로
   쓸 수 있다(매장 자체가 없어졌으니 현실적으로는 의미 없지만, 데이터는 안 건드림).
2. **자동 환불/회수 대상**: 폐점 처리 시 해당 매장의 미사용 이용권을 자동으로
   환불/무효화한다 — 별도 환불 도메인/결제 연동 필요.
3. **삭제 자체를 차단**: 이용 중 세션이나 유효한 이용권이 남아있으면 매장
   삭제를 막는 가드만 추가하고, 회수/환불은 다루지 않는다.

### 현재 상태

미결. 정책이 정해지기 전까지 `deleteShop`은 가드 로직 없이 소프트 삭제만 수행한다.

---

## 환불(PaymentCancel) 동시 진행 방지 — 락 획득/해제 서비스 로직 구현

**관련 코드**: `src/refund/refund.service.ts`, `refund.repository.ts`
**관련 스키마**: `PaymentCancel`(`status`/`failureReason`), `RefundLock`
(`prisma/schema.prisma`, 마이그레이션 `20260815091411_add_payment_cancel_status`,
`20260815091734_add_refund_lock`)

### 현재 상태 (2026-09-06)

**구현 완료** — 미사용 자동 처리 경로에 한정. 상세 흐름은
[환불_처리_시퀀스.md](./환불_처리_시퀀스.md), 설계는
[환불_동시_진행_방지_프로세스.md](./architecture/환불_동시_진행_방지_프로세스.md) 참고.

- 사용 이력 기반 자동/수동 분기(`isUnusedTicket`) — 구현됨
- 락 획득/해제, 만료된 락의 PG 재조회 기반 자가 치유(TTL) — 구현됨
- 금액 정합성 검증(`calculateRefundableAmount`) — 구현됨
- PG 호출 및 미확정 처리(응답 실패 시 `REQUESTED`+락 유지, 콜백/TTL 만료로
  후속 처리) — 구현됨. 다만 원래 계획한 "동기 재시도(2~3회)"가 아니라
  실패 즉시 방치하는 방식으로 구현됨(재시도 레이어는 아직 없음)
- 승인 대기 중 같은 상품 중복 신청 방지 — 구현됨(애플리케이션 레벨 트랜잭션 검사)

### 미완료 항목

1. [ ] **점주 승인/거절 API 자체가 없음** (가장 큰 공백)
   `RefundService.createPendingApprovalPaymentCancel`이 `PaymentCancel`을
   `PENDING_APPROVAL` 상태로 만드는 것까지는 구현됐지만, 이를 승인하거나
   거절해서 다음 단계(`RefundLock` 획득 → PG 취소 요청)로 넘기는 API가
   없다. 사용 이력이 있는 티켓의 환불 신청은 이 상태에서 영구히 멈춘다.
   구현 시 [환불_프로세스.md §1-3](./architecture/환불_프로세스.md#1-3-신청승인-주체와-채널)의
   승인 흐름과 아래 2, 3번을 함께 처리해야 한다.

2. [x] **환불 확정 시 `Ticket` 상태 미갱신 — 미사용 자동 처리 경로 해결됨(2026-09-06)**
   `RefundService.callback()`과 `clearStaleLock()`의 `SUCCEEDED` 확정
   분기에서 `succeedPaymentCancel`과 같은 트랜잭션으로
   `RefundRepository.revokeTicket()`을 호출해 `Ticket.status`를
   `REVOKED`로 전이시킨다. `refund()` 진입 시에도 이미 `REVOKED`인
   티켓은 락 획득 전에 즉시 거부한다. **다만 점주 승인 경로
   (`PENDING_APPROVAL`)는 여전히 미해결** — 아래 신규 항목 참고.
   자세한 내용은 [환불_프로세스.md §6](./architecture/환불_프로세스.md#6-티켓-상태-반영) 참고.

3. [x] **부분 환불 모델 재설계 — 미사용 자동 처리 경로 해결됨(2026-09-06)**
   "이용 중인 이용권의 환불은 상품당 1회, 그 즉시 종료"라는 재정의를
   반영해 `calculateRefundableAmount`를 "원가 - 누적 취소액 계산"에서
   "이미 SUCCEEDED된 이력이 있는지(`already_refunded`) 확인"으로
   단순화했다. 이미 환불된 상품은 원가와 무관하게 재환불이 무조건
   거부된다(2번의 `REVOKED` 검증과 이중 방어). **점주 승인 경로가
   구현되기 전까지는 이 경로가 SUCCEEDED에 도달하지 않으므로, 재설계의
   효과는 미사용 자동 처리 경로에 한정된다.** 자세한 내용은
   [환불_상품단위_추적_구조.md](./architecture/환불_상품단위_추적_구조.md)와
   [환불_스키마_설계_근거_모음.md의 "왜 M:N이 되는가"](./architecture/환불_스키마_설계_근거_모음.md#왜-mn이-되는가) 참고.

4. [ ] **진행 중인 `UsageSession` 처리 정책 미확정**
   지금은 ACTIVE 세션이 있으면 무조건 "사용 이력 있음"으로만 분류한다.
   "이용 중에 환불 신청 → 점주가 승인하는 동안 계속 이용"하는 애매한
   상태를 신청 시점에 아예 막을지, 세션 종료 후에만 신청 가능하게 할지는
   미결 — [환불_프로세스.md §3](./architecture/환불_프로세스.md#3-환불-대상-검증) 참고.

5. [ ] **Ledger(정산) 연동 미구현**
   `PaymentCancel.status`가 `SUCCEEDED`로 확정되는 시점에 매장 정산액을
   차감하거나(`HELD`/`RELEASABLE`) 회수 대상으로 전이(`CLAWBACK_PENDING`)
   시키는 로직이 전혀 없다 — [환불_프로세스.md §5](./architecture/환불_프로세스.md#5-정산ledger-연동) 참고.

6. [ ] **PG 응답 금액 불일치 시 관리자 알림 미구현**
   `RefundService.callback()`에서 PG 응답 금액이 요청 금액과 다르면
   `FAILED`로 확정만 하고, 관리자에게 알리는 로직은 코드에 TODO로만
   남아있다(`refund.service.ts`의 `callback()` 내부).

7. [ ] **PG 거래조회 자체가 계속 실패하는 경우 무한 방치 가능**
   `clearStaleLock()`에서 `inquiryPaymentCancel` 호출 자체가 실패("진짜
   모름")하면 아무것도 확정하지 않고 재시도를 거부하는데, 이 실패가
   구조적 원인(PG URL 오설정 등)인지 일시적 네트워크 문제인지 구분하지
   않아 재시도해도 영구히 막힐 수 있다. 관련 메모리:
   `project-refund-pg-request-failure-gap`.

8. [ ] **[신규, 2026-09-06] 점주 승인 경로의 `Ticket` 상태 처리 및
   `TicketPause` 만료일 보정 로직 구현**
   2번/3번이 미사용 자동 처리 경로에서는 해결됐지만, 1번(점주 승인 API)을
   구현하려면 그 전에 아래를 먼저 정해야 한다:
   - 승인 대기(`PENDING_APPROVAL`) 상태인 동안 `Ticket`을 어떻게 처리할지
     — 새 상태(예: 심사 중)를 신설해 이용 자체를 막고 거절 시 원래 상태로
     복귀시킬지, 승인이 확정되는 순간에만 `REVOKED`로 전이시킬지.
   - 신규 상태를 만든다면, 심사 기간만큼 유효기간(만료일)을 보정해야
     하는가 — `TicketPause`(`prisma/schema.prisma`)가 이미 "정지 기간만큼
     `expiresAt`/`minuteExpireDeadline`을 연장한다"는 동일한 문제를
     다루도록 설계되어 있으나, 실제 구현이 없다. `pauseTicket`/
     `resumeTicket` 서비스 메서드 자체가 존재하지 않고, 계산식만
     `src/ticket/readme.md`에 문서화되어 있을 뿐이다(생성은
     `prisma/seed.ts`에서만 이루어짐).
   - 즉 이 작업은 환불 도메인 단독으로 끝나지 않고 `TicketPause`의
     미구현 보정 로직 구현과 얽혀 있어 범위가 크다 — 별도로 설계 논의
     필요. (2026-09-06 계획 논의 중 발견, 이번 범위에서는 명시적으로
     제외하고 여기에 분리해서 남김.)

우선순위: 1번(승인 API)을 구현하려면 8번(승인 경로의 Ticket 처리)을
먼저 설계해야 한다. 미사용 경로의 2번/3번은 이미 해결되어 더 이상
선행 조건이 아니다.

### 참고

설계 논의 및 기각된 대안(멱등키 단독 사용, `PaymentCancel`에 partial
unique index 등)은 Claude 메모리
`project-refund-cancel-concurrency-design`에 정리되어 있음.

---

## 분할결제(포인트/충전금 + 카드) — 현재는 지원하지 않음

**관련 코드**: [src/payment/payment.repository.ts](../src/payment/payment.repository.ts) `createPayment`

### 결정 사항

분할결제는 **지원하지 않기로 확정**했다. PC방/스터디카페 업종 특성상 온라인
주문 흐름에서 분할결제 수요가 낮고, 실제로 필요한 패턴(포인트/충전금 + 카드)은
아래처럼 별도 도메인 신설이 선행돼야 하는 규모라 지금 스코프에 포함하지 않는다.

### 왜 지금 구조로는 분할결제가 안 되는가

`createPayment`는 같은 `orderId`에 `PENDING`/`REQUESTED`/`SUCCESS` 상태 결제가
하나라도 있으면 새 결제 생성을 막고(`DuplicatePaymentRequestError`), `price`도
항상 `order.totalAmount`(전액)로 고정한다. 그래서 한 주문에 결제가 여러 건
남는 유일한 경로는 "실패 후 전액으로 재시도"뿐이고(`FAILED`는 재시도를 막지
않음), 금액을 쪼개 동시 진행하는 분할결제는 코드로 막혀 있다.
(`prisma/seed.ts`의 `createOrderWithMultiplePayments`가 이 재시도 흐름만
시드로 재현한다.)

### 추후 요청이 들어오면 고려해야 할 것

실무에서 분할결제는 크게 두 갈래로 나뉘고, 필요한 작업 범위가 다르다.

1. **포인트/충전금 + 카드** (가장 흔한 실사용 패턴)
   - 포인트 차감은 VAN을 거치지 않는 내부 원장 트랜잭션이라 `Payment` 테이블에
     들어가지 않는다 — `User`별 잔액을 추적하는 새 모델(예: `UserBalance`,
     포인트/충전 이력 원장)이 선행되어야 한다. 지금 스키마엔 전혀 없음.
   - 결제 흐름은 "포인트 차감(내부, 동기) → 부족분만 기존 `Payment` 흐름으로
     카드 승인(외부, VAN)" 순서의 오케스트레이션이 필요하고, 카드 승인이
     실패하면 포인트 차감을 롤백하는 보상 트랜잭션이 필요하다.
   - `Order.payments[]`(1:N)를 건드릴 필요는 없다 — 이 패턴에서도 주문당
     `Payment`는 여전히 1건(카드 잔액분)이다.
2. **카드+카드/카드+현금 동시분할** (오프라인 카운터 특화, 드묾)
   - 두 결제가 동시에 `PENDING`/`REQUESTED` 상태로 공존해야 하므로,
     `createPayment`의 이중결제 방지 가드를 "잔여 미납액 기준"으로 다시
     설계해야 한다(예: `RefundLock`처럼 별도 락 또는 `SELECT ... FOR UPDATE`로
     잔여 미납액 초과 방지를 트랜잭션 내에서 검증).
   - 티켓 발급 시점(성공 누적액이 총액을 채운 순간)과, 환불 시 여러 `Payment`에
     걸쳐 금액을 배분하는 로직도 새로 필요하다.

### 현재 상태

미구현, 계획 없음. `docs/architecture/환불_상품단위_추적_구조.md`의
"분할결제도 지원해야 하므로 Payment가 Order에 붙는다"는 설명은 부정확한
서술이었다 — 실제로 `Order.payments[]`(1:N)가 쓰이는 이유는 결제 재시도뿐이다.
