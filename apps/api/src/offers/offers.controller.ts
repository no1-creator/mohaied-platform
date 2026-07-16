import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateOfferDto } from './dto/offer.dto';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  @Roles(UserRole.PROVIDER)
  create(@GetUser('id') providerId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(providerId, dto);
  }

  @Get('mine')
  @Roles(UserRole.PROVIDER)
  findMine(@GetUser('id') providerId: string) {
    return this.offersService.findMine(providerId);
  }

  @Get('project/:projectId')
  @Roles(UserRole.CLIENT)
  findForProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
  ) {
    return this.offersService.findForProject(projectId, userId);
  }
}
