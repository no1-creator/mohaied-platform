import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  list(
    @Query('role') role?: string,
    @Query('actorId') actorId?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.list({
      role,
      actorId,
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
