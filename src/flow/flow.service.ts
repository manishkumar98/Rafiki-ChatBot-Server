// src/flow/flow.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class FlowService {
  handle(
    session: any,
    input: string,
  ): { reply: string; newState: any; isComplete: boolean } {
    if (!session.step) {
      return {
        reply: `Hi! Main hoon Rafiki 🙏\nLanguage choose karo:\n1️⃣ हिंदी\n2️⃣ English`,
        newState: { step: 'language' },
        isComplete: false,
      };
    }

    switch (session.step) {
      case 'language':
        if (input === '1') {
          return {
            reply:
              'Batao kis mein madad chahiye aapko?\n1️⃣ Job\n2️⃣ Rehna/Khana\n3️⃣ Sab chahiye',
            newState: { step: 'menu', lang: 'hi' },
            isComplete: false,
          };
        }
        if (input === '2') {
          return {
            reply: 'How can I help you?\n1️⃣ Job\n2️⃣ Accommodation\n3️⃣ All',
            newState: { step: 'menu', lang: 'en' },
            isComplete: false,
          };
        }
        return {
          reply: 'Please choose 1 or 2',
          newState: session,
          isComplete: false,
        };

      case 'menu':
        // Extend with further flows (job, food, etc.)
        return {
          reply: 'Flow completed. Thank you!',
          newState: session,
          isComplete: true,
        };

      default:
        return {
          reply: 'Unknown step. Resetting.',
          newState: {},
          isComplete: true,
        };
    }
  }
}
