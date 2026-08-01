import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum CommentSortField {
  userName = 'userName',
  email = 'email',
  createdAt = 'createdAt',
}

export enum CommentSortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class CommentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @IsOptional()
  @IsEnum(CommentSortField)
  sortField: CommentSortField = CommentSortField.createdAt;

  @IsOptional()
  @IsEnum(CommentSortOrder)
  sortOrder: CommentSortOrder = CommentSortOrder.desc;
}
