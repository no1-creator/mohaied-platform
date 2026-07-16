import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { SubmitMilestoneDto, ReviewMilestoneDto } from './dto/milestone.dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MilestonesController {
  constructor(private milestonesService: MilestonesService) {}

  @Get('project/:projectId')
  listForProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
  ) {
    return this.milestonesService.listForProject(projectId, userId);
  }

  @Post(':id/submit')
  @Roles(UserRole.PROVIDER)
  submit(
    @Param('id') id: string,
    @GetUser('id') providerId: string,
    @Body() dto: SubmitMilestoneDto,
  ) {
    return this.milestonesService.submit(id, providerId, dto);
  }

  @Patch(':id/review')
  @Roles(UserRole.CLIENT)
  review(
    @Param('id') id: string,
    @GetUser('id') clientId: string,
    @Body() dto: ReviewMilestoneDto,
  ) {
    return this.milestonesService.review(id, clientId, dto);
  }
}
