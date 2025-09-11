import { Injectable } from "@nestjs/common";
import { FlowHandler } from "../flow.interface";
import { ConversationStateService } from "../../session/conversation-state.service";
import { JobService } from "../../whatsapp/job.service";
import { onboardingQuestions } from "../../constants/nps_constants";

@Injectable()
export class OnboardingFlow implements FlowHandler {
  constructor(
    private readonly stateService: ConversationStateService,
    private readonly jobs: JobService,
  ) {}

  canHandle(flow: string): boolean {
    return flow === "ONBOARDING";
  }

  private randomQ(key: keyof typeof onboardingQuestions): string {
    const qs = onboardingQuestions[key];
    return qs[Math.floor(Math.random() * qs.length)];
  }

  async handle(from: string, text: string, state: any) {
    const step = state.step;

    if (step === 2) {
      this.stateService.update(from, {
        step: 3,
        nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), city: text },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("area"));
      return this.randomQ("area");
    }

    if (step === 3) {
      this.stateService.update(from, {
        step: 4,
        nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), area: text },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("stayType"));
      return this.randomQ("stayType");
    }

    if (step === 4) {
      this.stateService.update(from, {
        step: 5,
        nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), stayType: text },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("moveIn"));
      return this.randomQ("moveIn");
    }

    if (step === 5) {
      this.stateService.update(from, {
        step: 6,
        nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), moveIn: text },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("foodRequired"), [
        { id: "1", title: "✅ Haan" },
        { id: "2", title: "❌ Nahi" },
      ]);
      return this.randomQ("foodRequired");
    }

    if (step === 6) {
      this.stateService.update(from, {
        step: 7,
        nps_onboarding_answers: {
          ...(state.nps_onboarding_answers || {}),
          foodRequired: text === "1",
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("options"));
      return this.randomQ("options");
    }

    if (step === 7) {
      this.stateService.update(from, {
        nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), selectedOption: text },
      });
      this.stateService.reset(from);
      const msg = this.randomQ("confirm").replace("record ho gaya hai", `"${text}" record ho gaya hai`);
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    return "⚠️ Invalid input in onboarding flow.";
  }
}
