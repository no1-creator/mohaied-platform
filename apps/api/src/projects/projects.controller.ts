import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateProjectDto } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@GetUser('id') clientId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(clientId, dto);
  }

  @Get('mine')
  findMine(@GetUser('id') userId: string) {
    return this.projectsService.findMine(userId);
  }

  @Get('open')
  @Roles(UserRole.PROVIDER)
  findOpen() {
    return this.projectsService.findOpen();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.projectsService.findOne(id, userId);
  }
}
