import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum KycReviewStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewKycDto {
  @IsEnum(KycReviewStatus)
  status: KycReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
