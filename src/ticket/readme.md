# 시간 관련 개념 정리

## 이용권

### 시간권

- 입실 → 시간이 UsageSession으로 이동해서 흐름
- 퇴실 → 남은 시간이 Ticket.remainingMinutes로 돌아옴
- 입실 중 남은 시간 = plannedEndAt - now
- 미입실 남은 시간 = Ticket.remainingMinutes

### 정기권

- 입실과 무관하게 expiresAt까지 시간이 흐름
- UsageSession은 "현재 입실 중인가"만 나타냄
- 남은 일수 = expiresAt - now

> UsageSession = 스터디카페 좌석과 같다.
> 시간권은 좌석에 앉아있는 동안만 시간이 소비되고, 정기권은 좌석과 무관하게 기간이 흐르는 구조이다.

## 정지

### 시간권

#### 정지 시작 시

- 진행 중인 UsageSession을 종료 → 남은 시간을 `Ticket.remainingMinutes`로 반환
- `TicketPause` 레코드 생성 (resumedAt = null)

#### 정지 종료 시

- `TicketPause.resumedAt` 업데이트
- 정지 기간만큼 `Ticket.minuteExpireAt` 연장
- 이용자가 다시 입실하면 새 UsageSession 생성 (정지 종료가 곧 재입실은 아님)

### 정기권

#### 정지 시작 시

- 진행 중인 UsageSession이 있다면 종료
- `TicketPause` 레코드 생성 (resumedAt = null)
- `Ticket.expiresAt` 연장은 정지 종료 시점에 처리

#### 정지 종료 시

- `TicketPause.resumedAt` 업데이트
- 정지 기간만큼 `Ticket.expiresAt` 연장
- `expiresAt = expiresAt + (resumedAt - pausedAt)`
