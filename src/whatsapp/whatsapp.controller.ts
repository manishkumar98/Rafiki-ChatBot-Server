// src/whatsapp/whatsapp.controller.ts

import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { FlowService } from '../flow/flow.service';
import { SessionService } from '../session/session.service';
import type { Response } from 'express';

@Controller('webhook')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly flowService: FlowService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  handleVerification(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
    console.log('Received Webhook Verification Request:', {
      mode,
      challenge,
      token,
    });
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully.');
      return res.status(200).send(challenge);
    } else {
      console.log('Webhook verification failed.');
      return res.status(403).send('Forbidden');
    }
  }

  @Post()
  async handleWebhook(@Body() body: any) {
    console.log('Received webhook:', body);
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    const phone = message?.from;
    const text = message?.text?.body;

    if (!phone || !text) return;

    const session = this.sessionService.get(phone);
    console.log(`📂 Retrieved session for ${phone}:`, session);
    const { reply, newState, isComplete } = this.flowService.handle(
      session,
      text,
    );
    console.log(
      `🤖 Reply: "${reply}", New state:`,
      newState,
      `Complete: ${isComplete}`,
    );
    this.sessionService.set(phone, newState);

    try {
      await this.whatsappService.sendText(phone, reply);
      console.log(`✅ Sent message to ${phone}`);
    } catch (err) {
      console.error(`❌ Failed to send message to ${phone}`, err);
    }

    if (isComplete) {
      // TODO: sheetsService.appendRow(session)
      this.sessionService.clear(phone);
    }
  }
}
