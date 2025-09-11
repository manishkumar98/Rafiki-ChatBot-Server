import { Controller, Post } from '@nestjs/common';
import { JobsSyncService } from './jobs-sync.service';

@Controller('jobs-sync')
export class JobsSyncController {
  constructor(private readonly jobsSyncService: JobsSyncService) {}

  @Post('run')
  async runSync() {
    return this.jobsSyncService.syncJobs();
  }
}
