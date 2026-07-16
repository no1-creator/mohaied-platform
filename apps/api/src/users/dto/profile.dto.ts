import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProviderType } from '@prisma/client';

export class CreateProviderProfileDto {
  @IsEnum(ProviderType)
  type: ProviderType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  field: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class CreateSupervisorProfileDto {
  @IsString()
  title: string;

  @IsString()
  field: string;

  @IsInt()
  @Min(0)
  yearsExp: number;

  @IsNumber()
  @Min(0)
  ratePerReview: number;
}
