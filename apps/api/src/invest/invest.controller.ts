import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { InvestService } from './invest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('invest')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestController {
  constructor(private readonly invest: InvestService) {}

  // ---- الفرص ----

  @Post('opportunities')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  create(@GetUser('id') userId: string, @Body() body: any) {
    return this.invest.createOpportunity(userId, body);
  }

  @Get('opportunities/mine')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  mine(@GetUser('id') userId: string) {
    return this.invest.listMine(userId);
  }

  @Get('opportunities/admin')
  @Roles(UserRole.ADMIN)
  admin(
    @Query('status') status?: string,
    @Query('sector') sector?: string,
    @Query('q') q?: string,
  ) {
    return this.invest.listAdmin({ status, sector, q });
  }

  @Get('opportunities')
  browse(
    @Query('sector') sector?: string,
    @Query('stage') stage?: string,
    @Query('q') q?: string,
  ) {
    return this.invest.listPublic({ sector, stage, q });
  }

  @Get('opportunities/:id')
  getOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.invest.getOne(id, { id: userId, role });
  }

  @Get('opportunities/:id/interests')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  oppInterests(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.invest.listInterestsForOpportunity(id, userId);
  }

  @Post('opportunities/:id/interest')
  @Roles(UserRole.INVESTOR)
  interest(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.invest.expressInterest(userId, id, body);
  }

  @Patch('opportunities/:id/admin')
  @Roles(UserRole.ADMIN)
  adminUpdate(@Param('id') id: string, @Body() body: any) {
    return this.invest.adminUpdate(id, body);
  }

  @Patch('opportunities/:id')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  updateMine(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.invest.updateMine(id, userId, body);
  }

  // ---- الاهتمامات ----

  @Get('interests/mine')
  @Roles(UserRole.INVESTOR)
  myInterests(@GetUser('id') userId: string) {
    return this.invest.listMyInterests(userId);
  }

  @Patch('interests/:id')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  respond(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.invest.founderRespond(id, userId, body);
  }
}
