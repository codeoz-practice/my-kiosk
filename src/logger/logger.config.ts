import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

/**
 * 민감정보 마스킹 함수
 * 로그에서 비밀번호, 카드번호, 이메일, 전화번호 등을 자동으로 마스킹
 */
const maskSensitiveData = winston.format((info) => {
  const message = JSON.stringify(info);

  info.message = message
    .replace(/"password":\s*"[^"]*"/g, '"password": "****"')
    .replace(/"passwordHash":\s*"[^"]*"/g, '"passwordHash": "****"')
    .replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, '****-****-****-****')
    .replace(/([a-zA-Z0-9._-]+)@/g, '***@')
    .replace(/\d{3}[-\s]?\d{3,4}[-\s]?\d{4}/g, '***-****-****');

  return info;
});

/**
 * 거래 로그만 통과 (TransactionLogger 컨텍스트만)
 */
const transactionOnly = winston.format((info) => {
  return info.context === 'TransactionLogger' ? info : false;
});

/**
 * 거래 로그 제외 (TransactionLogger 컨텍스트 필터링)
 */
const excludeTransaction = winston.format((info) => {
  return info.context !== 'TransactionLogger' ? info : false;
});

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Winston 로거 설정
 *
 * 공통 (환경 무관):
 *   - error.log / combined.log: TransactionLogger 로그 제외
 *   - transaction.log: TransactionLogger 로그만 포함
 *
 * 개발 환경:
 *   - 콘솔: debug 레벨 (전체 출력)
 *   - debug.log: debug 레벨, TransactionLogger 제외 (개발 환경만 생성)
 *
 * 프로덕션 환경:
 *   - 콘솔: info 레벨만 출력
 */
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // 콘솔 출력 (NestJS 스타일)
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('KioskAPI', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // 에러 로그 파일
    new DailyRotateFile({
      level: 'error',
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        excludeTransaction(),
        maskSensitiveData(),
        winston.format.json(),
      ),
    }),

    // 전체 로그 파일
    new DailyRotateFile({
      level: 'info',
      dirname: 'logs',
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        excludeTransaction(),
        maskSensitiveData(),
        winston.format.json(),
      ),
    }),

    // 거래 로그 파일 (전자상거래법 준수 - 30일 보관)
    new DailyRotateFile({
      level: 'info',
      dirname: 'logs/transactions',
      filename: 'transaction-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        transactionOnly(),
        winston.format.json(),
      ),
    }),

    // 디버그 로그 (개발 환경만)
    ...(isDevelopment
      ? [
          new DailyRotateFile({
            level: 'debug',
            dirname: 'logs',
            filename: 'debug-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '3d',
            format: winston.format.combine(
              winston.format.timestamp(),
              excludeTransaction(),
              winston.format.json(),
            ),
          }),
        ]
      : []),
  ],

  // 미처리 예외 → 파일 저장
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],

  // 미처리 Promise rejection → 파일 저장
  rejectionHandlers: [
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
};
