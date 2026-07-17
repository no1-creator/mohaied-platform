import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto, SubscribeDto } from './dto/subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // الباقات المتاحة لأي مستخدم مسجّل
  @Get('plans')
  listActivePlans() {
    return this.subscriptionsService.listActivePlans();
  }

  // كل الباقات (أدمن)
  @Get('plans/all')
  @Roles(UserRole.ADMIN)
  listAllPlans() {
    return this.subscriptionsService.listAllPlans();
  }

  @Post('plans')
  @Roles(UserRole.ADMIN)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @Roles(UserRole.ADMIN)
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @Roles(UserRole.ADMIN)
  deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  // اشتراك المستخدم الحالي
  @Get('mine')
  mine(@GetUser('id') userId: string) {
    return this.subscriptionsService.mine(userId);
  }

  // الاشتراك في باقة (لمقدمي الخدمة)
  @Post('subscribe')
  @Roles(UserRole.PROVIDER)
  subscribe(@GetUser('id') userId: string, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(userId, dto);
  }
}
