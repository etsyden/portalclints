import {
  Body,
  Controller,
  Param,
  Get,
  Patch,
  Post,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';

@Controller('projects/:projectId/requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.requestsService.findAll(
      projectId,
      req.user.userId,
    );
  }

  @Get(':requestId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('requestId') requestId: string,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.requestsService.findOne(
      projectId,
      requestId,
      req.user.userId,
    );
  }

  @Patch(':requestId/status')
  updateStatus(
    @Param('projectId') projectId: string,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestStatusDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.requestsService.updateStatus(
      projectId,
      requestId,
      req.user.userId,
      dto.status,
    );
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequestDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.requestsService.create(
      projectId,
      req.user.userId,
      dto.title,
      dto.description,
      dto.type,
    );
  }
}