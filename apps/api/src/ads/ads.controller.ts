import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('ads')
export class AdsController {
  constructor(private ads: AdsService) {}

  // ===== عام (بدون تسجيل) =====
  @Get('active')
  active(@Query('placement') placement?: string) {
    return this.ads.publicActive(placement);
  }

  @Post(':id/click')
  click(@Param('id') id: string) {
    return this.ads.trackClick(id);
  }

  @Post(':id/impression')
  impression(@Param('id') id: string) {
    return this.ads.trackImpression(id);
  }

  // ===== مقدم الخدمة =====
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@GetUser() user: AuthUser) {
    return this.ads.listMine(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateAdDto, @GetUser() user: AuthUser) {
    return this.ads.create(dto, user.id, user.role === UserRole.ADMIN);
  }

  // ===== الأدمن =====
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminList(
    @Query('status') status?: string,
    @Query('placement') placement?: string,
  ) {
    return this.ads.listAll(status, placement);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAdDto) {
    return this.ads.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  status(@Param('id') id: string, @Body('status') status: string) {
    return this.ads.setStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.ads.remove(id);
  }
}
