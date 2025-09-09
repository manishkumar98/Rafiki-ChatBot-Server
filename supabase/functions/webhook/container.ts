// supabase/functions/webhook/container.ts

import { JobService } from "../shared/job.service.ts";
import { FlowRouter } from "./flows/flow-router.service.ts";
import { ConversationStateService } from "./session/conversation-state.service.ts";

/**
 * Minimal DI Container
 * - Keeps singletons in memory
 * - Lazy initializes on first access
 */
class Container {
  private static services: Map<string, any> = new Map();

  static resolve<T>(key: string, factory: () => T): T {
    if (!Container.services.has(key)) {
      Container.services.set(key, factory());
    }
    return Container.services.get(key);
  }

  static getConversationStateService(): ConversationStateService {
    return Container.resolve("ConversationStateService", () => new ConversationStateService());
  }

  static getJobService(): JobService {
    return Container.resolve("JobService", () => new JobService());
  }

  static getFlowRouter(): FlowRouter {
    return Container.resolve("FlowRouter", () =>
      new FlowRouter()
    );
  }
}

export { Container };
