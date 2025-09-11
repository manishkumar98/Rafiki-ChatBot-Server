import { Controller, Post } from '@nestjs/common';
import { JobsExportService } from './jobs-export.service';

@Controller('jobs-export')
export class JobsExportController {
  constructor(private readonly jobsExportService: JobsExportService) {}

  @Post('to-sheet')
  async exportToSheet() {
    return this.jobsExportService.exportToSheet();
  }
}
