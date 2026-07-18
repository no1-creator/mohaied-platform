import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateRecommendationDto,
  RespondRecommendationDto,
} from './dto/recommendation.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@GetUser('id') clientId: string, @Body() dto: CreateRecommendationDto) {
    return this.recommendationsService.create(clientId, dto);
  }

  @Get('mine')
  findMine(@GetUser('id') userId: string) {
    return this.recommendationsService.findMine(userId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.recommendationsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.recommendationsService.findOneForUser(id, userId, role);
  }

  @Patch(':id/respond')
  @Roles(UserRole.ADMIN)
  respond(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: RespondRecommendationDto,
  ) {
    return this.recommendationsService.respond(id, adminId, dto);
  }
}
