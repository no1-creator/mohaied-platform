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
  AssignArbitratorDto,
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

  // تعيين مشرف كمُحكّم تقني على النزاع (إدارة محايد فقط)
  @Post(':id/assign-arbitrator')
  @Roles(UserRole.ADMIN)
  assignArbitrator(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: AssignArbitratorDto,
  ) {
    return this.complaintsService.assignArbitrator(id, adminId, dto);
  }

  // رسالة من المُحكّم (إدارة محايد أو المشرف المُحكّم) داخل النزاع
  @Post(':id/arbitrate')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  arbitrate(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Body() dto: RespondComplaintDto,
  ) {
    return this.complaintsService.arbitrate(id, userId, role, dto);
  }

  @Post(':id/decide')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  decide(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Body() dto: DecideComplaintDto,
  ) {
    return this.complaintsService.decide(id, userId, role, dto);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.complaintsService.findAllForAdmin();
  }

  // النزاعات المُسندة للمستخدم الحالي كمُحكّم تقني
  @Get('arbitrations/mine')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  findMyArbitrations(@GetUser('id') userId: string) {
    return this.complaintsService.findForArbitrator(userId);
  }

  // شكاوى ونزاعات المستخدم الحالي (عميل/مقدم خدمة)
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
