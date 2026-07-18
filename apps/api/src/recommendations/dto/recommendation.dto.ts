import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRecommendationDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  field: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}

export class RespondRecommendationDto {
  @IsString()
  @MinLength(3)
  adminNote: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedProviderIds?: string[];
}
