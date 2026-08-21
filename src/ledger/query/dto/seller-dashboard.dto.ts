import { ApiProperty } from '@nestjs/swagger';

export class CategoryBreakdownDto {
  @ApiProperty({description: '카테고리명'})
  category: string;

  @ApiProperty({description: '해당 카테고리 정산 금액 합계'})
  amount: number;

  @ApiProperty({description: '해당 카테고리 거래 건수'})
  tradeCount: number;
}

export class SellerDashboardDto {
  @ApiProperty({description: '이번 달 정산 총액'})
  totalAmount: number;

  @ApiProperty({description: '이번 달 완료된 정산 거래 건수'})
  tradeCount: number;

  @ApiProperty({description: '평균 리뷰 평점', required: false})
  avgRating?: number;

  @ApiProperty({type: [CategoryBreakdownDto], description: 
    '카테고리별 정산 내역'
  })
  byCategory: CategoryBreakdownDto[];
}
