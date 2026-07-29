import { Injectable } from '@nestjs/common';
import { ShopRepository } from './repository/shop.repository';
import { Shop } from '@prisma/client';
import { ShopWithOwners } from './shop.types';

@Injectable()
export class ShopService {
  constructor(private readonly repository: ShopRepository) {}

  async getShop(ownerId: string): Promise<ShopWithOwners[]> {
    return this.repository.getShop(ownerId);
  }

  async getShopDetail(id: string): Promise<Shop> {
    return this.repository.getShopDetail(id);
  }

  async create(name: string, ownerId: string): Promise<Shop> {
    return await this.repository.create(name, ownerId);
  }

  async setActive(shopId: string, isActive: boolean): Promise<void> {
    return await this.repository.setActive(shopId, isActive);
  }

  async deleteShop(id: string): Promise<void> {
    // TODO: 폐점 시 판매된 이용권 처리 정책 미결 — docs/TODO.md 참고
    return await this.repository.deleteShop(id);
  }

  async addOwner(shopId: string, ownerId: string): Promise<void> {
    return await this.repository.addOwner(shopId, ownerId);
  }

  async removeOwner(shopId: string, ownerId: string): Promise<void> {
    return await this.repository.removeOwner(shopId, ownerId);
  }
}
