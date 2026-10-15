import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProjectMemberRole,
  RequestSource,
  RequestStatus,
  RequestType,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAll(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return this.prisma.request.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(projectId: string, requestId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const request = await this.prisma.request.findFirst({
      where: {
        id: requestId,
        projectId,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async updateStatus(
    projectId: string,
    requestId: string,
    userId: string,
    status: RequestStatus,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (
      member.role !== ProjectMemberRole.ADMIN &&
      member.role !== ProjectMemberRole.PROJECT_MANAGER &&
      member.role !== ProjectMemberRole.EXECUTOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to update request status',
      );
    }

    const request = await this.prisma.request.findFirst({
      where: {
        id: requestId,
        projectId,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status === status) {
      return request;
    }

    const updatedRequest = await this.prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        status,
        updatedAt: new Date(),
        resolvedAt:
          status === RequestStatus.COMPLETED
            ? new Date()
            : null,
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'REQUEST_UPDATED',
      entityType: 'Request',
      entityId: request.id,
      visibility: Visibility.CLIENT,
      metadata: {
        previousStatus: request.status,
        newStatus: status,
      },
    });

    return updatedRequest;
  }

  async create(
    projectId: string,
    userId: string,
    title: string,
    description?: string,
    type: RequestType = RequestType.GENERAL,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (
      member.role !== ProjectMemberRole.ADMIN &&
      member.role !== ProjectMemberRole.PROJECT_MANAGER &&
      member.role !== ProjectMemberRole.EXECUTOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to update request status',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const request = await this.prisma.request.create({
      data: {
        projectId,
        createdById: userId,
        title,
        description: description ?? '',
        type,
        status: RequestStatus.NEW,
        source: RequestSource.PORTAL,
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'REQUEST_CREATED',
      entityType: 'Request',
      entityId: request.id,
      visibility: Visibility.CLIENT,
    });

    return request;
  }
}