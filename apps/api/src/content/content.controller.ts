import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { UpsertContentDto, UpdateContentDto } from './dto/content.dto';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  // خريطة المحتوى (متاحة للواجهات العامة)
  @Get()
  publicMap() {
    return this.contentService.publicMap();
  }

  // كل عناصر المحتوى بالتفاصيل — لإدارة محايد
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll(@Query('groupKey') groupKey?: string) {
    return this.contentService.listAll(groupKey);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  upsert(@Body() dto: UpsertContentDto) {
    return this.contentService.upsert(dto);
  }

  @Post('ensure')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  ensureMany(@Body() body: { items: UpsertContentDto[] }) {
    return this.contentService.ensureMany(body?.items || []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
