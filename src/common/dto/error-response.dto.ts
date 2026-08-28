export class ErrorDetail {
  code: string;
  message: string | string[];
  details?: string | any;
}

export class ErrorResponseDto {
  success: boolean;
  statusCode: number;
  error: ErrorDetail;
  timestamp: string;
  path?: string;
}
