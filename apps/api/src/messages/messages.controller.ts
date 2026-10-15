import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('projects/:projectId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.messagesService.findAll(
      projectId,
      req.user.userId,
    );
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMessageDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.messagesService.create(
      projectId,
      req.user.userId,
      dto,
    );
  }
}