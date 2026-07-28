// src/prisma/prisma.integration.spec.ts
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';

describe('PrismaService 연결 테스트', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('DB에 연결할 수 있다', async () => {
    const result =
      await prisma.$queryRaw<[{ result: number }]>`SELECT 1 AS result`;
    expect(result[0].result).toBe(1);
  });
});
