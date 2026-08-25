import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { DomainUnauthorizedError } from 'src/common/errors';
import { ExistingEmailError } from './existing-user.error';
import { Role } from 'src/auth/enum/role.enum';
import { RedisService } from 'src/database/redis/redis.service';
import { RedisKeys } from 'src/database/redis/redis-keys';
import { ConfigService } from '@nestjs/config';
import { getAccessExpiresMinutes } from 'src/common/utils/jwt-config.util';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 회원 가입
   * @param email
   * @param plainPassword 평문암호
   * @param role 사용자 롤("USER" | "MANAGER" | "OWNER")
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   * @throws DomainBadRequestError 이메일 중복 시
   */
  async create(email: string, plainPassword: string, role: UserRole = 'USER') {
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) throw new ExistingEmailError(email);

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await this.userRepository.create(email, hashedPassword, role);

    const { password, ...result } = user;
    return result;
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user)
      throw new DomainUnauthorizedError(
        '이메일 또는 비밀번호가 일치하지 않습니다',
      );

    if (!user.isActive)
      throw new DomainUnauthorizedError('비활성화된 계정입니다');

    if (
      !user.password ||
      !(await bcrypt.compare(plainPassword, user.password))
    ) {
      throw new DomainUnauthorizedError(
        '이메일 또는 비밀번호가 일치하지 않습니다',
      );
    }

    return user;
  }

  async getUserById(userId: string) {
    return await this.userRepository.findById(userId);
  }

  /**
   * "모든 기기에서 로그아웃" 기능
   */
  async revokeAllSessions(
    actorUserId: string,
    role: Role,
    targetUserId: string,
  ) {
    // 일반 사용자는 본인의 세션만 초기화 가능
    if (role === Role.USER && actorUserId !== targetUserId) {
      throw new DomainUnauthorizedError('권한이 없는 작업 시도');
    }

    // OWNER는 특정 매장에 소속된 계정이라 타인의 세션을 강제 종료할 권한이 없다.
    // 매장 소속 유저에 대한 조치는 매장 단위 인가(ShopBan)로 별도 처리한다.
    if (role === Role.OWNER && actorUserId !== targetUserId) {
      throw new DomainUnauthorizedError('권한이 없는 작업 시도');
    }

    // refresh token DB 에서 사용자 토큰 제거
    await this.userRepository.deleteAllRefreshTokenByUserId(targetUserId);

    const accessExpiresMinutes = getAccessExpiresMinutes(this.configService);

    // redis에 블랙 리스트 등록
    // - SET session_revoked:{userId} {revokedAt timestamp}
    // TTL을 access 토큰 유효기간으로 두는 이유: 그 이후엔 차단 시점 이전에
    // 발급된 access 토큰이 모두 자연 만료되어 revokedAt 비교가 무의미해짐
    await this.redisService.set(
      RedisKeys.sessionRevoked(targetUserId),
      Date.now(),
      accessExpiresMinutes * 60,
    );
  }
}
