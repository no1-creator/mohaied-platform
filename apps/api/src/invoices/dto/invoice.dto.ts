import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @IsString()
  desc: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  price: number;
}

export class CreateInvoiceDto {
  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  number?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsOptional() @IsNumber()
  taxRate?: number;

  @IsOptional() @IsNumber()
  discount?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  issueDate?: string;

  @IsOptional() @IsString()
  dueDate?: string;
}

export class UpdateInvoiceDto {
  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  number?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsOptional() @IsNumber()
  taxRate?: number;

  @IsOptional() @IsNumber()
  discount?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  issueDate?: string;

  @IsOptional() @IsString()
  dueDate?: string;
}
