// src/whatsapp/whatsapp.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private token = process.env.WHATSAPP_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  async sendText(phone: string, text: string) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response?.data;
    } catch (error) {
      console.error(
        'WhatsApp sendText failed:',
        error?.response?.data || error.message,
      );
      throw new Error('Failed to send WhatsApp message');
    }
  }
}
