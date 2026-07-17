import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  InviteSupervisorDto,
  RespondInviteDto,
  CreateReportDto,
} from './dto/supervisor.dto';

@Controller('supervisors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupervisorsController {
  constructor(private supervisorsService: SupervisorsService) {}

  @Post('invite')
  @Roles(UserRole.CLIENT)
  invite(@GetUser('id') clientId: string, @Body() dto: InviteSupervisorDto) {
    return this.supervisorsService.invite(clientId, dto);
  }

  @Get('available')
  @Roles(UserRole.CLIENT)
  listAvailable() {
    return this.supervisorsService.listAvailable();
  }

  @Patch('assignments/:id/respond')
  @Roles(UserRole.SUPERVISOR)
  respondInvite(
    @Param('id') id: string,
    @GetUser('id') supervisorId: string,
    @Body() dto: RespondInviteDto,
  ) {
    return this.supervisorsService.respondInvite(id, supervisorId, dto);
  }

  @Post('assignments/:id/reports')
  @Roles(UserRole.SUPERVISOR)
  createReport(
    @Param('id') id: string,
    @GetUser('id') supervisorId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.supervisorsService.createReport(id, supervisorId, dto);
  }

  @Get('mine')
  @Roles(UserRole.SUPERVISOR)
  listMine(@GetUser('id') supervisorId: string) {
    return this.supervisorsService.listMine(supervisorId);
  }

  @Get('project/:projectId')
  listForProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
  ) {
    return this.supervisorsService.listForProject(projectId, userId);
  }
}
