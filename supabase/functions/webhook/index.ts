// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Container } from "./container.ts";


const stateService = Container.getConversationStateService();
const jobs = Container.getJobService();
const flowRouter = Container.getFlowRouter();

Deno.serve(async (req) => {
  if (req.method === "GET") {
    const { pathname, searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode && token && mode === "subscribe" && token === Deno.env.get("WEBHOOK_VERIFY_TOKEN")) {
      console.log("Webhook verified ✅");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();

      // --- NPS flow ---
      if (body?.nps) {
        const from = String(body.nps.from || "").trim();
        const feedbackType = body.nps.type;
        if (!from || !feedbackType) {
          return new Response("NPS: 'from' missing", { status: 400 });
        }

        stateService.reset(from);
        stateService.update(from, {
          currentFlow: "FEEDBACK",
          step: 0,
          feedback_type: feedbackType,
          nps_feedback_answers: {},
        });
        const state = stateService.get(from);
        const reply = await flowRouter.route("FEEDBACK", from, "__INIT__", state);
        return new Response(reply, { status: 200 });
      }

      // --- WhatsApp message flow ---
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const from = message?.from;
      let text: string | any = message?.text?.body?.trim();

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

      if (!from || !text) {
        return new Response("Text or from is missing", { status: 400 });
      }

      console.log("Incoming:", typeof text, text);

      // Restart flow on "hi"/"start"
      if (typeof text === "string" && ["r", "hi", "hello", "start"].includes(text.toLowerCase())) {
        stateService.reset(from);
        stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });

        await jobs.sendWhatsAppMessage(
          from,
          "👋 Hi! Main hoon Rafiki – aapka dost.\n\nIsse pehle ke hum shuru karein, kripya apni language choose karein:",
          [
            { id: "lang_en", title: "English" },
            { id: "lang_hi", title: "हिंदी" },
          ],
        );

        return new Response(
          `Hi! 👋 Main hoon Rafiki 🙏 
Aapke liye job dhoondhne mein madad karunga.
Chaliye start karte hain!
Choose language:
1. English (reply LANG_EN)
2. Hindi (reply LANG_HI)`,
          { status: 200 },
        );
      }

      // Continue existing flow
      const state = stateService.get(from);
      console.log("Current state:", JSON.stringify(state.answers), state.currentFlow, text);

      const reply = await flowRouter.route(state.currentFlow ?? "WELCOME", from, text, state);
      return new Response(reply, { status: 200 });
    } catch (err) {
      console.error("Error in webhook:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });

})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
