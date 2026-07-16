import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateProviderProfileDto,
  CreateSupervisorProfileDto,
} from './dto/profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@GetUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Post('provider-profile')
  @Roles(UserRole.PROVIDER)
  createProviderProfile(
    @GetUser('id') userId: string,
    @Body() dto: CreateProviderProfileDto,
  ) {
    return this.usersService.createProviderProfile(userId, dto);
  }

  @Post('supervisor-profile')
  @Roles(UserRole.SUPERVISOR)
  createSupervisorProfile(
    @GetUser('id') userId: string,
    @Body() dto: CreateSupervisorProfileDto,
  ) {
    return this.usersService.createSupervisorProfile(userId, dto);
  }
}
