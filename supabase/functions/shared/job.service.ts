import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axios from "https://esm.sh/axios@1.6.7";

// 🔑 Supabase client singleton
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")?? Deno.env.get("LOCAL_SUPABASE_URL"),
  Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("LOCAL_SUPABASE_ANON_KEY")
);

export class JobService {
  async findJobs(city: string, state: string) {
    const { data: jobs, error } = await supabase
      .rpc("fuzzy_find_jobs", { city_input: city, state_input: state });

    if (error) {
      console.error("❌ RPC error:", error);
      return [];
    }
    return jobs || [];
  }

  async findJobsByCity(city: string) {
    const { data: jobs, error } = await supabase
      .rpc("fuzzy_find_jobs_by_city", { city_input: city });

    if (error) {
      console.error("❌ RPC error:", error);
      return [];
    }
    return jobs || [];
  }

  async sendWhatsAppMessage(
    to: string,
    text: string,
    buttons?: { id: string; title: string }[]
  ) {
    let payload: any;

    if (buttons && buttons.length > 0) {
      // interactive button template
      payload = {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: buttons.map((btn) => ({
              type: "reply",
              reply: { id: btn.id, title: btn.title },
            })),
          },
        },
      };
    } else {
      // normal text message
      payload = {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      };
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ WhatsApp API Response:", response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ WhatsApp API Error:", error.response?.data || error.message);
      } else {
        console.error("❌ Unexpected Error:", error);
      }
    }
  }

  async handleMediaUpload(message: any): Promise<string> {
    const mediaId = message?.image?.id || message?.document?.id;
    if (!mediaId) throw new Error("No media id found");

    // 1. Get media URL from WhatsApp
    const mediaUrlResp = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}` } }
    );

    const fileUrl = mediaUrlResp.data.url;

    // 2. Download file binary
    const fileResp = await axios.get(fileUrl, {
      headers: { Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}` },
      responseType: "arraybuffer",
    });

    // 3. Upload to Supabase Storage
    const fileName = `kyc/${mediaId}.jpg`;
    const { data, error } = await supabase.storage
      .from("kyc-docs")
      .upload(fileName, fileResp.data, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("kyc-docs")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }
}

// ✅ Singleton instance (persists across warm requests)
export const jobService = new JobService();
