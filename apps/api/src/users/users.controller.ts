import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateProviderProfileDto,
  CreateSupervisorProfileDto,
  UpdateProviderProfileDto,
} from './dto/profile.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@GetUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(@GetUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(userId, dto);
  }

  // دليل مقدمي الخدمة
  @Get('providers')
  listProviders() {
    return this.usersService.listProviders();
  }

  @Get('providers/:id')
  getProvider(@Param('id') id: string) {
    return this.usersService.getProvider(id);
  }

  // دليل المستشارين القانونيين
  @Get('legal-consultants')
  listLegalConsultants() {
    return this.usersService.listLegalConsultants();
  }

  @Get('legal-consultants/:id')
  getLegalConsultant(@Param('id') id: string) {
    return this.usersService.getLegalConsultant(id);
  }

  @Post('provider-profile')
  @Roles(UserRole.PROVIDER)
  createProviderProfile(
    @GetUser('id') userId: string,
    @Body() dto: CreateProviderProfileDto,
  ) {
    return this.usersService.createProviderProfile(userId, dto);
  }

  @Patch('provider-profile')
  @Roles(UserRole.PROVIDER)
  updateProviderProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.usersService.updateProviderProfile(userId, dto);
  }

  @Post('supervisor-profile')
  @Roles(UserRole.SUPERVISOR)
  createSupervisorProfile(
    @GetUser('id') userId: string,
    @Body() dto: CreateSupervisorProfileDto,
  ) {
    return this.usersService.createSupervisorProfile(userId, dto);
  }

  @Post('legal-profile')
  @Roles(UserRole.LEGAL_CONSULTANT)
  createLegalConsultantProfile(
    @GetUser('id') userId: string,
    @Body()
    dto: {
      title: string;
      field: string;
      yearsExp?: number;
      consultationRate?: number;
      bio?: string;
      education?: string;
      certifications?: string;
      specialties?: string;
      languages?: string;
      city?: string;
      phone?: string;
      linkedinUrl?: string;
      barAssociationNo?: string;
    },
  ) {
    return this.usersService.createLegalConsultantProfile(userId, dto);
  }
}
