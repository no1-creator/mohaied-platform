import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmploymentController } from './employment.controller';
import { EmploymentService } from './employment.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmploymentController],
  providers: [EmploymentService],
})
export class EmploymentModule {}
