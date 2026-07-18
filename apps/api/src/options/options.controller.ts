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
import { OptionsService } from './options.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateOptionDto, UpdateOptionDto } from './dto/option.dto';

@Controller('options')
export class OptionsController {
  constructor(private optionsService: OptionsService) {}

  // قائمة الخيارات المفعّلة لمجموعة (متاحة للنماذج)
  @Get(':groupKey')
  list(@Param('groupKey') groupKey: string) {
    return this.optionsService.listPublic(groupKey);
  }

  // كل الخيارات (شاملة الموقوفة) — لإدارة محايد
  @Get('admin/list/:groupKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll(@Param('groupKey') groupKey: string) {
    return this.optionsService.listAll(groupKey);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateOptionDto) {
    return this.optionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateOptionDto) {
    return this.optionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.optionsService.remove(id);
  }
}
