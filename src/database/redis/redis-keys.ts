export const RedisKeys = {
  sessionRevoked: (userId: string) => `session_revoked:${userId}`,
} as const;