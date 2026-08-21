import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreatePeriodProductData, CreateTimeProductData } from './product.type';
import { TicketType } from '@prisma/client';
import { GetProductOutDto } from './dto';
import {
  PaginationOptions,
  PaginationResult,
} from 'src/common/pagination/pagination.types';

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async createTimeProduct(
    shopId: string,
    data: CreateTimeProductData,
  ): Promise<string> {
    // TODO: 시간권 전용 검수 비지니스 로직 추가
    return await this.repository.createProduct(shopId, data);
  }
  async createPeriodProduct(
    shopId: string,
    data: CreatePeriodProductData,
  ): Promise<string> {
    // TODO: 정기권 전용 검수 비지니스 로직 추가
    return await this.repository.createProduct(shopId, data);
  }

  async getProducts(
    shopId: string,
    paginationOptions: Required<PaginationOptions>,
    type?: TicketType,
  ): Promise<PaginationResult<GetProductOutDto>> {
    return await this.repository.getProduct(shopId, {
      paginationOptions,
      ticketType: type,
    });
  }
}
