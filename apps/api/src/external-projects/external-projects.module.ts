import { Module } from '@nestjs/common';
import { ExternalProjectsService } from './external-projects.service';
import { ExternalProjectsController } from './external-projects.controller';

@Module({
  controllers: [ExternalProjectsController],
  providers: [ExternalProjectsService],
  exports: [ExternalProjectsService],
})
export class ExternalProjectsModule {}
