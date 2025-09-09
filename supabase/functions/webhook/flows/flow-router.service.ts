// src/flows/flow-router.ts

import { jobService } from "../../shared/job.service.ts";
import { conversationStateService } from "../session/conversation-state.service.ts";
import { feedbackFlow } from "./accomodation/feedback.flow.ts";
import { jobFlow } from "./job/job.flow.ts";
import { supportFlow } from "./support/support.flow.ts";

export class FlowRouter {
  private readonly stateService = conversationStateService;
  private readonly jobs = jobService;

  async route(flow: string, from: string, text: string, state: any) {
    switch (flow) {
      case "LANGUAGE":
        return this.handleLanguage(from, text, state);
      case "MAIN_MENU":
        return this.handleMainMenu(from, text, state);
      case "JOB":
        return jobFlow.handle(from, text, state);
      // case "ACCOMMODATION":
      //   return accommodationFlow.handle(from, text, state);
      case "SUPPORT":
        return supportFlow.handle(from, text, state);
      case "FEEDBACK":
        return feedbackFlow.handle(from, text, state);
      default:
        return this.fallback(from);
    }
  }

  private async handleLanguage(from: string, text: string, state: any) {
    if (!["lang_en", "lang_hi"].includes(text)) {
      const msg = "❌ Invalid choice. Please select a language:";
      await this.jobs.sendWhatsAppMessage(from, msg, [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" },
      ]);
      return msg;
    }

    const lang = text === "lang_hi" ? "HI" : "EN";
    this.stateService.update(from, { language: lang, currentFlow: "MAIN_MENU", step: 0 });

    const replyMsg = lang === "EN"
      ? "Aapko kis prakar ki madad chahiye?💼🚀"
      : "आपको किस प्रकार की मदद चाहिए?";

    await this.jobs.sendWhatsAppMessage(from, replyMsg, [
      { id: "menu_job", title: lang === "EN" ? "Job Opportunities" : "नौकरी" },
      { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
      // { id: "menu_accommodation", title: lang === "EN" ? "Accommodation Support" : "रहने/खाने की सहायता" },
    ]);

    return replyMsg;
  }

  private async handleMainMenu(from: string, text: string, state: any) {
    const lang = (state?.language ?? "EN") as "EN" | "HI";

    switch (text) {
      case "menu_job":
        this.stateService.update(from, { currentFlow: "JOB", step: 0, job: { phase: "COMMON" } });
        return jobFlow.start(from, lang);
      // case "menu_accommodation":
      //   this.stateService.update(from, { currentFlow: "ACCOMMODATION", step: 0 });
      //   return accommodationFlow.handle(from, text, state);
      case "menu_support":
        this.stateService.update(from, { currentFlow: "SUPPORT", step: 0 });
        return supportFlow.start(from, lang);
      default:
        const msg = lang === "EN"
          ? "❌ Invalid choice. Please select an option:"
          : "❌ गलत विकल्प। कृपया एक विकल्प चुनें:";
        await this.jobs.sendWhatsAppMessage(from, msg, [
          { id: "menu_job", title: lang === "EN" ? "Job Opportunities" : "नौकरी" },
          // { id: "menu_accommodation", title: lang === "EN" ? "Accommodation Support" : "रहने/खाने की सहायता" },
          { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
        ]);
        return msg;
    }
  }

  private async fallback(from: string) {
    this.stateService.reset(from);
    this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });

    const msg = "👋 Hi! Main hoon Rafiki – aapka dost.\n\nIsse pehle ke hum shuru karein, kripya apni language choose karein:";
    await this.jobs.sendWhatsAppMessage(from, msg, [
      { id: "lang_en", title: "English" },
      { id: "lang_hi", title: "हिंदी" },
    ]);

    return msg;
  }
}

// Export singleton instance
export const flowRouter = new FlowRouter();
