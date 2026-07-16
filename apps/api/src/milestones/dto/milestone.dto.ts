import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitMilestoneDto {
  @IsString()
  @MinLength(3)
  notes: string;

  @IsOptional()
  @IsString()
  externalLink?: string;
}

export class ReviewMilestoneDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
