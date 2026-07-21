import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminTeamService } from './admin-team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin-team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminTeamController {
  constructor(private adminTeamService: AdminTeamService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  list() {
    return this.adminTeamService.listAdmins();
  }

  @Get('sections')
  @Roles(UserRole.ADMIN)
  sections() {
    return this.adminTeamService.sections();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @GetUser('id') actingId: string,
    @Param('id') id: string,
    @Body() dto: { scopes?: string[] | null; isSuperAdmin?: boolean },
  ) {
    return this.adminTeamService.updateAdmin(actingId, id, dto);
  }
}
