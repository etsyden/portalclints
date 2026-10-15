import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole, ProjectStatus, Visibility, } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        client: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneForUser(
    projectId: string,
    userId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        client: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(
    userId: string,
    clientId: string,
    name: string,
    description?: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const existingMembership = await this.prisma.projectMember.findFirst({
      where: {
        userId,
        role: ProjectMemberRole.ADMIN,
      },
    });

    const project = await this.prisma.project.create({
      data: {
        clientId,
        createdById: userId,
        name,
        description,
        status: ProjectStatus.DRAFT,
        members: {
          create: {
            userId,
            role: existingMembership
              ? ProjectMemberRole.PROJECT_MANAGER
              : ProjectMemberRole.ADMIN,
          },
        },
      },
      include: {
        client: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await this.eventsService.create({
      projectId: project.id,
      actorId: userId,
      eventType: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project.id,
      visibility: Visibility.CLIENT,
    });

    return project;
  }

  async addMember(
    projectId: string,
    currentUserId: string,
    userId: string,
    role: ProjectMemberRole,
  ) {
    const currentMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      throw new NotFoundException('Project membership not found');
    }

    if (
      currentMember.role !== ProjectMemberRole.ADMIN &&
      currentMember.role !== ProjectMemberRole.PROJECT_MANAGER
    ) {
      throw new ForbiddenException(
        'Only ADMIN or PROJECT_MANAGER can manage project members',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a project member');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getHistory(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Project membership not found');
    }

    const visibility =
      member.role === ProjectMemberRole.CLIENT
        ? { in: [Visibility.CLIENT] }
        : undefined;

    return this.prisma.event.findMany({
      where: {
        projectId,
        ...(visibility ? { visibility } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMemberRole(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Project membership not found');
    }

    return member.role;
  }
}