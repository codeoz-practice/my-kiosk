# Command/Query 분리 구조를 쓰는 이유

`src/ledger/`는 다른 도메인(`order`, `payment`, `ticket` 등)과 달리
`xxx.service.ts` 하나가 아니라 `command/`, `query/` 두 하위 폴더로
나뉘어 있다.

```
src/ledger/
  ledger.module.ts
  ledger.controller.ts
  command/
    ledger-command.service.ts   ← 상태를 바꾸는 로직 (정산 처리)
    dto/settle-ledger.dto.ts
  query/
    ledger-query.service.ts     ← 조회만 하는 로직 (대시보드 집계)
    dto/seller-dashboard.dto.ts
```

## 왜 나눴는가

**"상태를 바꾸는 로직"과 "여러 데이터를 조합해서 보여주기만 하는 로직"은
성격이 다르고, 서로 다른 이유로 복잡해진다.**

- `LedgerCommandService.settle()`은 정산이라는 **하나의 비즈니스 규칙**을
  실행한다. 이미 정산된 건 재시도로 간주해 성공 처리하는 등, 상태 전이
  자체에 도메인 규칙이 붙는다. 이런 로직은 트랜잭션 경계, 동시성, 실패
  처리에 신경 써야 한다.
- `LedgerQueryService.getSellerDashboard()`는 상태를 바꾸지 않는다.
  여러 `Ledger` 레코드를 모아 화면이 원하는 모양(합계, 카테고리별 집계
  등)으로 가공할 뿐이다. 이런 로직은 도메인 규칙보다 "화면이 뭘
  필요로 하는가"에 좌우된다.

이 둘을 하나의 `LedgerService`에 몰아넣으면, 시간이 지날수록 "정산
로직을 고치려는 사람"과 "대시보드 집계를 고치려는 사람"이 같은 파일을
건드리게 되고, 파일이 두 가지 다른 이유로 계속 비대해진다. 미리
분리해두면 각자 독립적으로 성장할 수 있다.

## 왜 `command`/`query` 각각 `PrismaService`를 직접 참조하는가

다른 도메인은 보통 `Controller → Service → Repository → PrismaService`
계층을 따르지만, `Query` 쪽은 `Repository`를 거치지 않고
`PrismaService`를 바로 사용한다.

```ts
// ledger-query.service.ts
constructor(private readonly prisma: PrismaService) {}
```

조회 로직은 특정 도메인 하나의 데이터만 다루는 게 아니라, 화면이
필요로 하는 대로 여러 테이블을 자유롭게 조합해야 하는 경우가 많다.
이걸 다른 도메인의 `Repository`/`Service`를 거쳐서 하려고 하면,
도메인 간 참조 방향이 꼬이기 쉽다. 실제로 `order` 도메인에서
"주문 조회 시 결제 내역도 함께 보여주고 싶다"는 요구가 생겼을 때,
`OrderService`가 `PaymentService`를 참조하려다가 `PaymentService`가
이미 `OrderRepository`를 참조하고 있어 **순환 의존**이 발생하는
문제를 겪었다.

Query 서비스가 `PrismaService`를 직접 쓰면, 어떤 도메인의 Service도
거치지 않으므로 이런 순환이 애초에 성립하지 않는다. 대신 "이 조회가
정확히 어떤 데이터를 가져오는지"는 코드(select 절)만 보고 알 수 있게
된다.

## 언제 이 패턴을 따라야 하는가

**모든 도메인에 기계적으로 적용하지 않는다.** CQRS는 프로젝트 전체에
일괄 적용하는 아키텍처 레이어가 아니라, 특정 도메인이 아래 증상을
보일 때만 쓰는 국소적 처방이다. 조회가 단순하고(자기 테이블 위주)
상태 변경 로직과 얽히지 않는 도메인(`shop`, `seat`, `product` 등)은
지금처럼 `xxx.service.ts` 하나로 충분하며, 억지로 `command/`,
`query/` 폴더를 나누면 파일만 늘고 실익이 없는 과설계가 된다.

아래 조건에 해당할 때만 이 구조를 고려한다.

- 조회 로직이 여러 도메인의 데이터를 조합해야 해서, 특정 도메인
  하나의 `Repository`에 자연스럽게 속하기 어려울 때
- 조회를 위해 다른 도메인 Service를 참조하면 순환 의존이 생기거나
  생길 가능성이 있을 때
- "상태를 바꾸는 로직"과 "보여주기 위한 집계 로직"이 서로 다른
  이유로 자주 바뀌어서, 하나의 서비스 파일에 두면 변경 이유가
  뒤섞일 때

지금은 `ledger` 도메인만 이 구조를 쓰고 있다. `order`처럼 여러
도메인을 조합해 조회해야 하는 케이스(주문+결제+티켓 조합 조회)가
실제로 순환 의존 문제를 일으켰으므로, 다음 후보로 검토 중이다.
케이스가 늘어나면 그 도메인에도 같은 구조
(`src/order/command/`, `src/order/query/`)를 적용하는 걸 고려한다.
