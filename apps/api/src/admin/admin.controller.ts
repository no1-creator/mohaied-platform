import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { SetVerifiedDto, SetActiveDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query('role') role?: string, @Query('q') q?: string) {
    return this.adminService.listUsers(role, q);
  }

  @Patch('users/:id/verify')
  setVerified(@Param('id') id: string, @Body() dto: SetVerifiedDto) {
    return this.adminService.setVerified(id, dto.isVerified);
  }

  @Patch('users/:id/active')
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.adminService.setActive(id, dto.isActive);
  }

  @Get('projects')
  listProjects() {
    return this.adminService.listProjects();
  }

  @Get('supervisors')
  listSupervisors() {
    return this.adminService.listSupervisors();
  }
}
