import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';

@Module({
  imports: [PrismaModule, SettingsModule, SubscriptionsModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
