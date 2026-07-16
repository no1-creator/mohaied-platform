import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { SupervisorReportStatus } from '@prisma/client';

export class InviteSupervisorDto {
  @IsString()
  projectId: string;

  @IsString()
  supervisorId: string;

  @IsNumber()
  @Min(0)
  ratePerReview: number;
}

export class RespondInviteDto {
  @IsBoolean()
  accept: boolean;
}

export class CreateReportDto {
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsString()
  @MinLength(5)
  summary: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(SupervisorReportStatus)
  status: SupervisorReportStatus;
}
