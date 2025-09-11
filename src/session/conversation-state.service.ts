import { Injectable } from "@nestjs/common";

interface ConversationData {
  step: number;
  answers: Record<string, any>;
  currentFlow?: "COMMON" | "ROLE" | "WELCOME" | "LANGUAGE" | "JOB_SELECTION" | "JOB_SELECTION_OPTIONS" | "ACCOMMODATION" | "SUPPORT" |"PAYMENT" | "MAIN_MENU" | "JOB" |"FEEDBACK" |null;
  selectedRole?: string;
  language?: 'EN' | 'HI';
  available_jobs?:string[];
  selected_jobs?:string[];
  roleMap?: Record<string, string>;
  job?: {
    phase: "COMMON" | "ROLE" | "JOB_SELECTION" | "JOB_SELECTION_OPTIONS" | "KYC";
  };
  supportQuery?: string;
  kyc_intro?: boolean;
  branch?: "FEEDBACK" | "ONBOARDING";
  feedback_type?:string;
  nps_feedback_answers?: {
    nestRating?: string;
    nestRemarks?: string;
    curryUser?: boolean;
    curryRating?: string;
    curryRemarks?: string;
    gotJob?: boolean;
    jobRating?: string;
    jobRemarks?: string;
    niaRating?: string;
    niaRemarks?: string;
  };

  nps_onboarding_answers?: {
    city?: string;
    area?: string;
    stayType?: string;
    moveIn?: string;
    foodRequired?: boolean;
    selectedOption?: string;
  }; 
}

@Injectable()
export class ConversationStateService {
  private state = new Map<string, ConversationData>();

  get(userId: string): ConversationData {
    if (!this.state.has(userId)) {
      this.state.set(userId, { step: 0, answers: {}, currentFlow: "WELCOME" });
    }
    return this.state.get(userId) as ConversationData;
  }

  update(userId: string, data: Partial<ConversationData>) {
    const existing = this.get(userId);
    this.state.set(userId, { ...existing, ...data });
  }

  reset(userId: string) {
    this.state.delete(userId);
  }
}
