import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateComplaintDto,
  RespondComplaintDto,
  DecideComplaintDto,
} from './dto/complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(userId, dto);
  }

  @Post(':id/respond')
  respond(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: RespondComplaintDto,
  ) {
    return this.complaintsService.respond(id, userId, dto);
  }

  @Post(':id/decide')
  @Roles(UserRole.ADMIN)
  decide(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: DecideComplaintDto,
  ) {
    return this.complaintsService.decide(id, adminId, dto);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.complaintsService.findAllForAdmin();
  }

  @Get('mine')
  findMine(@GetUser('id') userId: string) {
    return this.complaintsService.findForUser(userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.complaintsService.findOne(id, userId, role);
  }
}
