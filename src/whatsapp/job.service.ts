// src/job.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";

@Injectable()
export class JobService {
  constructor(
    @Inject("SUPABASE_CLIENT")
    private readonly supabase: SupabaseClient
  ) { }

  async findJobs(city: string, state: string) {
    const { data: jobs, error } = await this.supabase
      .rpc("fuzzy_find_jobs", { city_input: city, state_input: state });

    if (error) {
      console.error("❌ RPC error:", error);
      return [];
    } else {
      // console.log("✅ Jobs:", jobs);
    }
    if (!jobs || jobs.length === 0) {
      return [];
    }

    return jobs;
  }

  async findJobsByCity(city: string) {
    const { data: jobs, error } = await this.supabase
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
          body: {
            text,
          },
          action: {
            buttons: buttons.map((btn) => ({
              type: "reply",
              reply: {
                id: btn.id,
                title: btn.title,
              },
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
        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
      );

      // console.log("✅ WhatsApp API Response:", response.data);
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
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );

  const fileUrl = mediaUrlResp.data.url;

  // 2. Download file binary
  const fileResp = await axios.get(fileUrl, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    responseType: "arraybuffer",
  });

  // 3. Upload to Supabase
  const fileName = `kyc/${mediaId}.jpg`;
  const { data, error } = await this.supabase.storage
    .from("kyc-docs")
    .upload(fileName, fileResp.data, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrl } = this.supabase.storage
    .from("kyc-docs")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}

}
