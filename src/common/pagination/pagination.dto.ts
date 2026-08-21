import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationOptions } from './pagination.types';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto implements PaginationOptions {
  /**
   * 페이지 번호 (1부터 시작)
   * @default 1
   */
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지 번호는 정수여야 합니다' })
  @Min(1, { message: '페이지 번호는 1 이상이어야 합니다' })
  page: number = 1;

  /**
   * 페이지당 항목 수
   * @default 10
   */
  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다' })
  @Max(100, { message: 'limit는 100 이하여야 합니다' })
  limit: number = 10;

  /**
   * 정렬 필드
   * @default 'createdAt'
   */
  @ApiPropertyOptional({
    description: '정렬 필드',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'sortBy는 문자열이어야 합니다' })
  sortBy: string = 'createdAt';

  /**
   * 정렬 순서 (ASC 또는 DESC)
   * @default 'DESC'
   */
  @ApiPropertyOptional({
    description: '정렬 순서',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder는 asc 또는 desc여야 합니다' })
  sortOrder: 'asc' | 'desc' = 'desc';
}
