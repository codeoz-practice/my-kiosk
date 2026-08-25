import { validationSchema } from './validation.schema';

describe('validationSchema', () => {
  // 유효한 env 기본 세트 — 각 테스트에서 특정 키만 변경하여 사용
  const validEnv = {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/db',
    JWT_SECRET: 'valid-secret-key',
    JWT_REFRESH_SECRET: 'valid-refresh-secret',
  };

  describe('유효한 환경변수', () => {
    it('필수 환경변수가 모두 제공되면 검증을 통과한다', () => {
      const { error } = validationSchema.validate(validEnv, {
        abortEarly: false,
      });
      expect(error).toBeUndefined();
    });

    it('PORT 미설정 시 기본값 3000으로 통과한다', () => {
      const { error, value } = validationSchema.validate(
        { ...validEnv, PORT: undefined },
        { abortEarly: false, allowUnknown: true },
      );
      expect(error).toBeUndefined();
      expect(value.PORT).toBe(3000);
    });

    it('REDIS_HOST 미설정 시 기본값 localhost로 통과한다', () => {
      const { error, value } = validationSchema.validate(
        { ...validEnv, REDIS_HOST: undefined },
        { abortEarly: false, allowUnknown: true },
      );
      expect(error).toBeUndefined();
      expect(value.REDIS_HOST).toBe('localhost');
    });

    it('REDIS_PASSWORD 빈 문자열은 통과한다', () => {
      const { error } = validationSchema.validate(
        { ...validEnv, REDIS_PASSWORD: '' },
        { abortEarly: false },
      );
      expect(error).toBeUndefined();
    });
  });

  describe('필수 환경변수 누락', () => {
    it('DATABASE_URL 누락 시 오류를 반환한다', () => {
      const { error } = validationSchema.validate(
        { ...validEnv, DATABASE_URL: undefined },
        { abortEarly: false },
      );
      expect(error).toBeDefined();
      expect(
        error?.details.some((d) => d.path.includes('DATABASE_URL')),
      ).toBe(true);
    });

    it('JWT_SECRET 누락 시 오류를 반환한다', () => {
      const { error } = validationSchema.validate(
        { ...validEnv, JWT_SECRET: undefined },
        { abortEarly: false },
      );
      expect(error).toBeDefined();
      expect(error?.details.some((d) => d.path.includes('JWT_SECRET'))).toBe(
        true,
      );
    });

    it('여러 필수값 누락 시 모든 오류를 한 번에 반환한다 (abortEarly: false)', () => {
      const { error } = validationSchema.validate(
        {
          ...validEnv,
          DATABASE_URL: undefined,
          JWT_SECRET: undefined,
          JWT_REFRESH_SECRET: undefined,
        },
        { abortEarly: false },
      );
      expect(error?.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('제약 조건 검증', () => {
    it('허용되지 않는 NODE_ENV 값은 거부한다', () => {
      const { error } = validationSchema.validate(
        { ...validEnv, NODE_ENV: 'staging' },
        { abortEarly: false },
      );
      expect(error).toBeDefined();
    });

    it.each(['development', 'production', 'test'])(
      'NODE_ENV=%s는 통과한다',
      (nodeEnv) => {
        const { error } = validationSchema.validate(
          { ...validEnv, NODE_ENV: nodeEnv },
          { abortEarly: false },
        );
        expect(error).toBeUndefined();
      },
    );
  });
});
