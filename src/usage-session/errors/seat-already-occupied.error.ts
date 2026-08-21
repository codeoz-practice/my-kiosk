import { DomainConflictError } from 'src/common/errors/domain-conflict.error';

export class SeatAlreadyOccupiedError extends DomainConflictError {
  constructor(readonly seatId: string) {
    super(`이미 사용 중인 좌석입니다: ${seatId}`);
    this.name = 'SeatAlreadyOccupiedError';
  }
}
