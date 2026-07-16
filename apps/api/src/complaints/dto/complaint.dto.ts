import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ComplaintType, DecisionType } from '@prisma/client';

export class CreateComplaintDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsEnum(ComplaintType)
  type: ComplaintType;

  @IsString()
  @MinLength(10)
  details: string;
}

export class RespondComplaintDto {
  @IsString()
  @MinLength(3)
  message: string;
}

export class DecideComplaintDto {
  @IsEnum(DecisionType)
  type: DecisionType;

  @IsString()
  @MinLength(5)
  reason: string;
}
