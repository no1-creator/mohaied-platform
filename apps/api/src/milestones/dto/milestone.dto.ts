import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SubmitMilestoneDto {
  @IsString()
  @MinLength(3)
  notes: string;

  @IsOptional()
  @IsString()
  externalLink?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentLinks?: string[];
}

export class ReviewMilestoneDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
