import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePeriodProductData, CreateTimeProductData } from './product.type';
import { TicketType } from '@prisma/client';
import { GetProductOutDto } from './dto';
import { PaginationUtil } from 'src/common/pagination/pagination.util';
import {
  PaginationOptions,
  PaginationResult,
} from 'src/common/pagination/pagination.types';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(
    shopId: string,
    data: CreatePeriodProductData | CreateTimeProductData,
  ): Promise<string> {
    const product = await this.prisma.product.create({
      data: {
        shop: { connect: { id: shopId } },
        name: data.name,
        ticketType: data.ticketType,
        amount: data.amount,
        usableDays: data.usableDays,
        isActive: data.isActive,
        purchasedMinutes:
          data.ticketType === 'TIME' ? data.purchasedMinutes : undefined,
        purchasedDurationDays:
          data.ticketType === 'PERIOD' ? data.purchasedDurationDays : undefined,
      },
    });
    return product.id;
  }

  async getProduct(
    shopId: string,
    options: {
      ticketType?: TicketType;
      paginationOptions: Required<PaginationOptions>;
    },
  ): Promise<PaginationResult<GetProductOutDto>> {
    const { page, limit, sortBy, sortOrder } = options.paginationOptions;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { shopId, ticketType: options.ticketType },
        select: {
          id: true,
          name: true,
          ticketType: true,
          amount: true,
          purchasedMinutes: true,
          purchasedDurationDays: true,
          usableDays: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [{ [sortBy]: sortOrder }],
        skip,
        take: limit,
      }),
      this.prisma.product.count(),
    ]);
    const meta = PaginationUtil.createMeta(page, limit, total);

    return { items, meta };
  }
}
