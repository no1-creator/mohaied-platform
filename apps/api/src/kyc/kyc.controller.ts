import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(@GetUser() user: AuthUser, @Body() dto: CreateKycDto) {
    return this.kyc.submit(user.id, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@GetUser() user: AuthUser) {
    return this.kyc.mine(user.id);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminList(@Query('status') status?: string) {
    return this.kyc.adminList(status);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminGet(@Param('id') id: string) {
    return this.kyc.adminGet(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  review(
    @Param('id') id: string,
    @GetUser() user: AuthUser,
    @Body() dto: ReviewKycDto,
  ) {
    return this.kyc.review(id, user.id, dto);
  }
}
