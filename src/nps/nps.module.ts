import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NpsService } from "./nps.service";
import { NpsController } from "./nps.controller";
import { JobService } from "../whatsapp/job.service";
import { FlowRouter } from "../flows/flow-router.service";
import { JobFlow } from "../flows/job/job.flow";
import { SheetsService } from "../sheets/sheets.service";
import { ConversationStateService } from "src/session/conversation-state.service";
import { FeedbackFlow } from "../flows/feedback/feedback.flow";
import { SupportFlow } from "../flows/support/support.flow";
import { OpenAiService } from "../whatsapp/openai.service";

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [NpsController],
    providers: [
        NpsService, 
        FlowRouter,
        SheetsService,
        ConversationStateService,
        FeedbackFlow,
        SupportFlow,
        JobFlow,
        JobService,
         OpenAiService,
    ],
})
export class NpsModule { }
