import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvestController } from './invest.controller';
import { InvestService } from './invest.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvestController],
  providers: [InvestService],
})
export class InvestModule {}
