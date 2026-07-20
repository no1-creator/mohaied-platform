import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OfferMilestoneDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  durationDays: number;
}

export class CreateOfferDto {
  @IsString()
  projectId: string;

  @IsString()
  @MinLength(10)
  scope: string;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferMilestoneDto)
  milestones: OfferMilestoneDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentLinks?: string[];
}
