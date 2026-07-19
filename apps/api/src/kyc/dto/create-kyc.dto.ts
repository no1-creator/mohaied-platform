import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { KycIdType } from '@prisma/client';

export class CreateKycDto {
  @IsEnum(KycIdType)
  idType: KycIdType;

  @IsString()
  @MaxLength(100)
  idNumber: string;

  @IsString()
  @MaxLength(200)
  fullNameOnId: string;

  // صورة وجه المستند (base64 data URL)
  @IsString()
  @MaxLength(16000000)
  frontImage: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000000)
  backImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000000)
  selfie?: string;
}
