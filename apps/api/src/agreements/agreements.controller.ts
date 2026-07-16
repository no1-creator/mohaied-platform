import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private agreementsService: AgreementsService) {}

  @Post('accept/:offerId')
  @Roles(UserRole.CLIENT)
  acceptOffer(
    @Param('offerId') offerId: string,
    @GetUser('id') clientId: string,
  ) {
    return this.agreementsService.acceptOffer(offerId, clientId);
  }

  @Get('project/:projectId')
  findForProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
  ) {
    return this.agreementsService.findForProject(projectId, userId);
  }
}
