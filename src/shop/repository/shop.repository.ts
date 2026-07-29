import { ConflictException, Injectable } from '@nestjs/common';
import { Shop } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { shopWithOwners, ShopWithOwners } from '../shop.types';

@Injectable()
export class ShopRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, ownerId: string): Promise<Shop> {
    return await this.prisma.shop.create({
      data: {
        name,
        owners: {
          create: [{ userId: ownerId }],
        },
      },
    });
  }

  async getShopDetail(id: string): Promise<ShopWithOwners> {
    return await this.prisma.shop.findUniqueOrThrow({
      where: { id },
      ...shopWithOwners,
    });
  }

  async getShop(ownerId?: string): Promise<ShopWithOwners[]> {
    return await this.prisma.shop.findMany({
      where: ownerId
        ? {
            owners: {
              some: { userId: ownerId },
            },
          }
        : undefined,
      ...shopWithOwners,
    });
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.prisma.shop.update({
      where: {
        id,
      },
      data: {
        isActive: active,
      },
    });
  }

  async deleteShop(id: string): Promise<void> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      select: {
        deletedAt: true,
      },
      where: {
        id,
      },
    });

    if (shop.deletedAt) {
      throw new ConflictException('이미 삭제 처리된 매장입니다');
    }

    await this.prisma.shop.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addOwner(shopId: string, ownerId: string): Promise<void> {
    await this.prisma.shop.update({
      where: {
        id: shopId,
      },
      data: {
        owners: {
          create: [{ userId: ownerId }],
        },
      },
    });
  }

  // 점주 삭제
  async removeOwner(shopId: string, ownerId: string) {
    await this.prisma.shopOwner.delete({
      where: {
        shopId_userId: {
          shopId,
          userId: ownerId,
        },
      },
    });
  }
}
