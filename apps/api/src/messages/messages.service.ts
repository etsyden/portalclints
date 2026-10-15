import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageChannel,
  ProjectMemberRole,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class MessagesService {
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
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    const where = {
      projectId,
      ...(member.role === ProjectMemberRole.CLIENT
        ? { visibility: Visibility.CLIENT }
        : {}),
    };

    return this.prisma.message.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            authorId: true,
            text: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async create(
    projectId: string,
    userId: string,
    data: {
      text: string;
      channel?: MessageChannel;
      visibility?: Visibility;
      contextType?: string;
      contextId?: string;
      replyToId?: string;
    },
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
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    const visibility =
      member.role === ProjectMemberRole.CLIENT
        ? Visibility.CLIENT
        : (data.visibility ?? Visibility.CLIENT);

    if (
      member.role === ProjectMemberRole.CLIENT &&
      visibility !== Visibility.CLIENT
    ) {
      throw new ForbiddenException(
        'Client messages must have CLIENT visibility',
      );
    }

    if (data.replyToId) {
      const replyTo = await this.prisma.message.findFirst({
        where: {
          id: data.replyToId,
          projectId,
        },
      });

      if (!replyTo) {
        throw new NotFoundException('Message to reply to not found');
      }

      if (
        member.role === ProjectMemberRole.CLIENT &&
        replyTo.visibility !== Visibility.CLIENT
      ) {
        throw new ForbiddenException(
          'Client cannot reply to an internal message',
        );
      }
    }

    const message = await this.prisma.message.create({
      data: {
        projectId,
        authorId: userId,
        channel: data.channel ?? MessageChannel.PORTAL,
        text: data.text,
        visibility,
        contextType: data.contextType,
        contextId: data.contextId,
        replyToId: data.replyToId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'MESSAGE_SENT',
      entityType: 'Message',
      entityId: message.id,
      visibility,
      metadata: {
        channel: message.channel,
        contextType: message.contextType,
        contextId: message.contextId,
      },
    });

    return message;
  }
}