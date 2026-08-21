import { Injectable } from '@nestjs/common';
import {
  Order,
  PaymentStatus,
  Prisma,
  TicketType,
  UsageSessionStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductNotFoundError } from './errors/product-not-found.error';
import { MissingOrderFilterError } from './errors/missing-order-filter.error';
import { OrderOutData } from './order.types';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    shopId: string,
    userId: string,
    products: { productId: string; quantity: number }[],
  ) {
    return await this.prisma.executeTransaction(async (tx) => {
      // 상품들 상세 정보 조회
      const queriedProductIds = products.map((item) => item.productId);
      const queriedProducts = await tx.product.findMany({
        where: {
          id: { in: queriedProductIds },
          isActive: true,
          deletedAt: null,
        },
      });

      // orderItems 데이터 생성
      const createOrderItems = products.reduce<
        {
          ticketType: TicketType; // 구매 시점 티켓 타입(시간권, 기간권)
          originalPrice: number; // 구매 시점 가격 스냅샷
          discountAmount: number; // 항목 할인액
          price: number; // 실결제 금액 스냅샷(originalPrice - discountAmount)
          purchasedMinutes: number | null; // 시간권: 구매 시점 분 스냅샷
          purchasedDurationDays: number | null; // 정기권: 구매 시점 기간 스냅샷
          productId: string;
          usableDays: number;
        }[]
      >((acc, product) => {
        const foundProduct = queriedProducts.find(
          (p) => p.id === product.productId,
        );
        if (!foundProduct) {
          throw new ProductNotFoundError(
            `상품을 찾을 수 없습니다: ${product.productId}`,
          );
        }

        // TODO: 나중에 할인 데이터 받아와서 추가
        const discountAmount = 0;

        for (let i = 0; i < product.quantity; i++) {
          acc.push({
            ticketType: foundProduct.ticketType,
            originalPrice: foundProduct.price,
            discountAmount: discountAmount,
            price: foundProduct.price - discountAmount,
            purchasedMinutes: foundProduct.purchasedMinutes,
            purchasedDurationDays: foundProduct.purchasedDurationDays,
            productId: foundProduct.id,
            usableDays: foundProduct.usableDays,
          });
        }
        return acc;
      }, []);

      // 주문 금액 계산
      const { originalPrice, discountAmount, totalAmount } =
        createOrderItems.reduce(
          (acc, orderItem) => {
            return {
              originalPrice: acc.originalPrice + orderItem.price,
              discountAmount: acc.discountAmount + orderItem.discountAmount,
              totalAmount:
                acc.totalAmount + orderItem.price - orderItem.discountAmount,
            };
          },
          { originalPrice: 0, discountAmount: 0, totalAmount: 0 },
        );

      // order + orderItem 데이터 생성
      return await tx.order.create({
        data: {
          shopId,
          userId,
          originalPrice,
          discountAmount,
          totalAmount,
          orderItems: { create: createOrderItems },
        },
      });
    });
  }

  async getOrder(id?: string, shopId?: string, userId?: string) {
    if (!id && !shopId && !userId) {
      throw new MissingOrderFilterError();
    }
    return await this.prisma.order.findMany({
      where: {
        ...(id && { id }),
        ...(shopId && { shopId }),
        ...(userId && { userId }),
      },
      select: {
        id: true,
        shopId: true,
        userId: true,
        originalPrice: true,
        discountAmount: true,
        totalAmount: true,
        orderItems: {
          select: {
            productId: true,
            originalPrice: true,
            discountAmount: true,
            price: true,
            purchasedMinutes: true,
            purchasedDurationDays: true,
            ticket: {
              select: {
                id: true,
                type: true,
                status: true,
                usageSessions: {
                  where: { status: UsageSessionStatus.ACTIVE },
                  select: {
                    status: true,
                    seat: { select: { number: true } },
                  },
                },
                pauses: {
                  where: { resumedAt: null },
                  select: { pausedAt: true },
                },
              },
            },
          },
        },
        payments: {
          where: { status: PaymentStatus.SUCCESS },
          select: {
            type: true,
            status: true,
            price: true,
            approvedAt: true,
          },
        },
      },
    });
  }
}
