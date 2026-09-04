import { Injectable } from '@nestjs/common';
import { PaymentStatus, PaymentType, Prisma, VanType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DuplicatePaymentRequestError,
  PaymentRequesterMismatchError,
} from './errors';
import { PeriodPaymentData, TimePaymentData } from './payment.types';
import { PaymentUpdateError } from './errors/payment-update.error';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(
    orderId: string,
    requesterId: string,
    van: VanType,
    now: Date,
  ) {
    return this.prisma.executeTransaction(async (tx) => {
      // 주문 정보 가져오기
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { totalAmount: true, userId: true },
      });

      // 주문자와 요청자 아이디가 같은지 확인
      if (order.userId !== requesterId) {
        throw new PaymentRequesterMismatchError(orderId);
      }

      // 이중 결재 요청 제한
      const payment = await tx.payment.findMany({
        where: {
          orderId,
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.REQUESTED,
              PaymentStatus.SUCCESS,
            ],
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (payment.length > 0) {
        throw new DuplicatePaymentRequestError(orderId);
      }

      return await tx.payment.create({
        data: {
          type: PaymentType.CARD,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount,
          orderId,
          van,
          requestedAt: now,
        },
      });
    });
  }

  async requestedPayment(paymentId: string, pgTransactionId: string) {
    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REQUESTED,
        pgTransactionId,
      },
    });
  }

  async failedPayment(paymentId: string, reason: string) {
    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, reason },
    });
  }

  async successPayment(
    paymentId: string,
    ticketsData: (TimePaymentData | PeriodPaymentData)[],
    now: Date,
  ) {
    return this.prisma.executeTransaction(async (tx) => {
      try {
        await tx.payment.update({
          where: { id: paymentId, status: PaymentStatus.REQUESTED },
          data: { status: PaymentStatus.SUCCESS, approvedAt: now },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new PaymentUpdateError(paymentId);
        }
        throw error;
      }

      const createTickets = await tx.ticket.createMany({
        data: ticketsData,
      });
      if (createTickets.count !== ticketsData.length) {
        throw new PaymentUpdateError(paymentId);
      }
    });
  }

  async updatePayment(
    pgTransactionId: string,
    data: {
      status: PaymentStatus;
      approvedAt?: Date;
      cancelledAt?: Date;
      reason?: string;
    },
  ) {
    await this.prisma.payment.update({
      where: {
        pgTransactionId,
      },
      data,
    });
  }

  async getPaymentById(paymentId: string) {
    return await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });
  }

  async getPaymentByPgTransactionId(pgTransactionId: string) {
    return await this.prisma.payment.findUnique({
      where: { pgTransactionId },
      select: {
        id: true,
        amount: true,
        status: true,
        order: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }
}
