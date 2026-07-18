import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsNumber()
  @Min(0)
  commissionRate: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOffers?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  directoryPriority?: number;

  @IsOptional()
  @IsString()
  badgeLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyAdCredits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recommendationPriority?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSeats?: number;

  @IsOptional()
  @IsBoolean()
  analyticsAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  prioritySupport?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOffers?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

   @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  directoryPriority?: number;

  @IsOptional()
  @IsString()
  badgeLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyAdCredits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recommendationPriority?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSeats?: number;

  @IsOptional()
  @IsBoolean()
  analyticsAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  prioritySupport?: boolean;
}

export class SubscribeDto {
  @IsString()
  planId: string;
}
