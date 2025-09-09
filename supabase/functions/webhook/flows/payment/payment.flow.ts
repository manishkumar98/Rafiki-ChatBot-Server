// src/flows/payment/payment.flow.ts
import { conversationStateService } from "../../session/conversation-state.service.ts";
import { FlowHandler } from "../flow.interface.ts";

export class PaymentFlow implements FlowHandler {
  private readonly stateService = conversationStateService;

  canHandle(flow: string): boolean {
    return flow === "PAYMENT";
  }

  async handle(from: string, text: string, state: any) {
    this.stateService.update(from, { currentFlow: "PAYMENT", step: (state.step ?? 0) + 1 });

    if (!state.step || state.step === 0) {
      return "💳 Please provide your transaction ID for verification.";
    }

    if (state.step === 1) {
      return "✅ Payment verified. Thank you!";
    }

    return "⚠️ Unexpected step in payment flow. Please try again.";
  }
}

// Export singleton for re-use
export const paymentFlow = new PaymentFlow();
