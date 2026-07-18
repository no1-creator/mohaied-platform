import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateInvitationDto,
  UpdateInvitationStatusDto,
} from './dto/invitation.dto';

@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@GetUser('id') clientId: string, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(clientId, dto);
  }

  @Get('mine')
  findMine(@GetUser('id') userId: string) {
    return this.invitationsService.findMine(userId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.invitationsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.invitationsService.findOneForUser(id, userId, role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvitationStatusDto,
  ) {
    return this.invitationsService.updateStatus(id, dto);
  }
}
