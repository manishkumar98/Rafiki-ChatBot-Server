// supabase/functions/_shared/flows/feedback-flow.ts
import { jobService } from "../../../shared/job.service.ts";
import { feedbackQuestions } from "../../constants/nps_constants.ts";
import { conversationStateService } from "../../session/conversation-state.service.ts";
import { FlowHandler } from "../flow.interface.ts";

export class FeedbackFlow implements FlowHandler {
  private stateService = conversationStateService;
  private jobs = jobService;

  canHandle(flow: string): boolean {
    return flow === "FEEDBACK";
  }

  private randomQ(key: keyof typeof feedbackQuestions): string {
    const qs = feedbackQuestions[key];
    return qs[Math.floor(Math.random() * qs.length)];
  }

  async handle(from: string, text: string, state: any) {
    const step = state.step ?? 2;

    if (step === 2) {
      this.stateService.update(from, {
        step: 3,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          nestRating: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("nestRemarks"));
      return this.randomQ("nestRemarks");
    }

    if (step === 3) {
      this.stateService.update(from, {
        step: 4,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          nestRemarks: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("curryUser"), [
        { id: "1", title: "✅ Haan" },
        { id: "2", title: "❌ Nahi" },
      ]);
      return this.randomQ("curryUser");
    }

    if (step === 4) {
      if (text === "1") {
        this.stateService.update(from, {
          step: 5,
          nps_feedback_answers: {
            ...(state.nps_feedback_answers || {}),
            curryUser: true,
          },
        });
        await this.jobs.sendWhatsAppMessage(from, this.randomQ("curryRating"));
        return this.randomQ("curryRating");
      }
      if (text === "2") {
        this.stateService.update(from, {
          step: 6,
          nps_feedback_answers: {
            ...(state.nps_feedback_answers || {}),
            curryUser: false,
          },
        });
        await this.jobs.sendWhatsAppMessage(from, this.randomQ("gotJob"), [
          { id: "1", title: "✅ Haan" },
          { id: "2", title: "❌ Nahi" },
        ]);
        return this.randomQ("gotJob");
      }
      return "❌ Kripya valid option chuniye (1 ya 2).";
    }

    if (step === 5) {
      this.stateService.update(from, {
        step: 6,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          curryRating: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("curryRemarks"));
      return this.randomQ("curryRemarks");
    }

    if (step === 6) {
      this.stateService.update(from, {
        step: 7,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          curryRemarks: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("gotJob"), [
        { id: "1", title: "✅ Haan" },
        { id: "2", title: "❌ Nahi" },
      ]);
      return this.randomQ("gotJob");
    }

    if (step === 7) {
      if (text === "1") {
        this.stateService.update(from, {
          step: 8,
          nps_feedback_answers: {
            ...(state.nps_feedback_answers || {}),
            gotJob: true,
          },
        });
        await this.jobs.sendWhatsAppMessage(from, this.randomQ("jobRating"));
        return this.randomQ("jobRating");
      }
      if (text === "2") {
        this.stateService.update(from, {
          step: 10,
          nps_feedback_answers: {
            ...(state.nps_feedback_answers || {}),
            gotJob: false,
          },
        });
        await this.jobs.sendWhatsAppMessage(from, this.randomQ("niaRating"));
        return this.randomQ("niaRating");
      }
      return "❌ Kripya valid option chuniye (1 ya 2).";
    }

    if (step === 8) {
      this.stateService.update(from, {
        step: 9,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          jobRating: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("jobRemarks"));
      return this.randomQ("jobRemarks");
    }

    if (step === 9) {
      this.stateService.update(from, {
        step: 10,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          jobRemarks: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("niaRating"));
      return this.randomQ("niaRating");
    }

    if (step === 10) {
      this.stateService.update(from, {
        step: 11,
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          niaRating: text,
        },
      });
      await this.jobs.sendWhatsAppMessage(from, this.randomQ("niaRemarks"));
      return this.randomQ("niaRemarks");
    }

    if (step === 11) {
      this.stateService.update(from, {
        nps_feedback_answers: {
          ...(state.nps_feedback_answers || {}),
          niaRemarks: text,
        },
      });
      this.stateService.reset(from);
      return "🎉 Dhanyawad! Aapka feedback record kar liya gaya hai. 🙏";
    }

    return "⚠️ Invalid input in feedback flow.";
  }
}

// ✅ Export a singleton
export const feedbackFlow = new FeedbackFlow();
