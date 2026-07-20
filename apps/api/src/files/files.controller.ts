import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateMediaDto } from './dto/create-media.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateFileDto) {
    return this.files.create(user.id, dto);
  }

  // ---- مكتبة الوسائط (جديد) ----

  @Post('media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createMedia(@GetUser() user: AuthUser, @Body() dto: CreateMediaDto) {
    return this.files.createMedia(user.id, dto);
  }

  @Get('media/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listMedia() {
    return this.files.listMedia();
  }

  @Delete('media/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeMedia(@Param('id') id: string) {
    return this.files.removeMedia(id);
  }

  // عرض عام للصورة (بدون حماية)
  @Get('public/:id')
  async getPublic(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mime } = await this.files.getPublicRaw(id);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  listByProject(
    @Param('projectId') projectId: string,
    @GetUser() user: AuthUser,
  ) {
    return this.files.listByProject(projectId, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.files.getOne(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.files.remove(id, user.id);
  }
}
