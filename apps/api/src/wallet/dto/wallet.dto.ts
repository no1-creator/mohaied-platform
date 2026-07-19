import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber()
  amount: number;

  @IsOptional() @IsString()
  method?: string;

  @IsOptional() @IsString()
  note?: string;
}

export class CreateWalletTxnDto {
  @IsString()
  type: string; // EARNING | ADJUSTMENT

  @IsNumber()
  amount: number;

  @IsOptional() @IsString()
  description?: string;
}
