import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  // العميل يموّل مرحلة
  @Post('milestones/:milestoneId/fund')
  @Roles(UserRole.CLIENT)
  fund(
    @Param('milestoneId') milestoneId: string,
    @GetUser('id') clientId: string,
  ) {
    return this.escrowService.fund(clientId, milestoneId);
  }

  // تحرير الفلوس (العميل أو الأدمن)
  @Patch(':id/release')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  release(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.escrowService.release(userId, id, role === UserRole.ADMIN);
  }

  // فتح نزاع (العميل / مقدّم الخدمة / الأدمن)
  @Patch(':id/dispute')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  dispute(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.escrowService.dispute(userId, id, role === UserRole.ADMIN);
  }

  // استرجاع للعميل (الأدمن فقط)
  @Patch(':id/refund')
  @Roles(UserRole.ADMIN)
  refund(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.escrowService.refund(userId, id);
  }

  // معاملات الضمان لمشروع
  @Get('project/:projectId')
  listForProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.escrowService.listForProject(
      projectId,
      userId,
      role === UserRole.ADMIN,
    );
  }
}
