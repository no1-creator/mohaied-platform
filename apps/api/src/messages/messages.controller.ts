import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, AuthUser } from '../auth/get-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateMessageDto) {
    return this.messages.create(user.id, dto);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  listByProject(
    @Param('projectId') projectId: string,
    @GetUser() user: AuthUser,
  ) {
    return this.messages.listByProject(projectId, user.id);
  }
}
