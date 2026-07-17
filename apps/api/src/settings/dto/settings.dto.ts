import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultCommissionRate?: number;

  @IsOptional()
  @IsBoolean()
  escrowEnabled?: boolean;

  @IsOptional()
  @IsString()
  platformName?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;
}
