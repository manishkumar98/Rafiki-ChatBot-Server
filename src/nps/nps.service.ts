import { Cron } from "@nestjs/schedule";
import { Injectable, Logger } from "@nestjs/common";
import { SheetsService } from "../sheets/sheets.service";
import { FlowRouter } from "../flows/flow-router.service";
import { ConversationStateService } from "../session/conversation-state.service";

@Injectable()
export class NpsService {
    private readonly logger = new Logger(NpsService.name);

    constructor(
        private sheets: SheetsService,
        private flowRouter: FlowRouter,
        private stateService: ConversationStateService,
    ) { }

    async triggerBatch() {
        const numbers = await this.sheets.readNumbers();
        console.log(`📋 Found ${numbers.length} valid numbers to process`);

        for (const { phone, type } of numbers) {
            try {
                this.stateService.reset(phone);
                this.stateService.update(phone, {
                    currentFlow: "FEEDBACK",
                    step: 0,
                    feedback_type: type || "ALL",
                    nps_feedback_answers: {},
                });

                const state = this.stateService.get(phone);
                await this.flowRouter.route("FEEDBACK", phone, "__INIT__", state);

                console.log(`✅ Successfully triggered flow for ${phone} (${type})`);
            } catch (err) {
                console.error(`❌ Failed for ${phone}:`, err.message || err);
            }

            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    @Cron("0 10 * * *")
    async runDailyBatch() {
        this.logger.log("Running daily NPS batch");
        await this.triggerBatch();
    }

}
