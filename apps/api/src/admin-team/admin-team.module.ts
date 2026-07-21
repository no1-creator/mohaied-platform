import { Module } from '@nestjs/common';
import { AdminTeamService } from './admin-team.service';
import { AdminTeamController } from './admin-team.controller';

@Module({
  controllers: [AdminTeamController],
  providers: [AdminTeamService],
})
export class AdminTeamModule {}
