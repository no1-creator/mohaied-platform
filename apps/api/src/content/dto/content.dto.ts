import { IsString, MinLength, IsOptional, IsInt } from 'class-validator';

export class UpsertContentDto {
  @IsString()
  @MinLength(2)
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  groupKey?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
