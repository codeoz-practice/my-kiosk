/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { type App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  TicketStatus,
  TicketType,
  SeatStatus,
  UsageSessionStatus,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';

describe('TicketPauseController (E2E)', () => {
  let app: INestApplication;
  let server: App;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // 테스트 엔티티 ID 추적 (정리용)
  let ownerUser: { id: string; email: string };
  let normalUser: { id: string; email: string };
  let shop: { id: string };
  let seat: { id: string };
  let product: { id: string };

  let ownerToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // main.ts와 동일하게 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    server = app.getHttpServer();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // 테스트 사용자 생성 (OWNER + USER)
    ownerUser = await prisma.user.create({
      data: {
        email: `e2e-owner-${Date.now()}@test.com`,
        role: UserRole.OWNER,
        password: 'hashed',
      },
    });
    normalUser = await prisma.user.create({
      data: {
        email: `e2e-user-${Date.now()}@test.com`,
        role: UserRole.USER,
        password: 'hashed',
      },
    });

    ownerToken = jwtService.sign({
      sub: ownerUser.id,
      email: ownerUser.email,
      role: 'OWNER',
      type: 'access',
      jti: randomUUID(),
    });
    userToken = jwtService.sign({
      sub: normalUser.id,
      email: normalUser.email,
      role: 'USER',
      type: 'access',
      jti: randomUUID(),
    });

    // 매장 + 좌석 + 상품 생성
    shop = await prisma.shop.create({
      data: { name: `E2E정지테스트매장-${Date.now()}` },
    });
    await prisma.shopOwner.create({
      data: { shopId: shop.id, userId: ownerUser.id },
    });
    seat = await prisma.seat.create({
      data: { number: 1, shopId: shop.id, status: SeatStatus.AVAILABLE },
    });
    product = await prisma.product.create({
      data: {
        name: `E2E시간권상품-${Date.now()}`,
        ticketType: TicketType.TIME,
        amount: 10000,
        shopId: shop.id,
        usableDays: 30,
        purchasedMinutes: 120,
      },
    });
  });

  afterAll(async () => {
    // 역순 정리 (FK 제약 충돌 방지)
    await prisma.ticketPause.deleteMany({
      where: { ticket: { user: { id: ownerUser.id } } },
    });
    await prisma.usageSession.deleteMany({
      where: { userId: { in: [ownerUser.id, normalUser.id] } },
    });
    await prisma.ticket.deleteMany({
      where: { userId: { in: [ownerUser.id, normalUser.id] } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { userId: { in: [ownerUser.id, normalUser.id] } } },
    });
    await prisma.order.deleteMany({
      where: { userId: { in: [ownerUser.id, normalUser.id] } },
    });
    await prisma.product.deleteMany({ where: { shopId: shop.id } });
    await prisma.seat.deleteMany({ where: { shopId: shop.id } });
    await prisma.shopOwner.deleteMany({ where: { shopId: shop.id } });
    await prisma.shop.delete({ where: { id: shop.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUser.id, normalUser.id] } },
    });

    await prisma.$disconnect();
    await app.close();
  });

  // ── 헬퍼 함수 ──────────────────────────────────

  /**
   * ACTIVE 시간권 + 관련 Order/OrderItem 생성
   */
  async function createActiveTimeTicket(
    remainingMinutes = 120,
  ): Promise<string> {
    const order = await prisma.order.create({
      data: {
        shopId: shop.id,
        userId: ownerUser.id,
        originalAmount: 10000,
        discountAmount: 0,
        totalAmount: 10000,
      },
    });
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        ticketType: TicketType.TIME,
        originalAmount: 10000,
        discountAmount: 0,
        amount: 10000,
        purchasedMinutes: 120,
        usableDays: 30,
      },
    });
    const ticket = await prisma.ticket.create({
      data: {
        userId: ownerUser.id,
        type: TicketType.TIME,
        status: TicketStatus.ACTIVE,
        orderItemId: orderItem.id,
        purchasedMinutes: 120,
        remainingMinutes,
        minuteExpireDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return ticket.id;
  }

  /**
   * 티켓에 활성 세션 생성
   */
  async function createActiveSession(ticketId: string): Promise<string> {
    const session = await prisma.usageSession.create({
      data: {
        ticketId,
        shopId: shop.id,
        seatId: seat.id,
        userId: ownerUser.id,
        startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30분 전 시작
        plannedEndAt: new Date(Date.now() + 90 * 60 * 1000),
        status: UsageSessionStatus.ACTIVE,
      },
    });
    return session.id;
  }

  // ── PATCH /tickets/:ticketId/pause ─────────────

  describe('PATCH /tickets/:ticketId/pause', () => {
    it('ACTIVE 시간권을 정지할 수 있다 (세션 없음)', async () => {
      const ticketId = await createActiveTimeTicket();

      const { body } = await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: '환불 심사' })
        .expect(200);

      // 응답 형식 검증 (TransformInterceptor)
      expect(body.success).toBe(true);
      expect(body.statusCode).toBe(200);

      // DB 검증: TicketPause 생성됨
      const pause = await prisma.ticketPause.findFirst({
        where: { ticketId, resumedAt: null },
      });
      expect(pause).not.toBeNull();
      expect(pause!.pausedBy).toBe(ownerUser.id);
      expect(pause!.pausedReason).toBe('환불 심사');
    });

    it('활성 세션이 있으면 정지 시 세션을 종료한다', async () => {
      const ticketId = await createActiveTimeTicket(120);
      const sessionId = await createActiveSession(ticketId);

      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(200);

      // DB 검증: 세션이 ENDED로 전이
      const session = await prisma.usageSession.findUnique({
        where: { id: sessionId },
      });
      expect(session!.status).toBe(UsageSessionStatus.ENDED);
      expect(session!.endedAt).not.toBeNull();

      // DB 검증: 시간권 remainingMinutes 차감
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      expect(ticket!.remainingMinutes).toBeLessThan(120);

      // DB 검증: TicketPause 생성됨
      const pause = await prisma.ticketPause.findFirst({
        where: { ticketId, resumedAt: null },
      });
      expect(pause).not.toBeNull();
    });

    it('이미 정지 중인 티켓에 재정지하면 409 반환', async () => {
      const ticketId = await createActiveTimeTicket();

      // 첫 번째 정지
      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(200);

      // 두 번째 정지 시도
      const { body } = await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(409);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(409);
    });

    it('ACTIVE가 아닌 티켓을 정지하면 400 반환', async () => {
      // UNUSED 상태의 티켓 생성
      const order = await prisma.order.create({
        data: {
          shopId: shop.id,
          userId: ownerUser.id,
          originalAmount: 10000,
          discountAmount: 0,
          totalAmount: 10000,
        },
      });
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          ticketType: TicketType.TIME,
          originalAmount: 10000,
          discountAmount: 0,
          amount: 10000,
          purchasedMinutes: 120,
          usableDays: 30,
        },
      });
      const ticket = await prisma.ticket.create({
        data: {
          userId: ownerUser.id,
          type: TicketType.TIME,
          status: TicketStatus.UNUSED,
          orderItemId: orderItem.id,
          purchasedMinutes: 120,
          remainingMinutes: 120,
        },
      });

      const { body } = await request(server)
        .patch(`/tickets/${ticket.id}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(400);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
    });

    it('인증 없이 요청하면 401 반환', async () => {
      const ticketId = await createActiveTimeTicket();

      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .send({})
        .expect(401);
    });

    it('USER 역할로 요청하면 401 반환 (권한 부족)', async () => {
      const ticketId = await createActiveTimeTicket();

      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(401);
    });

    it('존재하지 않는 티켓 ID로 요청하면 404 반환', async () => {
      const fakeId = randomUUID();

      await request(server)
        .patch(`/tickets/${fakeId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(404);
    });

    it('유효하지 않은 UUID 형식이면 400 반환', async () => {
      await request(server)
        .patch('/tickets/not-a-uuid/pause')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(400);
    });

    it('reason 없이도 정지할 수 있다', async () => {
      const ticketId = await createActiveTimeTicket();

      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(200);

      const pause = await prisma.ticketPause.findFirst({
        where: { ticketId, resumedAt: null },
      });
      expect(pause).not.toBeNull();
      expect(pause!.pausedReason).toBeNull();
    });

    it('시간이 소진된 세션 종료 시 티켓이 EXHAUSTED로 전이한다', async () => {
      // remainingMinutes를 1로 설정하여 소진 유도
      const ticketId = await createActiveTimeTicket(1);

      // 30분 전에 시작된 세션 → 소비 시간 30분 > 잔여 1분
      await createActiveSession(ticketId);

      await request(server)
        .patch(`/tickets/${ticketId}/pause`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({})
        .expect(200);

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      expect(ticket!.status).toBe(TicketStatus.EXHAUSTED);
      expect(ticket!.remainingMinutes).toBe(0);
    });
  });
});
