export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string; // 토큰마다 고유한 식별자 — 로그아웃 블랙리스트 키로 사용
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh';
}

export interface JwtValidationResult {
  userId: string; // payload.sub에서 매핑 — 컨트롤러에서는 user.userId로 접근
  email: string;
  role: string;
  jti: string; // payload.jti에서 매핑 — 로그아웃 시 블랙리스트 키로 사용
  exp: number; // payload.exp에서 매핑 — 블랙리스트 TTL 계산에 사용
}
