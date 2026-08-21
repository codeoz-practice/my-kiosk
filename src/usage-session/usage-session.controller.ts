import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { UsageSessionService } from './usage-session.service';
import { GetSessionDto } from './dto/get-session.dto';
import { CreateUsageSessionDto } from './dto/create-usage-session.dto';

@Controller('usage-sessions')
export class UsageSessionController {
  constructor(private readonly service: UsageSessionService) {}

  // 입실
  @Post()
  async create(@Body() createUsageSessionDto: CreateUsageSessionDto) {
    const { ticketId, shopId, seatId, userId } = createUsageSessionDto;
    await this.service.createSession(ticketId, shopId, seatId, userId);
  }

  // 퇴실
  @Patch(':sessionId/end')
  async end(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    await this.service.endUsageSession(sessionId);
  }

  // 조회
  @Get('by-shop/:shopId')
  async getSessionsByShop(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: GetSessionDto,
  ) {
    return this.service.getUsageSessionByShop(
      shopId,
      query.sortOrder,
      query.limit,
    );
  }

  // 조회
  @Get('by-user/:userId')
  async getSessionsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: GetSessionDto,
  ) {
    return this.service.getUsageSessionByUser(
      userId,
      query.sortOrder,
      query.limit,
    );
  }
}
