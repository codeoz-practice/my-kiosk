지금까지 공부내용을 실제 적용해 보자.

# db
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL, -- '10시간정액권', '1개월정기권' 등
  total_minutes INT, -- 시간권일 때만 사용
)
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_type VARCHAR(30) NOT NULL, -- '10시간정액권', '1개월정기권' 등
  remaining_minutes INT NOT NULL, -- 🔥 이게 유일한 '잔여 시간' 원천
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXHAUSTED, EXPIRED
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

## 매장
- shopId
- seatId
- createAt
## 이용권
- ticketTemplateId
- amount
- 유효기간
- 사용쿠폰
## 발행된 이용권
- ticketId
- type: time(시간권), day(기간권)
- 유효기간
- userId
- shopId
- updateAt
- createAt
## 쿠폰
- couponTemplateId
- 유효기간
- updateAt
- createAt
## 발행된 쿠폰
- couponId
- shopId
- userId?
- isUsed: boolean

## 좌석
- seatId
- isUsed
- userId
- updateAt
## 사용자
- userId
- ticketId
- couponId
- createAt

# 좌석
- 좌석은 매장별로 존재하고 동시간에 사람에게만 선점된다.

# 이용권 구조 정의

## 이용권의 종류
- 시간권: 1시간, 2시간, ..., n시간 (나누어서 사용 가능)
- 기간권: 1일권, 2일권, ..., n일 (활성 후 멈춤 안됨. 단, 관리자는 멈출 수 있음)
- 포인트는 유효기간이 존재한다.

## 이용권의 관리
- 시간권, 기간권은 각각 독립된 객체(티켓) 단위로 관리
- 추가로 결제한 이용권: 구매 순서와 상관없이 '보관함'에 보관 (차감 안 됨)
- 다음 입실 시: 보관함의 이용권 중 사용자가 직접 하나를 골라서 입실

## 쿠폰
- 쿠폰을 통해 시간권, 기간권을 구매 할수 있다.
- 쿠폰을 통해 시간권, 구매권을 구매 시 할인을 받을 수 있다.
- 쿠폰은 유효기간이 존재한다.

## 이용권 구입 프로세스
- 카드 결제를 통해 구매
- 쿠폰을 통해 시간권, 기간권을 구매할 수 있다.

### 포인트 할인
- 쿠폰을 통해 할인 받을 수 있다.
- 결제 금액에 따라 할인 받을 수 있다.

## 차감 프로세스
- 입장 시 이용권을 선택 후 입장한다.
- 기간권은 한번 활성화 하면 중간에 멈추지 않는다.
- 시간권은 나누어 사용 가능하다.
- 유효기간이 만료된 이용권은 사용이 만료된다. (만료 시점은 매장이 정산하는 시간과 동일하다.)

## 동시 사용 가능 유무
- 시간권과 기간권은 동시에 사용 가능하다.
- 기간권과 기간권의 동시에 사용 가능하다.
- 시간권과 시간권의 동시에 사용 가능하다.
- 활성화된 이용권 별로 포인트가 차감되는 구조

## 정산
- 일일 정산 방식(당일 결재된 모든 금액을 정산 금액에 포함)
- 10시간권을 만원에 구매 후 5시간 만 사용해도 정산 시는 만원으로 집계

# 이용권 사용 프로세스

## 1. 이용권 구매
1. 사용자 로그인(전화번호, 비밀번호)
2. 이용권 선택
3. 구매 진행

## 2. 입실
1. 구매한 이용권 선택
2. 좌석 선택
3. 입실 확인

## 3. 퇴실
1. 퇴실 선택
2. 좌석 선택(옵션)
3. 퇴실 확인

## 4. 재입실
1. 구매한 이용권 선택
2. 좌석 선택
3. 입실 확인


## 이용권 만료
- 입장 시 bullmq에 이용권 등록 
- bullmq에서 이용권이 만료이벤트를 받으면 만료처리
- 만료 시 좌석도 공석처리

## 연장
- 시간권 + 시간권: 