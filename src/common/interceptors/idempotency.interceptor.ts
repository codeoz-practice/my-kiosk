import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, Observable, of, tap } from 'rxjs';
import { DomainConflictError } from 'src/common/errors';
import { RedisKeys } from 'src/database/redis/redis-keys';
import { RedisService } from 'src/database/redis/redis.service';

interface IdempotencyRecord {
  status: 'PROCESSING' | 'COMPLETED';
  body?: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { userId: string } }>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const idempotencyKey = request.headers['idempotency-key'];
    //FIXME: 헤더 없으면 멱등성 검사 없이 그대로 통과
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return next.handle();
    }

    const userId = request.user?.userId;
    if (!userId) {
      // 인증 가드보다 먼저 실행되는 상황은 없어야 하지만, 방어적으로 통과
      return next.handle();
    }

    const redisKey = RedisKeys.idempotencyKey(userId, idempotencyKey);
    const existing = await this.redisService.get<IdempotencyRecord>(redisKey);

    if (existing?.status === 'COMPLETED') {
      // 이전 성공 응답을 그대로 재방출 - PG/DB 재호출 없음
      return of(existing.body);
    }

    if (existing?.status === 'PROCESSING') {
      throw new DomainConflictError('이미 처리 중인 요청입니다');
    }

    const ttl = this.configService.get<number>('idempotency.keyTtlSeconds')!;

    // 키 선점 시도 (원자적) -동시에 여러 요청이 들어와도 하나만 성공한다
    const acquired = await this.redisService.setIfNotExists(
      redisKey,
      { status: 'PROCESSING' } satisfies IdempotencyRecord,
      ttl,
    );
    if (!acquired) {
      throw new DomainConflictError('이미 처리 중인 요청입니다');
    }

    return next.handle().pipe(
      tap((body) => {
        // 성공한 경우에만 결과를 COMPLETED로 덮어써 캐싱한다
        void this.redisService.set(
          redisKey,
          { status: 'COMPLETED', body } satisfies IdempotencyRecord,
          ttl,
        );
      }),
      catchError((error: unknown) => {
        // 실패는 캐싱하지 않는다 - 선점해둔 PROCESSING 키를 정리해 재시도를 허용한다
        void this.redisService.delete(redisKey);
        throw error;
      }),
    );
  }
}
