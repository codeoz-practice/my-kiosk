export const RedisKeys = {
  sessionRevoked: (userId: string) => `session_revoked:${userId}`,
  idempotencyKey: (userId: string, key: string) =>
    `idempotency:${userId}:${key}`,
} as const;
