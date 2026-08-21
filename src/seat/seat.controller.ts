import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SeatService } from './seat.service';
import { UpdateSeatDto } from './dto/update-seat.dto';

@ApiTags('seats')
@Controller('seats')
export class SeatController {
  constructor(private readonly service: SeatService) {}

  @ApiOperation({ summary: '좌석 정보 업데이트' })
  @ApiParam({ name: 'seatId', description: '좌석 아이디' })
  @Patch(':seatId')
  async updateSeat(
    @Param('seatId') seatId: string,
    @Body() updateSeatDto: UpdateSeatDto,
  ): Promise<void> {
    return this.service.updateSeat(seatId, updateSeatDto);
  }

  @ApiOperation({ summary: '좌석 삭제' })
  @ApiParam({ name: 'seatId', description: '좌석 아이디' })
  @Delete(':seatId')
  async deleteSeat(@Param('seatId') seatId: string): Promise<void> {
    return this.service.deleteSeat(seatId);
  }
}
