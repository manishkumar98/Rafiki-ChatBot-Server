import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SupabaseModule } from './shared/supabase.module';
import { JobsSyncModule } from './jobs-sync/jobs-sync.module';
import { JobsExportModule } from './jobs-export/jobs-export.module';
import { NpsModule } from './nps/nps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WhatsappModule,
    SupabaseModule,
    JobsSyncModule,
    JobsExportModule,
    NpsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
