import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectMemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAllForUser(
      request.user.userId,
    );
  }

  @Get(':id/history')
  getHistory(
    @Param('id') projectId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.getHistory(
      projectId,
      request.user.userId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') projectId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.findOneForUser(
      projectId,
      request.user.userId,
    );
  }

  @Post()
  create(
    @Body()
      body: {
      clientId: string;
      name: string;
      description?: string;
    },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.create(
      request.user.userId,
      body.clientId,
      body.name,
      body.description,
    );
  }

  @Post(':id/members')
  addMember(
    @Param('id') projectId: string,
    @Body()
      body: {
      userId: string;
      role: ProjectMemberRole;
    },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.addMember(
      projectId,
      request.user.userId,
      body.userId,
      body.role,
    );
  }
}