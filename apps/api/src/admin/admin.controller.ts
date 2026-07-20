import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  SetVerifiedDto,
  SetActiveDto,
  ChangeRoleDto,
  SendNotificationDto,
} from './dto/admin.dto';

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

  @Patch('users/:id/role')
  setRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.adminService.setRole(id, dto.role);
  }

@Post('notify')
notify(@GetUser() user: AuthUser, @Body() dto: SendNotificationDto) {
  return this.adminService.notify(user, dto);
}

@Get('notifications')
listSentNotifications() {
  return this.adminService.listSentNotifications();
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
