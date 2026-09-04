import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetProductDto,
  GetProductOutDto,
  CreateProductDto,
  ProductParamDto,
} from './dto';
import { PaginationResult } from 'src/common/pagination/pagination.types';
import { PaginationUtil } from 'src/common/pagination/pagination.util';

@ApiTags('products')
@Controller('shops/:shopId/products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @ApiOperation({ summary: '상품 생성' })
  @Post()
  async createProduct(
    @Param() paramDto: ProductParamDto,
    @Body() dto: CreateProductDto,
  ) {
    const shopId = paramDto.shopId;
    if (dto.type === 'TIME') {
      return await this.service.createTimeProduct(shopId, {
        ticketType: 'TIME',
        name: dto.name,
        amount: dto.amount,
        usableDays: dto.usableDays,
        isActive: dto.isActive,
        purchasedMinutes: dto.purchasedMinutes!,
      });
    }
    return await this.service.createPeriodProduct(shopId, {
      ticketType: 'PERIOD',
      name: dto.name,
      amount: dto.amount,
      usableDays: dto.usableDays,
      isActive: dto.isActive,
      purchasedDurationDays: dto.purchasedDurationDays!,
    });
  }

  @Get()
  async getProducts(
    @Param() paramDto: ProductParamDto,
    @Query() dto: GetProductDto,
  ): Promise<PaginationResult<GetProductOutDto>> {
    return await this.service.getProducts(
      paramDto.shopId,
      PaginationUtil.normalize(dto),
      dto.type,
    );
  }
}
