import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { Shop } from '@prisma/client';
import { SetActiveShopDto } from './dto/set-active-shop.dto';
import { AddOwnersDto } from './dto/add-owners.dto';
import { ShopWithOwners } from './shop.types';

@Controller('shop')
export class ShopController {
  constructor(private readonly service: ShopService) {}

  // 매장 생성
  @Post()
  async create(@Body() createShopDto: CreateShopDto): Promise<Shop> {
    return this.service.create(createShopDto.name, createShopDto.ownerId);
  }

  // 매장 조회
  @Get()
  async getShops(@Query('ownerId') ownerId: string): Promise<ShopWithOwners[]> {
    return this.service.getShop(ownerId);
  }

  // 매장 상세
  @Get(':shopId/details')
  async getShop(@Param('shopId') shopId: string): Promise<Shop> {
    return this.service.getShopDetail(shopId);
  }

  // 점주 추가
  @Post(':shopId/owner')
  async addOwner(
    @Param('shopId') shopId: string,
    @Body() { ownerId }: AddOwnersDto,
  ): Promise<void> {
    return await this.service.addOwner(shopId, ownerId);
  }

  // 점주 삭제
  @Delete(':id/owner/:userId')
  async removeOwner(
    @Param('id') shopId: string,
    @Param('userId') userId: string,
  ) {
    return await this.service.removeOwner(shopId, userId);
  }

  // 매장 활성화 설정
  @Patch(':id/active')
  async setActive(
    @Param('id') shopId: string,
    @Body() setActiveShopDto: SetActiveShopDto,
  ): Promise<void> {
    return await this.service.setActive(shopId, setActiveShopDto.isActive);
  }

  // 매장 삭제(소프트 삭제)
  @Delete(':id')
  async deleteShop(@Param('id') id: string): Promise<void> {
    return await this.service.deleteShop(id);
  }
}
