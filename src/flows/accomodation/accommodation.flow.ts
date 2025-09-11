// import { Injectable } from "@nestjs/common";
// import { FlowHandler } from "../flow.interface";
// import { ConversationStateService } from "../../session/conversation-state.service";

// @Injectable()
// export class AccommodationFlow implements FlowHandler {
//   constructor(private readonly stateService: ConversationStateService) {}

//   canHandle(flow: string): boolean {
//     return flow === "ACCOMMODATION";
//   }

//   async handle(from: string, text: string, state: any) {
//     const step = state.step ?? 0;

//     // --- Step 0: Entry point ---
//     if (step === 0) {
//       this.stateService.update(from, { step: 1 });
//       return "🏠 Accommodation Support:\n\nKripya choose kijiye:\n1️⃣ Pehle se hi NIA Nest mein hoon\n2️⃣ New Accommodation chahiye";
//     }

//     // --- Step 1: Branch selection ---
//     if (step === 1) {
//       if (["1", "nest", "nia"].includes(text.toLowerCase())) {
//         this.stateService.update(from, { branch: "FEEDBACK", step: 2 });
//         return "🙏 Hi! Aap Nest mein stay kar rahe ho, isliye hum feedback lena chahte hain. 1 min lagega bas.\n\nApne stay ko 0 (bekar) se 10 (bahut badhiya) tak rate karo.";
//       }
//       if (["2", "new", "accommodation"].includes(text.toLowerCase())) {
//         this.stateService.update(from, { branch: "ONBOARDING", step: 2 });
//         return "📍 Aap kaunse sheher mein ho?";
//       }
//       return "❌ Invalid option. Kripya reply kijiye:\n1️⃣ NIA Nest mein hoon\n2️⃣ New Accommodation chahiye";
//     }

//     // --- Feedback Flow (Branch = FEEDBACK) ---
//     if (state.branch === "FEEDBACK") {
//       if (step === 2) {
//         this.stateService.update(from, {
//           step: 3,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), nestRating: text },
//         });
//         return "📝 Thanks! Aapke Nest stay ke baare mein thoda feedback dijiye.";
//       }
//       if (step === 3) {
//         this.stateService.update(from, {
//           step: 4,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), nestRemarks: text },
//         });
//         return "🍛 Kya aap Curry (food support) use karte ho?\n1️⃣ Haan\n2️⃣ Nahi";
//       }
//       if (step === 4) {
//         if (text === "1") {
//           this.stateService.update(from, {
//             step: 5,
//             nps_feedback_answers: { ...(state.nps_feedback_answers || {}), curryUser: true },
//           });
//           return "🍛 Curry rating dijiye (0–10).";
//         }
//         if (text === "2") {
//           this.stateService.update(from, {
//             step: 6,
//             nps_feedback_answers: { ...(state.nps_feedback_answers || {}), curryUser: false },
//           });
//           return "👷 Kya aapko job humari taraf se mila tha?\n1️⃣ Haan\n2️⃣ Nahi";
//         }
//         return "❌ Kripya valid option chuniye (1 ya 2).";
//       }
//       if (step === 5) {
//         this.stateService.update(from, {
//           step: 6,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), curryRating: text },
//         });
//         return "📝 Shukriya! Curry ka feedback likhiye.";
//       }
//       if (step === 6) {
//         this.stateService.update(from, {
//           step: 7,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), curryRemarks: text },
//         });
//         return "👷 Kya aapko job humari taraf se mila tha?\n1️⃣ Haan\n2️⃣ Nahi";
//       }
//       if (step === 7) {
//         if (text === "1") {
//           this.stateService.update(from, {
//             step: 8,
//             nps_feedback_answers: { ...(state.nps_feedback_answers || {}), gotJob: true },
//           });
//           return "💼 Apne job experience ko 0–10 tak rate kijiye.";
//         }
//         if (text === "2") {
//           this.stateService.update(from, {
//             step: 10,
//             nps_feedback_answers: { ...(state.nps_feedback_answers || {}), gotJob: false },
//           });
//           return "🌐 Overall NIA ki services ko 0–10 tak rate karo.";
//         }
//         return "❌ Kripya valid option chuniye (1 ya 2).";
//       }
//       if (step === 8) {
//         this.stateService.update(from, {
//           step: 9,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), jobRating: text },
//         });
//         return "📝 Job ke baare mein apna experience likhiye.";
//       }
//       if (step === 9) {
//         this.stateService.update(from, {
//           step: 10,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), jobRemarks: text },
//         });
//         return "🌐 Overall NIA ki services ko 0–10 tak rate karo.";
//       }
//       if (step === 10) {
//         this.stateService.update(from, {
//           step: 11,
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), niaRating: text },
//         });
//         return "📝 NIA ke baare mein feedback likhiye.";
//       }
//       if (step === 11) {
//         this.stateService.update(from, {
//           nps_feedback_answers: { ...(state.nps_feedback_answers || {}), niaRemarks: text },
//         });

