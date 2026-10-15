import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { EventsModule } from './events/events.module';
import { RequestsModule } from './requests/requests.module';
import { MaterialsModule } from './materials/materials.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    AuthModule,
    ProjectsModule,
    EventsModule,
    RequestsModule,
    MaterialsModule,
    MessagesModule,
  ],
  controllers: [
    HealthController,
  ],
})
export class AppModule {}