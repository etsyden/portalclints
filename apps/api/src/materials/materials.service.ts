import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  MaterialType,
  ProjectMemberRole,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class MaterialsService {
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

    const where =
      member.role === 'CLIENT'
        ? {
          projectId,
          visibility: Visibility.CLIENT,
        }
        : {
          projectId,
        };

    return this.prisma.material.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async requestApproval(
    projectId: string,
    materialId: string,
    versionId: string,
    userId: string,
    comment?: string,
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

    if (
      member.role !== ProjectMemberRole.ADMIN &&
      member.role !== ProjectMemberRole.PROJECT_MANAGER &&
      member.role !== ProjectMemberRole.EXECUTOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to request approval',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id: materialId,
        projectId,
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const version = await this.prisma.materialVersion.findFirst({
      where: {
        id: versionId,
        materialId,
      },
    });

    if (!version) {
      throw new NotFoundException('Material version not found');
    }

    const existingApproval =
      await this.prisma.approval.findFirst({
        where: {
          materialVersionId: versionId,
          status: 'PENDING',
        },
      });

    if (existingApproval) {
      return existingApproval;
    }

    const approval = await this.prisma.approval.create({
      data: {
        projectId,
        materialVersionId: versionId,
        requestedById: userId,
        status: 'PENDING',
        comment: comment ?? '',
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'APPROVAL_REQUESTED',
      entityType: 'Approval',
      entityId: approval.id,
      visibility: Visibility.CLIENT,
      metadata: {
        materialId,
        versionId,
        versionNumber: version.versionNumber,
      },
    });

    return approval;
  }

  async decideApproval(
    projectId: string,
    materialId: string,
    versionId: string,
    userId: string,
    status: ApprovalStatus,
    comment?: string,
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

    if (member.role !== ProjectMemberRole.CLIENT) {
      throw new ForbiddenException(
        'Only the client can decide approval',
      );
    }

    if (
      status !== ApprovalStatus.APPROVED &&
      status !== ApprovalStatus.CHANGES_REQUESTED
    ) {
      throw new ForbiddenException(
        'Invalid approval decision',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id: materialId,
        projectId,
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const version = await this.prisma.materialVersion.findFirst({
      where: {
        id: versionId,
        materialId,
      },
    });

    if (!version) {
      throw new NotFoundException('Material version not found');
    }

    const approval = await this.prisma.approval.findFirst({
      where: {
        projectId,
        materialVersionId: versionId,
        status: ApprovalStatus.PENDING,
      },
    });

    if (!approval) {
      throw new NotFoundException(
        'Pending approval not found',
      );
    }

    const updatedApproval =
      await this.prisma.approval.update({
        where: {
          id: approval.id,
        },
        data: {
          status,
          approvedById: userId,
          comment: comment ?? approval.comment,
          approvedAt: new Date(),
        },
      });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType:
        status === ApprovalStatus.APPROVED
          ? 'APPROVED'
          : 'CHANGES_REQUESTED',
      entityType: 'Approval',
      entityId: approval.id,
      visibility: Visibility.CLIENT,
      metadata: {
        materialId,
        versionId,
        versionNumber: version.versionNumber,
      },
    });

    return updatedApproval;
  }

  async createVersion(
    projectId: string,
    materialId: string,
    userId: string,
    data: {
      changeSummary?: string;
      provider?: string;
      externalUrl?: string;
      externalFileId?: string;
      externalVersionId?: string;
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

    if (
      member.role !== ProjectMemberRole.ADMIN &&
      member.role !== ProjectMemberRole.PROJECT_MANAGER &&
      member.role !== ProjectMemberRole.EXECUTOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to create material versions',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id: materialId,
        projectId,
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const lastVersion = await this.prisma.materialVersion.findFirst({
      where: {
        materialId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await this.prisma.materialVersion.create({
      data: {
        materialId,
        createdById: userId,
        versionNumber,
        changeSummary: data.changeSummary ?? '',
        previousVersionId: lastVersion?.id,
        provider: data.provider,
        externalUrl: data.externalUrl,
        externalFileId: data.externalFileId,
        externalVersionId: data.externalVersionId,
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'VERSION_CREATED',
      entityType: 'MaterialVersion',
      entityId: version.id,
      visibility: material.visibility,
      metadata: {
        materialId: material.id,
        versionNumber,
      },
    });

    return version;
  }

  async share(
    projectId: string,
    materialId: string,
    userId: string,
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

    if (
      member.role !== ProjectMemberRole.ADMIN &&
      member.role !== ProjectMemberRole.PROJECT_MANAGER &&
      member.role !== ProjectMemberRole.EXECUTOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to share materials',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id: materialId,
        projectId,
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (material.visibility === Visibility.CLIENT) {
      return material;
    }

    const updatedMaterial = await this.prisma.material.update({
      where: {
        id: materialId,
      },
      data: {
        visibility: Visibility.CLIENT,
        updatedAt: new Date(),
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'MATERIAL_SHARED',
      entityType: 'Material',
      entityId: material.id,
      visibility: Visibility.CLIENT,
    });

    return updatedMaterial;
  }

  async create(
    projectId: string,
    userId: string,
    title: string,
    description?: string,
    type: MaterialType = MaterialType.FILE,
    visibility: Visibility = Visibility.INTERNAL,
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

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const material = await this.prisma.material.create({
      data: {
        projectId,
        createdById: userId,
        title,
        description: description ?? '',
        type,
        visibility,
      },
    });

    await this.eventsService.create({
      projectId,
      actorId: userId,
      eventType: 'MATERIAL_ADDED',
      entityType: 'Material',
      entityId: material.id,
      visibility,
    });

    return material;
  }
}