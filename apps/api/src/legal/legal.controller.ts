import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('legal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalController {
  constructor(private legalService: LegalService) {}

  @Post('requests')
  @Roles(UserRole.CLIENT)
  create(
    @GetUser('id') userId: string,
    @Body()
    dto: {
      category: string;
      title: string;
      description: string;
      entityName?: string;
      nationality?: string;
      budget?: number;
      preferredContact?: string;
      attachments?: string;
    },
  ) {
    return this.legalService.create(userId, dto);
  }

  // لازم الراوتس الثابتة دي تكون قبل requests/:id
  @Get('requests/mine')
  @Roles(UserRole.CLIENT)
  listMine(@GetUser('id') userId: string) {
    return this.legalService.listMine(userId);
  }

  @Get('requests/assigned')
  @Roles(UserRole.LEGAL_CONSULTANT)
  listAssigned(@GetUser('id') userId: string) {
    return this.legalService.listAssigned(userId);
  }

  @Get('requests')
  @Roles(UserRole.ADMIN)
  listAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.legalService.listAll({ status, category, q });
  }

  @Get('requests/:id')
  getOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.legalService.getOne(id, { id: userId, role });
  }

  @Patch('requests/:id')
  @Roles(UserRole.ADMIN)
  adminUpdate(
    @Param('id') id: string,
    @Body()
    dto: {
      status?: string;
      assignedConsultantId?: string | null;
      adminNote?: string;
    },
  ) {
    return this.legalService.adminUpdate(id, dto);
  }

  @Patch('requests/:id/consultant')
  @Roles(UserRole.LEGAL_CONSULTANT)
  consultantUpdate(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: { status?: string; consultantNote?: string },
  ) {
    return this.legalService.consultantUpdate(id, userId, dto);
  }
}
