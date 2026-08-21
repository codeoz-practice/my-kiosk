import {
  PaymentStatus,
  PaymentType,
  TicketStatus,
  TicketType,
} from '@prisma/client';

export interface PgPayload {
  success: boolean;
  pgTransactionId: string;
  amount: number;
  reason: string | null;
}

export interface PaymentOutData {
  type: PaymentType;
  status: PaymentStatus;
  price: number;
}

export interface BasePaymentData {
  userId: string;
  type: TicketType;
  status: TicketStatus;
  orderItemId: string;
}

export interface TimePaymentData extends BasePaymentData {
  purchasedMinutes: number;
  remainingMinutes: number;
  minuteExpireDeadline: Date;
}

export interface PeriodPaymentData extends BasePaymentData {
  purchasedDurationDays: number;
  activationDeadline: Date;
}
