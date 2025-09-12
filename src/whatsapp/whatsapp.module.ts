import { Module } from "@nestjs/common";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";
import { HttpModule } from "@nestjs/axios";
import { SessionService } from "../session/session.service";
import { SheetsService } from "../sheets/sheets.service";
import { ConversationStateService } from "src/session/conversation-state.service";
import { OpenAiService } from "./openai.service";
import { JobService } from "./job.service";
import { FlowRouter } from "../flows/flow-router.service";
import { JobFlow } from "../flows/job/job.flow";
import { FeedbackFlow } from "../flows/feedback/feedback.flow";
import { SupportFlow } from "../flows/support/support.flow";
import { NpsService } from "./nps.service";

@Module({
  imports: [HttpModule],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    SessionService,
    FlowRouter,
    SheetsService,
    ConversationStateService,
    OpenAiService,
    JobService,
    JobFlow,
    SupportFlow,
    FeedbackFlow,
    NpsService
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
