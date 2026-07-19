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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  create(@GetUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  list(@GetUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  @Get(':id')
  get(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.service.get(user.id, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
