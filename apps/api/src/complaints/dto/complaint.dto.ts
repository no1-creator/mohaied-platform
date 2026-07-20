import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ComplaintType, DecisionType } from '@prisma/client';

export class CreateComplaintDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsEnum(ComplaintType)
  type: ComplaintType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customType?: string;

  @IsString()
  @MinLength(10)
  details: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceLinks?: string[];
}

export class RespondComplaintDto {
  @IsString()
  @MinLength(3)
  message: string;
}

export class DecideComplaintDto {
  @IsEnum(DecisionType)
  type: DecisionType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customType?: string;

  @IsString()
  @MinLength(5)
  reason: string;
}

export class AssignArbitratorDto {
  @IsString()
  supervisorId: string;
}
