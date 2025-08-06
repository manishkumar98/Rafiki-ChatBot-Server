import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { FlowService } from '../flow/flow.service';
import { SessionService } from '../session/session.service';

@Module({
  imports: [HttpModule], // Needed for sending requests to Meta API
  controllers: [WhatsappController],
  providers: [WhatsappService, FlowService, SessionService],
  exports: [WhatsappService], // In case other modules like FlowService need to send WhatsApp messages
})
export class WhatsappModule {}
