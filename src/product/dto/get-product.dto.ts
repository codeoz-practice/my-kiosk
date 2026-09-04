import { TicketType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

const PRODUCT_SORT_FIELDS = [
  'name',
  'amount',
  'usableDays',
  'createdAt',
] as const;

export class GetProductDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsIn(PRODUCT_SORT_FIELDS)
  declare sortBy: (typeof PRODUCT_SORT_FIELDS)[number];
}
