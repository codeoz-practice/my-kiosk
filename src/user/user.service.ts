import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { DomainUnauthorizedError } from 'src/common/errors';
import { ExistingEmailError } from './existing-user.error';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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
}
