import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExternalProjectDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsNumber()
  value?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  startDate?: string;

  @IsOptional() @IsString()
  dueDate?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateExternalProjectDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsNumber()
  value?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  startDate?: string;

  @IsOptional() @IsString()
  dueDate?: string;

  @IsOptional() @IsString()
  notes?: string;
}
