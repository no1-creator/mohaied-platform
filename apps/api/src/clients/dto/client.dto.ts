import { IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  company?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsString()
  source?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateClientDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  company?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsString()
  source?: string;

  @IsOptional() @IsString()
  notes?: string;
}
