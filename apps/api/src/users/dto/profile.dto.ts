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

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  teamSize?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  commercialRegNo?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;
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

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsString()
  specialties?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  membershipNo?: string;
}
