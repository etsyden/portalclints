import { Injectable } from '@nestjs/common';
import { EventType, Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    projectId: string;
    actorId?: string;
    eventType: EventType;
    entityType: string;
    entityId?: string;
    visibility?: Visibility;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.event.create({
      data: {
        projectId: params.projectId,
        actorId: params.actorId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        visibility: params.visibility ?? Visibility.INTERNAL,
        metadata: params.metadata,
      },
    });
  }
}