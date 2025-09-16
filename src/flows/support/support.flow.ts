// src/flows/support/support.flow.ts
import { Injectable } from "@nestjs/common";
import { FlowHandler } from "../flow.interface";
import { ConversationStateService } from "../../session/conversation-state.service";
import { JobService } from "../../whatsapp/job.service";
import { SheetsService } from "../../sheets/sheets.service";

@Injectable()
export class SupportFlow implements FlowHandler {
  constructor(
    private readonly stateService: ConversationStateService,
    private readonly jobs: JobService,
    private readonly sheets: SheetsService
  ) {}

  canHandle(flow: string): boolean {
    return flow === "SUPPORT";
  }

  async start(from: string, lang: "EN" | "HI") {
    this.stateService.update(from, { currentFlow: "SUPPORT", step: 0 });

    const msg =
      lang === "EN"
        ? "📩 Please tell us your query. Our team will assist you soon."
        : "📩 कृपया हमें अपनी समस्या बताइए। हमारी टीम जल्द ही आपकी मदद करेगी।";

    await this.jobs.sendWhatsAppMessage(from, msg);
    return msg;
  }

  async handle(from: string, text: string, state: any) {
    const lang: "EN" | "HI" = (state.language ?? "EN") as "EN" | "HI";

    if (state.step === 0) {
      this.stateService.update(from, {
        supportQuery: text,
        step: 1,
      });
      try {
        await this.sheets.appendSupportRow(text, from);
      } catch (e) {
        console.error("❌ Failed to save support query to sheets", e);
      }
      const reply =
        lang === "EN"
          ? "🙏 Thank you! Your feedback has been recorded. Have a wonderful day! ✨\n\n👉 Type *hi* anytime to restart."
          : "🙏 धन्यवाद! आपका फ़ीडबैक रिकॉर्ड कर लिया गया है, आपका दिन शुभ हो! ✨\n\n👉 कभी भी पुनः प्रारंभ करने के लिए *hi* लिखें।";

      await this.jobs.sendWhatsAppMessage(from, reply,undefined,true);

      // reset after capturing query
      this.stateService.reset(from);
      this.stateService.update(from, { currentFlow: "WELCOME", step: 0 });

      return reply;
    }

    // default fallback (shouldn't normally reach here)
    return "";
  }
}
