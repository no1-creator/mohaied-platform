import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertBusinessSettingsDto {
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() defaultCurrency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) defaultTaxRate?: number;
  @IsOptional() @IsString() defaultPaymentTerms?: string;
  @IsOptional() @IsString() invoiceFooter?: string;
}
