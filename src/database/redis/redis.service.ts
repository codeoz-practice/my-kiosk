import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Redis 서비스
 * 캐싱, 세션 관리, 토큰 블랙리스트 등 Redis 기반 기능에 사용
 */
@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * JSON 파싱 유틸리티
   * JSON 파싱 성공 시 파싱된 값, 실패 시 원본 문자열을 반환
   */
  private parseValue<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  // ===== 기본 Key-Value 작업 =====

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, stringValue);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    // !value 금지: 빈 문자열 '' 도 null로 처리되어 데이터 손실 발생
    if (value === null || value === undefined) return null;
    return this.parseValue<T>(value);
  }

  /**
   * @returns 키가 존재하여 삭제되면 true, 없으면 false
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * @returns TTL(초), 키 없으면 -2, TTL 없으면 -1
   */
  async getTTL(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  // ===== 카운터 작업 =====

  /**
   * 값 1 증가 (원자적 연산)
   * 키가 없으면 0에서 시작
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * 값 1 감소 (원자적 연산)
   */
  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  /**
   * TTL 설정 (기존 값 유지, 만료 시간만 갱신)
   * @param ttlSeconds 만료 시간 (초)
   * @returns TTL 설정 성공 여부
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, ttlSeconds);
    return result === 1;
  }

  // ===== Hash 작업 (객체 저장용) =====

  async hset(key: string, field: string, value: any): Promise<number> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.redis.hset(key, field, stringValue);
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.redis.hget(key, field);
    if (value === null || value === undefined) return null;
    return this.parseValue<T>(value);
  }

  async hgetall<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.hgetall(key);
    if (!value || Object.keys(value).length === 0) return null;
    const parsed: any = {};
    for (const [field, val] of Object.entries(value)) {
      parsed[field] = this.parseValue(val);
    }
    return parsed as T;
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.redis.hdel(key, field);
  }

  // ===== List 작업 (큐/스택용) =====

  /**
   * List 앞에 추가 (Left Push)
   * lpop()과 함께 사용하면 LIFO 스택, rpop()과 사용하면 FIFO 큐
   */
  async lpush(key: string, value: any): Promise<number> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.redis.lpush(key, stringValue);
  }

  async lpop<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.lpop(key);
    if (value === null || value === undefined) return null;
    return this.parseValue<T>(value);
  }

  /**
   * List 뒤에서 제거 후 반환 (Right Pop)
   * lpush + rpop 조합으로 FIFO 큐 구현
   */
  async rpop<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.rpop(key);
    if (value === null || value === undefined) return null;
    return this.parseValue<T>(value);
  }

  async lrange<T = any>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    const values = await this.redis.lrange(key, start, stop);
    return values.map((value) => this.parseValue<T>(value));
  }

  /**
   * List 크기를 N개로 유지 (오래된 항목 자동 제거)
   * @param start 유지할 시작 인덱스 (보통 0)
   * @param stop  유지할 끝 인덱스 (보통 maxSize - 1)
   */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.redis.ltrim(key, start, stop);
  }

  // ===== Set 작업 (중복 없는 집합) =====

  async sadd(key: string, ...members: any[]): Promise<number> {
    const stringMembers = members.map((m) =>
      typeof m === 'string' ? m : JSON.stringify(m),
    );
    return this.redis.sadd(key, ...stringMembers);
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    const members = await this.redis.smembers(key);
    return members.map((m) => this.parseValue<T>(m));
  }

  async srem(key: string, member: any): Promise<number> {
    const stringMember =
      typeof member === 'string' ? member : JSON.stringify(member);
    return this.redis.srem(key, stringMember);
  }

  /**
   * Set에 특정 멤버가 존재하는지 확인 (O(1))
   * smembers + includes 대신 사용 — 멤버 수에 무관하게 일정 성능
   * @returns 멤버 존재 시 true
   */
  async sismember(key: string, member: any): Promise<boolean> {
    const stringMember =
      typeof member === 'string' ? member : JSON.stringify(member);
    const result = await this.redis.sismember(key, stringMember);
    return result === 1;
  }

  // ===== 유틸리티 =====

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  /**
   * 모든 키 삭제 (주의: 테스트 환경 전용!)
   */
  async flushall(): Promise<string> {
    return this.redis.flushall();
  }
}
