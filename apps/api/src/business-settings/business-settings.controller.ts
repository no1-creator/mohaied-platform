import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { BusinessSettingsService } from './business-settings.service';
import { UpsertBusinessSettingsDto } from './dto/business-settings.dto';

@Controller('business-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
export class BusinessSettingsController {
  constructor(private readonly service: BusinessSettingsService) {}

  @Get()
  get(@GetUser() user: AuthUser) {
    return this.service.get(user.id);
  }

  @Patch()
  upsert(@GetUser() user: AuthUser, @Body() dto: UpsertBusinessSettingsDto) {
    return this.service.upsert(user.id, dto);
  }
}
