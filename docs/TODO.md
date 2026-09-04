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

### 현재 상태 (2026-09-05)

**구현 완료** — 미사용 자동 처리 경로에 한정. 상세 흐름은
[환불_처리_시퀀스.md](./환불_처리_시퀀스.md), 설계는
[환불_동시_진행_방지_프로세스.md](./architecture/환불_동시_진행_방지_프로세스.md) 참고.

- 락 획득/해제, 만료된 락의 PG 재조회 기반 자가 치유(TTL) — 구현됨
- 금액 정합성 검증(`calculateRefundableAmount`) — 구현됨
- PG 호출 및 미확정 처리(응답 실패 시 `REQUESTED`+락 유지, 콜백/TTL 만료로
  후속 처리) — 구현됨. 다만 원래 계획한 "동기 재시도(2~3회)"가 아니라
  실패 즉시 방치하는 방식으로 구현됨(재시도 레이어는 아직 없음)
- 사용 이력이 있는 건(점주 승인 대상)의 락 획득 — **미구현**. 승인 시점에
  걸 예정이나 승인 API 자체가 없음
- 환불 확정 시 `Ticket` 상태 갱신 — **미구현**(구조적 위험 있음, 아래 참고)
- 클라이언트 통지 경로(폴링/웹훅) — 미구현

### ⚠️ 남은 구조적 문제

`RefundService.callback()`이 환불 성공 시 `Ticket`을 전혀 갱신하지 않는다.
그 결과 이중 환불을 막는 게 사실상 `createRefundWithLock`의
`refund_amount > refundable_amount` 비교 하나뿐이다. 점주 승인 API를
구현할 때 `callback()`/`clearStaleLock()` 확정 분기에 `Ticket` 갱신을
반드시 함께 추가해야 한다. 자세한 내용은
[환불_프로세스.md §6](./architecture/환불_프로세스.md#6-티켓-상태-반영) 참고.

또한 하나의 `OrderItem`에 대해 여러 번 부분 환불이 누적될 수 있다는
현재 설계(`calculateRefundableAmount`)도 재검토 대상이다 — 이용 중인
이용권의 환불은 상품당 1회, 그 즉시 종료가 맞는 모델이라는 재정의가
있었으나 아직 코드에 반영되지 않았다.

### 참고

설계 논의 및 기각된 대안(멱등키 단독 사용, `PaymentCancelItem`에 상태
denormalize)은 Claude 메모리
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
