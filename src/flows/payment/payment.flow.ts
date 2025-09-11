import { Injectable } from "@nestjs/common";
import { FlowHandler } from "../flow.interface";
import { ConversationStateService } from "../../session/conversation-state.service";

@Injectable()
export class PaymentFlow implements FlowHandler {
  constructor(private readonly stateService: ConversationStateService) {}

  canHandle(flow: string): boolean {
    return flow === "PAYMENT";
  }

  async handle(from: string, text: string, state: any) {
    this.stateService.update(from, { currentFlow: "PAYMENT", step: state.step + 1 });

    if (state.step === 0) {
      return "💳 Please provide your transaction ID for verification.";
    }

    if (state.step === 1) {
      return "✅ Payment verified. Thank you!";
    }
  }
}
