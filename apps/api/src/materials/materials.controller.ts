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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateMaterialVersionDto } from './dto/create-material-version.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { DecideApprovalDto } from './dto/decide-approval.dto';

@Controller('projects/:projectId/materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
  ) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.findAll(
      projectId,
      req.user.userId,
    );
  }

  @Post(':materialId/versions/:versionId/approval')
  requestApproval(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Param('versionId') versionId: string,
    @Body() dto: CreateApprovalDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.requestApproval(
      projectId,
      materialId,
      versionId,
      req.user.userId,
      dto.comment,
    );
  }

  @Post(':materialId/versions/:versionId/approval/decision')
  decideApproval(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Param('versionId') versionId: string,
    @Body() dto: DecideApprovalDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.decideApproval(
      projectId,
      materialId,
      versionId,
      req.user.userId,
      dto.status,
      dto.comment,
    );
  }

  @Post(':materialId/versions')
  createVersion(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Body() dto: CreateMaterialVersionDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.createVersion(
      projectId,
      materialId,
      req.user.userId,
      dto,
    );
  }

  @Post(':materialId/share')
  share(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.share(
      projectId,
      materialId,
      req.user.userId,
    );
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMaterialDto,
    @NestRequest() req: { user: { userId: string } },
  ) {
    return this.materialsService.create(
      projectId,
      req.user.userId,
      dto.title,
      dto.description,
      dto.type,
      dto.visibility,
    );
  }
}