import { Prisma } from '@prisma/client';

// 매장 + 점주 목록을 함께 조회할 때 쓰는 include 정의.
// 타입(ShopWithOwners)과 실제 쿼리가 같은 원본에서 나오므로 서로 어긋날 수 없다.
export const shopWithOwners = {
  include: { owners: true },
} satisfies Prisma.ShopDefaultArgs;
export type ShopWithOwners = Prisma.ShopGetPayload<typeof shopWithOwners>;
