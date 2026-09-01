// PG 거래조회 결과 - 락 만료 후 재시도 시, 이전 취소 요청의 실제 처리 상태를 확인하기 위해 사용
export enum PgCancelInquiryResult {
  NOT_FOUND = 'NOT_FOUND', // PG에 해당 취소 거래 없음(요청이 PG에 도달하지 않음)
  SUCCEEDED = 'SUCCEEDED', // PG가 취소를 성공 처리함
  FAILED = 'FAILED', // PG가 취소를 실패 처리함
}

export interface PgCancelInquiry {
  result: PgCancelInquiryResult;
  pgTransactionId?: string;
  cancelledAmount?: number;
}
