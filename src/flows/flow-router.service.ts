import { Injectable } from "@nestjs/common";
import { JobFlow } from "./job/job.flow";
// import { AccommodationFlow } from "./accomodation/accommodation.flow";
import { ConversationStateService } from "../session/conversation-state.service";
import { JobService } from "../whatsapp/job.service";
import { SupportFlow } from "./support/support.flow";
import { FeedbackFlow } from "./feedback/feedback.flow";

@Injectable()
export class FlowRouter {
  constructor(
    private jobFlow: JobFlow,
    // private accommodationFlow: AccommodationFlow,
    private supportFlow: SupportFlow,
    private feedbackFlow: FeedbackFlow,
    private stateService: ConversationStateService,
    private jobs: JobService
  ) { }

  async route(flow: string, from: string, text: string, state: any) {
    switch (flow) {
      case "LANGUAGE":
        return this.handleLanguage(from, text, state);
      case "MAIN_MENU":
        return this.handleMainMenu(from, text, state);
      case "JOB":
        return this.jobFlow.handle(from, text, state);
      // case "ACCOMMODATION":
      //   return this.accommodationFlow.handle(from, text, state);
      case "SUPPORT":
        return this.supportFlow.handle(from, text, state);
      case "FEEDBACK":
        return this.feedbackFlow.handle(from, text, state);
      default:
        return this.fallback(from);
    }
  }

  private async handleLanguage(from: string, text: string, state: any) {
    if (!["lang_en", "lang_hi"].includes(text)) {
      await this.jobs.sendWhatsAppMessage(from, "❌ Invalid choice. Please select a language:", [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" },
      ]);
      return `❌ Invalid choice. Please select a language:", [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" },
      ]`
    }

    const lang = text === "lang_hi" ? "HI" : "EN";
    this.stateService.update(from, { language: lang, currentFlow: "MAIN_MENU", step: 0 });

    await this.jobs.sendWhatsAppMessage(
      from,
      lang === "EN" ? "What kind of help do you need?💼🚀" : "आपको किस प्रकार की मदद चाहिए?",
      [
        { id: "menu_job", title: lang === "EN" ? "Job Opportunities" : "नौकरी" },
        { id: "menu_kyc", title: lang === "EN" ? "Complete KYC" : "KYC पूरा करें" },
        { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
      ]
    );
    return `lang === "EN" ? "What kind of help do you need??" : "आपको किस प्रकार की मदद चाहिए?",
      [
       { id: "menu_job", title: lang === "EN" ? "Job Opportunities" : "नौकरी" },
        { id: "menu_kyc", title: lang === "EN" ? "Complete KYC" : "KYC पूरा करें" },
        { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
      ]`
  }

  private async handleMainMenu(from: string, text: string, state: any) {
    const lang = (state?.language ?? "EN") as "EN" | "HI";

    switch (text) {
      case "menu_job":
        this.stateService.update(from, { currentFlow: "JOB", step: 0, job: { phase: "COMMON" } });
        return this.jobFlow.start(from, lang);
      // case "menu_accommodation":
      //   this.stateService.update(from, { currentFlow: "ACCOMMODATION", step: 0 });
      //   return this.accommodationFlow.handle(from, text, state);
      case "menu_support":
        this.stateService.update(from, { currentFlow: "SUPPORT", step: 0 });
        return this.supportFlow.start(from, lang);
      case "menu_kyc":
        this.stateService.update(from, {
          currentFlow: "JOB",
          step: 0,
          job: { phase: "KYC" },
          kyc_intro: true, // 👈 flag to detect custom intro question
        });

        await this.jobs.sendWhatsAppMessage(
          from,
          lang === "EN"
            ? "👉 Where did you hear about the Rafiki app?"
            : "👉 आपको Rafiki ऐप के बारे में कहाँ से पता चला?",
          [
            { id: "kyc_instagram", title: "Instagram / Facebook" },
            { id: "kyc_friend", title: lang === "EN" ? "Friend" : "दोस्त" },
            { id: "kyc_employee", title: lang === "EN" ? "Employee" : "कर्मचारी" },
          ]
        );

        return ` [
          { id: "kyc_instagram", title: "Instagram / Facebook" },
          { id: "kyc_friend", title: lang === "EN" ? "Friend" : "दोस्त" },
          { id: "kyc_employee", title: lang === "EN" ? "Employee" : "कर्मचारी" },
        ]`;
      default:
        await this.jobs.sendWhatsAppMessage(
          from,
          lang === "EN" ? "❌ Invalid choice. Please select an option:" : "❌ गलत विकल्प। कृपया एक विकल्प चुनें:",
          [
            { id: "menu_kyc", title: lang === "EN" ? "Complete KYC" : "KYC पूरा करें" },
            { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
            { id: "menu_kyc", title: lang === "EN" ? "KYC" : "KYC" },
          ]
        );
        return `"❌ Invalid choice. Please select an option:" : "❌ गलत विकल्प। कृपया एक विकल्प चुनें:",
          [
            { id: "menu_job", title: lang === "EN" ? "Job Opportunities" : "नौकरी" },
            { id: "menu_kyc", title: lang === "EN" ? "Complete KYC" : "KYC पूरा करें" },
            { id: "menu_support", title: lang === "EN" ? "Customer Support" : "ग्राहक सहायता" },
          ]`
    }
  }


  private async fallback(from: string) {
    this.stateService.reset(from);
    this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });

    await this.jobs.sendWhatsAppMessage(
      from,
      "👋 Hi! I am Rafiki – your friend. Please choose your language before we begin:",
      [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" },
      ], true
    );

    return ` "👋 Hi! I am Rafiki – your friend. Please choose your language before we begin:",
    [
      { id: "lang_en", title: "English" },
      { id: "lang_hi", title: "हिंदी" },
    ]`
  }
}
