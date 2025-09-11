import { Module } from '@nestjs/common';
import { JobsExportService } from './jobs-export.service';
import { JobsExportController } from './jobs-export.controller';

@Module({
  providers: [JobsExportService],
  controllers: [JobsExportController],
  exports: [JobsExportService],
})
export class JobsExportModule {}
