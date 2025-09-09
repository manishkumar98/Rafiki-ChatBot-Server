// supabase/functions/_shared/flows/accommodation-flow.ts
import { conversationStateService } from "../../session/conversation-state.service.ts";
import { FlowHandler } from "../flow.interface.ts";
import { feedbackFlow } from "./feedback.flow.ts";
import { onboardingFlow } from "./onboarding.flow.ts";

export class AccommodationFlow implements FlowHandler {
  private stateService = conversationStateService;
  private feedbackFlow = feedbackFlow;
  private onboardingFlow = onboardingFlow;

  canHandle(flow: string): boolean {
    return flow === "ACCOMMODATION";
  }

  async handle(from: string, text: string, state: any) {
    const step = state.step ?? 0;

    // Step 0 → Entry point
    if (step === 0) {
      this.stateService.update(from, { step: 1 });
      return "🏠 Accommodation Support:\n\nKripya choose kijiye:\n1️⃣ Pehle se hi NIA Nest mein hoon\n2️⃣ New Accommodation chahiye";
    }

    // Step 1 → Branch selection
    if (step === 1) {
      if (["1", "nest", "nia"].includes(text.toLowerCase())) {
        this.stateService.update(from, { branch: "FEEDBACK", step: 2 });
        return this.feedbackFlow.handle(from, text, { ...state, branch: "FEEDBACK", step: 2 });
      }
      if (["2", "new", "accommodation"].includes(text.toLowerCase())) {
        this.stateService.update(from, { branch: "ONBOARDING", step: 2 });
        return this.onboardingFlow.handle(from, text, { ...state, branch: "ONBOARDING", step: 2 });
      }
      return "❌ Invalid option. Kripya reply kijiye:\n1️⃣ NIA Nest mein hoon\n2️⃣ New Accommodation chahiye";
    }

    // Delegate based on branch
    if (state.branch === "FEEDBACK") {
      return this.feedbackFlow.handle(from, text, state);
    }
    if (state.branch === "ONBOARDING") {
      return this.onboardingFlow.handle(from, text, state);
    }

    return "⚠️ Mujhe samajh nahi aaya. Kripya dobara try kijiye.";
  }
}

// ✅ Export a singleton
export const accommodationFlow = new AccommodationFlow();
