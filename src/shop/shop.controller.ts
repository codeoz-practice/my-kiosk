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
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('shops')
@Controller('shops')
export class ShopController {
  constructor(private readonly service: ShopService) {}

  @ApiOperation({ summary: '매장 생성' })
  @Post()
  async create(@Body() createShopDto: CreateShopDto): Promise<Shop> {
    return this.service.create(createShopDto.name, createShopDto.ownerId);
  }

  @ApiOperation({ summary: '매장 조회' })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    type: String,
    description: '점주 아이디',
    example: 'be5588fb-ee29-47c3-8582-062bb3ab365c',
  })
  @Get()
  async getShops(
    @Query('ownerId') ownerId?: string,
  ): Promise<ShopWithOwners[]> {
    return this.service.getShop(ownerId);
  }

  @ApiOperation({ summary: '매장 상세' })
  @Get(':shopId/details')
  async getShop(@Param('shopId') shopId: string): Promise<Shop> {
    return this.service.getShopDetail(shopId);
  }

  @ApiOperation({ summary: '점주 추가' })
  @ApiBody({ type: AddOwnersDto })
  @Post(':shopId/owners')
  async addOwner(
    @Param('shopId') shopId: string,
    @Body() { ownerId }: AddOwnersDto,
  ): Promise<void> {
    return await this.service.addOwner(shopId, ownerId);
  }

  @ApiOperation({ summary: '점주 삭제' })
  @Delete(':id/owners/:userId')
  async removeOwner(
    @Param('id') shopId: string,
    @Param('userId') userId: string,
  ) {
    return await this.service.removeOwner(shopId, userId);
  }

  @ApiOperation({ summary: '매장 활성화 설정' })
  @ApiBody({ type: SetActiveShopDto })
  @Patch(':id/active')
  async setActive(
    @Param('id') shopId: string,
    @Body() setActiveShopDto: SetActiveShopDto,
  ): Promise<void> {
    return await this.service.setActive(shopId, setActiveShopDto.isActive);
  }

  @ApiOperation({ summary: '매장 삭제(소프트 삭제)' })
  @Delete(':id')
  async deleteShop(@Param('id') id: string): Promise<void> {
    return await this.service.deleteShop(id);
  }
}
