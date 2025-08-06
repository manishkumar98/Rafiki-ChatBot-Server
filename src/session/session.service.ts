// src/session/session.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private sessions = new Map<string, any>();

  get(phone: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.sessions.get(phone) || {};
  }

  set(phone: string, data: any) {
    this.sessions.set(phone, data);
  }

  clear(phone: string) {
    this.sessions.delete(phone);
  }
}
