import { IsString, IsOptional, IsNumber, IsBoolean, IsInt } from 'class-validator';

export class UpdateAdDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() linkUrl?: string;
  @IsOptional() @IsString() ctaLabel?: string;
  @IsOptional() @IsString() placement?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsBoolean() paid?: boolean;
  @IsOptional() @IsInt() orderIndex?: number;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}
