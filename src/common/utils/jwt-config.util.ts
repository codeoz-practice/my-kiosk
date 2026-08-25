import { ConfigService } from '@nestjs/config';
import { assertDefined } from './assert.util';

/**
 * access token 만료 시간(분)을 설정(jwt.accessExpiresMinutes)에서 읽는다.
 * @throws 환경변수가 설정되지 않은 경우
 */
export function getAccessExpiresMinutes(configService: ConfigService): number {
  const accessExpiresMinutes = configService.get<number>(
    'jwt.accessExpiresMinutes',
  );
  assertDefined(accessExpiresMinutes, 'access token 만료일 미설정');
  return accessExpiresMinutes;
}

/**
 * refresh token 만료일(jwt.refreshExpiresDays) 기준으로
 * 현재 시각에서 N일 후의 만료 시각을 계산한다.
 */
export function getRefreshTokenExpiresIn(configService: ConfigService): Date {
  const refreshExpiresDays = configService.get<number>(
    'jwt.refreshExpiresDays',
  );
  assertDefined(refreshExpiresDays, 'refresh token 만료일 미설정');

  return new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);
}
