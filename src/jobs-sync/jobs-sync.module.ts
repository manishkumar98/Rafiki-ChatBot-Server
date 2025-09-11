import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsSyncService } from './jobs-sync.service';
import { JobsSyncController } from './jobs-sync.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [JobsSyncService],
  controllers: [JobsSyncController],
})
export class JobsSyncModule {}
