import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Post()
  create(@GetUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.clients.create(user.id, dto);
  }

  @Get()
  list(@GetUser() user: AuthUser) {
    return this.clients.list(user.id);
  }

  @Get(':id')
  get(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.clients.get(user.id, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.clients.remove(user.id, id);
  }
}
