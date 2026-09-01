import { Injectable } from '@nestjs/common';
import {
  PaymentCancelFailureCode,
  PaymentCancelStatus,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService, TransactionClient } from 'src/prisma/prisma.service';

@Injectable()
export class RefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    work: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.executeTransaction(work);
  }

  async getRefundLock(
    orderItemId: string,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return await client.refundLock.findFirst({
      where: {
        orderItemId,
      },
    });
  }

  async getTicketById(id: string) {
    return await this.prisma.ticket.findUnique({
      where: { id },
      select: {
        userId: true,
        orderItem: {
          select: {
            id: true,
            order: {
              select: {
                id: true,
                payments: {
                  where: {
                    status: 'SUCCESS',
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createPaymentCancel(
    amount: number,
    paymentId: string,
    requestedAt: Date,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return await client.paymentCancel.create({
      data: {
        amount,
        paymentId,
        requestedAt,
        status: PaymentCancelStatus.REQUESTED,
      },
    });
  }

  async createPaymentCancelItem(
    paymentCancelId: string,
    orderItemId: string,
    amount: number,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    await client.paymentCancelItem.create({
      data: {
        paymentCancelId,
        orderItemId,
        amount,
      },
    });
  }

  async createRefundLock(
    orderItemId: string,
    paymentCancelId: string,
    expiresAt: Date = new Date(Date.now() + 1 * 60 * 1000),
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    await client.refundLock.create({
      data: {
        orderItemId,
        paymentCancelId,
        expiresAt,
      },
    });
  }

  // 만료된 락을 PG 조회 동안 선점하기 위해 만료 시각을 연장한다.
  // updateMany + paymentCancelId 소유권 조건 - 그 사이 다른 트랜잭션이 이미
  // 이 락을 처리(삭제)했다면 대상이 없어 0건으로 조용히 끝난다(에러 없음).
  // 반환값(연장된 행 수)으로 호출부가 선점 성공 여부를 판단할 수 있다.
  async extendRefundLock(
    orderItemId: string,
    paymentCancelId: string,
    expiresAt: Date,
    client: TransactionClient | PrismaService = this.prisma,
  ): Promise<number> {
    const { count } = await client.refundLock.updateMany({
      where: {
        orderItemId,
        paymentCancelId,
      },
      data: {
        expiresAt,
      },
    });
    return count;
  }

  // 환불 가능 금액 계산
  async calculateRefundableAmount(
    orderItemId: string,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    const [refund] = await client.$queryRaw<
      {
        order_item_id: string;
        refund_amount: number;
        refund_status: string | null;
        cancelled_amount: number;
        refundable_amount: number | null;
      }[]
    >`
      SELECT
        oi.id AS order_item_id,
        oi.amount AS refund_amount, -- "결제 예정/완료 금액"
        p.status AS refund_status,
        COALESCE(cancel_sum.total_cancelled, 0)::integer AS cancelled_amount, -- 취소된 금액
        CASE
            WHEN p.status = 'SUCCESS'
            THEN (oi.amount - COALESCE(cancel_sum.total_cancelled, 0))::integer
            ELSE NULL  -- 결제가 성공하지 않았으면 "실제 남은 금액" 자체가 의미 없음
        END AS refundable_amount
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'SUCCESS'
      LEFT JOIN (
          SELECT 
              pci.order_item_id, 
              SUM(pci.amount) AS total_cancelled
          FROM payment_cancel_items pci
          JOIN payment_cancels pc ON pc.id = pci.payment_cancel_id
          WHERE pc.status = 'SUCCEEDED'
            AND pci.order_item_id = ${orderItemId} 
          GROUP BY pci.order_item_id
      ) cancel_sum ON cancel_sum.order_item_id = oi.id
      WHERE oi.id = ${orderItemId} 
    `;
    return refund;
  }

  async deleteRefundLock(
    orderItemId: string,
    paymentCancelId: string, // 본인이 처리 중이던 락이 맞는지 확인을 위해 where 절에 추가
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    // deleteMany 사용 - 소유권(paymentCancelId)이 안 맞아 대상이 없어도
    // (동시 요청이 이미 같은 락을 처리하고 지운 경우) 에러 없이 무시된다
    await client.refundLock.deleteMany({
      where: {
        orderItemId,
        paymentCancelId,
      },
    });
  }

  async deleteLock(
    orderItemId: string,
    paymentCancelId: string, // 본인이 만든 락이 맞는지 확인을 위해 where 절에 추가
  ) {
    // deleteMany 사용 - 소유권(paymentCancelId)이 안 맞아 대상이 없어도
    // (이미 재시도가 다른 paymentCancelId로 락을 점유한 경우) 에러 없이 무시된다
    await this.prisma.refundLock.deleteMany({
      where: {
        orderItemId,
        paymentCancelId,
      },
    });
  }

  async getPaymentCancelById(
    id: string,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return await client.paymentCancel.findUniqueOrThrow({
      where: { id },
    });
  }

  async succeedPaymentCancel(
    paymentCancelId: string,
    now: Date = new Date(),
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    await client.paymentCancel.update({
      where: { id: paymentCancelId },
      data: {
        status: PaymentCancelStatus.SUCCEEDED,
        cancelledAt: now,
        // 이전 실패 시도(예: PG 호출 중 타임아웃)의 흔적이 남아있을 수 있으므로 명시적으로 초기화
        failedAt: null,
        failureReason: null,
        failureCode: null,
      },
    });
  }

  async failPaymentCancel(
    paymentCancelId: string,
    reason: string,
    failureCode?: PaymentCancelFailureCode,
    now: Date = new Date(),
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    await client.paymentCancel.update({
      where: { id: paymentCancelId },
      data: {
        status: PaymentCancelStatus.FAILED,
        failedAt: now,
        failureReason: reason,
        failureCode,
      },
    });
  }

  async getRefundByShop2(
    shopId: string,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return await client.order.findMany({
      where: {
        shopId,
        payments: {
          some: {
            status: PaymentStatus.SUCCESS,
            paymentCancels: {
              some: { status: PaymentCancelStatus.SUCCEEDED },
            },
          },
        },
      },
      select: {
        id: true,
        totalAmount: true,
        payments: {
          where: {
            status: PaymentStatus.SUCCESS,
            paymentCancels: {
              some: { status: PaymentCancelStatus.SUCCEEDED },
            },
          },
          select: {
            status: true,
            id: true,
            paymentCancels: {
              where: { status: PaymentCancelStatus.SUCCEEDED },
              select: {
                id: true,
                paymentCancelItem: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // 매장별 환불 내역 조회 ticket or order_item
  async getRefundByShop(
    shopId: string,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    /**
     * 환불 금액
     * 환불 시간
     * 환불 유무
     *
     */
    return await client.$queryRaw`
      SELECT
        o.id AS order_id,
        pci.payment_cancel_id,
        pci.id AS payment_cancel_items_id,
        pci.order_item_id,
        pci.amount
      FROM
        orders o
        JOIN payments pay ON pay.order_id = o.id
        AND pay.status = 'SUCCESS'
        JOIN payment_cancels pc ON pc.payment_id = pay.id
        AND pc.status = 'SUCCEEDED'
        JOIN payment_cancel_items pci ON pci.payment_cancel_id = pc.id
      WHERE
        o.shop_id = ${shopId} 
      ORDER BY
        o.id
    `;
  }

  async getRefundHistoryByShop(
    shopId: string,
    status?: PaymentCancelStatus,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return client.paymentCancelItem.findMany({
      where: {
        paymentCancel: {
          payment: { order: { shopId } },
          status,
        },
      },
      select: {
        id: true,
        amount: true,
        orderItem: {
          select: {
            id: true,
            ticketType: true,
            product: { select: { name: true } },
            ticket: { select: { id: true, status: true } },
          },
        },
        paymentCancel: {
          select: {
            id: true,
            status: true,
            reason: true,
            requestedAt: true,
            cancelledAt: true,
            failureReason: true,
          },
        },
      },
      orderBy: { paymentCancel: { requestedAt: 'desc' } },
    });
  }

  async getRefundHistoryByUser(
    userId: string,
    status?: PaymentCancelStatus,
    client: TransactionClient | PrismaService = this.prisma,
  ) {
    return client.user.findMany({
      where: {
        id: userId,
      },
      select: {
        orders: {
          select: {
            id: true,
            orderItems: {
              select: {
                id: true,
                amount: true,
                paymentCancelItem: {
                  select: {
                    id: true,
                    amount: true,
                    paymentCancel: {
                      select: {
                        id: true,
                        status: true,
                      },
                    },
                  },
                },
                product: {
                  select: {
                    id: true,
                    name: true,
                    ticketType: true,
                    amount: true,
                  },
                },
                ticket: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
