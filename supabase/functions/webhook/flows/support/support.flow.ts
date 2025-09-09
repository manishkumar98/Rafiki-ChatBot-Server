// src/flows/support/support.flow.ts
import { FlowHandler } from "../flow.interface.ts";
import { conversationStateService } from "../../session/conversation-state.service.ts";
import { jobService } from "../../../shared/job.service.ts";
import { sheetService, SheetsService } from "../../../shared/sheet.service.ts";

export class SupportFlow implements FlowHandler {
  private readonly stateService = conversationStateService;
  private readonly jobs = jobService;
  private readonly sheets = sheetService;

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
          ? "✅ Thanks! Our representative will contact you shortly."
          : "✅ धन्यवाद! हमारा प्रतिनिधि आपसे शीघ्र संपर्क करेगा।";

      await this.jobs.sendWhatsAppMessage(from, reply);

      // Reset after capturing query
      this.stateService.reset(from);
      this.stateService.update(from, { currentFlow: "WELCOME", step: 0 });

      return reply;
    }

    // Default fallback (shouldn’t normally reach here)
    return "";
  }
}

// Export singleton instance for use
export const supportFlow = new SupportFlow();