//         // TODO: Save to sheet here with state.nps_feedback_answers

//         this.stateService.reset(from); // end
//         return "🎉 Dhanyawad! Aapka feedback record kar liya gaya hai. 🙏";
//       }
//     }

//     // --- Onboarding Flow (Branch = ONBOARDING) ---
//     if (state.branch === "ONBOARDING") {
//       if (step === 2) {
//         this.stateService.update(from, {
//           step: 3,
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), city: text },
//         });
//         return "📌 Aap kis area mein stay dhundh rahe ho?";
//       }
//       if (step === 3) {
//         this.stateService.update(from, {
//           step: 4,
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), area: text },
//         });
//         return "👤 Akele rahenge ya kisi ke saath?";
//       }
//       if (step === 4) {
//         this.stateService.update(from, {
//           step: 5,
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), stayType: text },
//         });
//         return "🕒 Kab se stay chahiye?";
//       }
//       if (step === 5) {
//         this.stateService.update(from, {
//           step: 6,
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), moveIn: text },
//         });
//         return "🍽️ Aapko food (Curry) ka option chahiye?\n1️⃣ Haan\n2️⃣ Nahi";
//       }
//       if (step === 6) {
//         this.stateService.update(from, {
//           step: 7,
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), foodRequired: text === "1" },
//         });
//         return (
//           "🎯 Based on aapki location, yeh options available hain:\n\n" +
//           "🏠 Option 1: Nest Bellandur (₹2,500/month + Curry ₹3,500)\n" +
//           "🏠 Option 2: Nest HSR Layout (₹3,000/month, Curry optional ₹3,000)\n\n" +
//           "Kripya option select kijiye."
//         );
//       }
//       if (step === 7) {
//         this.stateService.update(from, {
//           nps_onboarding_answers: { ...(state.nps_onboarding_answers || {}), selectedOption: text },
//         });

//         // TODO: Save to sheet here with state.nps_onboarding_answers

//         this.stateService.reset(from); // end
//         return `✅ Badhai ho! Aapka selection "${text}" record ho gaya hai. Representative aapse contact karega.`;
//       }
//     }

//     // --- Fallback ---
//     return "⚠️ Mujhe samajh nahi aaya. Kripya dobara try kijiye.";
//   }
// }

import { Injectable } from "@nestjs/common";
import { FlowHandler } from "../flow.interface";
import { ConversationStateService } from "../../session/conversation-state.service";
import { FeedbackFlow } from "./feedback.flow";
import { OnboardingFlow } from "./onboarding.flow";

@Injectable()
export class AccommodationFlow implements FlowHandler {
  constructor(
    private readonly stateService: ConversationStateService,
    private readonly feedbackFlow: FeedbackFlow,
    private readonly onboardingFlow: OnboardingFlow,
  ) {}

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
