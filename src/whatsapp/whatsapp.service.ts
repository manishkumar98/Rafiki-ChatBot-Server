// src/whatsapp/whatsapp.service.ts

import { Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class WhatsappService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}
  private token = process.env.WHATSAPP_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  async sendText(phone: string, text: string) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phone,
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response?.data;
    } catch (error) {
      console.error(
        "WhatsApp sendText failed:",
        error?.response?.data || error.message,
      );
      throw new Error("Failed to send WhatsApp message");
    }
  }

  async sendButtonMessage(
    phone: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
  ) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phone,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
              buttons: buttons.map((b) => ({
                type: "reply",
                reply: { id: b.id, title: b.title },
              })),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response?.data;
    } catch (error) {
      console.error(
        "sendButtonMessage failed:",
        error?.response?.data || error.message,
      );
      throw new Error("Failed to send WhatsApp buttons");
    }
  }
}
