import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @MinLength(2)
  groupKey: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
