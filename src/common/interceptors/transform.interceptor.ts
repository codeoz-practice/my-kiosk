import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';
import { Response } from '../types/response.types';
import { map, Observable } from 'rxjs';
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<ExpressResponse>();
        const request = context.switchToHttp().getResponse<Request>();
        const statusCode = response.statusCode;

        // 이미 변환된 응답인지 확인 (success 필드가 있으면 변환된 것으로 간주)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        return {
          success: true,
          statusCode,
          data,
          timestamp: new Date().toISOString(),
          path: request.path,
        };
      })
    );
  }
}