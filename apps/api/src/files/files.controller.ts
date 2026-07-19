import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateFileDto) {
    return this.files.create(user.id, dto);
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
