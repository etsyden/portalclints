import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
  ],
  controllers: [
    ProjectsController,
  ],
  providers: [
    ProjectsService,
  ],
})
export class ProjectsModule {}