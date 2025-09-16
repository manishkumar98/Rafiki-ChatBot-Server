import { Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { ConversationStateService } from "../session/conversation-state.service";
import { JobService } from "./job.service";
import { FlowRouter } from "../flows/flow-router.service";
import { NpsService } from "./nps.service";


@Controller("webhook")
export class WhatsappController {
  constructor(
    private stateService: ConversationStateService,
    private jobs: JobService,
    private nps: NpsService,
    private flowRouter: FlowRouter,
  ) { }


  @Post()
  async webhookV1(@Req() req: any) {
    if (req?.body?.nps) {
      const from = String(req.body.nps.from || "").trim();
      const feedbackType = req.body.nps.type;
      if (!from || !feedbackType) return "NPS: 'from' missing";

      this.stateService.reset(from);
      this.stateService.update(from, {
        currentFlow: "FEEDBACK",
        step: 0,
        feedback_type: feedbackType,
        nps_feedback_answers: {},
      });
      const state = this.stateService.get(from);
      return this.flowRouter.route("FEEDBACK", from, "__INIT__", state);
    }
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from;
    let text: string | undefined = message?.text?.body?.trim();

    if (message?.type === "interactive") {
      const interactiveType = message.interactive?.type;
      if (interactiveType === "button_reply") {
        text = message.interactive?.button_reply?.id;
      } else if (interactiveType === "list_reply") {
        text = message.interactive?.list_reply?.id;
      }
    } else if (["image", "document", "video", "audio"].includes(message?.type)) {
      text = message;
    }

    if (!from || !text) return "Text or from is missing";
    console.log(`check type for text`, typeof text, text);
    if (typeof text === "string" && ["r", "hi", "hello", "start"].includes(text.toLowerCase())) {
      const state = this.stateService.get(from);

      // Special case: restart Feedback flow
      if (text.toLowerCase() === "r" && state.currentFlow === "FEEDBACK") {
        this.stateService.update(from, { currentFlow: "FEEDBACK", step: 0 });
        return this.flowRouter.route("FEEDBACK", from, "__INIT__", state);
      }
      this.stateService.reset(from);
      this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });

      await this.jobs.sendWhatsAppMessage(from,
        "👋 Hi! I am Rafiki – your friend. Please choose your language before we begin:",
        [
          { id: "lang_en", title: "English" },
          { id: "lang_hi", title: "हिंदी" },
        ]
      );

      return `Hi! I am Rafiki – your friend. Please choose your language before we begin:
      Choose language:
      1. English (reply LANG_EN)
      2. Hindi (reply LANG_HI)`
    }

    const state = this.stateService.get(from);
    console.log("Current state:", JSON.stringify(state.answers), state.currentFlow, text);
    return this.flowRouter.route(state.currentFlow ?? "WELCOME", from, text, state)
  }

  @Post("trigger-nps")
  async triggerNps() {
    return this.nps.triggerBatch();
  }

  @Get()
  async verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
    @Res() res: any
  ) {
    if (mode && token && mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log("Webhook verified ✅");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
}
