import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Get('providers')
  @Roles(UserRole.ADMIN)
  providers(
    @Query('field') field?: string,
    @Query('city') city?: string,
    @Query('keywords') keywords?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchingService.matchForCriteria({
      field,
      city,
      keywords,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('recommendation/:id')
  @Roles(UserRole.ADMIN)
  forRecommendation(@Param('id') id: string) {
    return this.matchingService.matchForRecommendation(id);
  }

  @Get('project/:id')
  @Roles(UserRole.ADMIN)
  forProject(@Param('id') id: string) {
    return this.matchingService.matchForProject(id);
  }
}
