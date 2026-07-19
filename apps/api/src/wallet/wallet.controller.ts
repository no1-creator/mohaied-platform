import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { WalletService } from './wallet.service';
import { CreateWithdrawalDto, CreateWalletTxnDto } from './dto/wallet.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get()
  summary(@GetUser() user: AuthUser) {
    return this.service.summary(user.id);
  }

  @Get('transactions')
  transactions(@GetUser() user: AuthUser) {
    return this.service.transactions(user.id);
  }

  @Post('withdrawals')
  withdraw(@GetUser() user: AuthUser, @Body() dto: CreateWithdrawalDto) {
    return this.service.requestWithdrawal(user.id, dto);
  }

  @Delete('withdrawals/:id')
  cancel(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancelWithdrawal(user.id, id);
  }

  @Post('transactions')
  addManual(@GetUser() user: AuthUser, @Body() dto: CreateWalletTxnDto) {
    return this.service.addManual(user.id, dto);
  }
}
