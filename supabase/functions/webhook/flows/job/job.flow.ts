// supabase/functions/_shared/job-flow.ts

import { jobService } from "../../../shared/job.service.ts";
import { openAiService } from "../../../shared/openai.service.ts";
import { commonKeys, commonKeysMapping, errorMessages, roleMessages } from "../../constants/constants.ts";
import { conversationStateService } from "../../session/conversation-state.service.ts";
import { handleRoleSelection } from "../../utilty/utility.functions.ts";

type Lang = "EN" | "HI";
type JobPhase =
  | "COMMON"
  | "ROLE"
  | "JOB_SELECTION"
  | "JOB_SELECTION_OPTIONS"
  | "KYC";

export class JobFlow {
  async start(from: string, lang: Lang) {
    const state = conversationStateService.get(from) ?? {};
    conversationStateService.update(from, {
      currentFlow: "JOB",
      step: 0,
      job: { phase: "COMMON" as JobPhase },
      answers: state.answers ?? {},
    });

    const firstQ =
      (await openAiService.getCommonQuestion(0, lang, state.answers))?.question ??
      (lang === "EN" ? "What is your name?" : "आपका नाम क्या है?");

    await jobService.sendWhatsAppMessage(from, firstQ);
    return firstQ;
  }

  async handle(from: string, text: any, state: any) {
    const lang: Lang = (state.language ?? "EN") as Lang;
    const job = (state.job ?? { phase: "COMMON" }) as { phase: JobPhase };

    switch (job.phase) {
      case "COMMON":
        return this.handleCommon(from, text, lang, state);
      case "ROLE":
        return this.handleRole(from, text, lang, state);
      case "JOB_SELECTION":
        return this.handleJobSelection(from, text, lang, state);
      case "JOB_SELECTION_OPTIONS":
        return this.handleJobSelectionOptions(from, text, lang, state);
      case "KYC":
        return this.handleKyc(from, text, lang, state);
      default:
        return this.start(from, lang);
    }
  }

  // --------- COMMON ---------
  private async handleCommon(from: string, text: string, lang: Lang, state: any) {
    const step: number = state.step ?? 0;
    const currentKey = commonKeys[step];

    const { isValid, value } = await openAiService.validateAnswer(currentKey, text);
    if (!isValid) {
      if (currentKey === "age") {
        conversationStateService.reset(from);
        conversationStateService.update(from, { currentFlow: "LANGUAGE", step: 0 });
      }
      const msg = errorMessages[lang](currentKey);
      await jobService.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // save
    conversationStateService.update(from, {
      answers: { ...state.answers, [currentKey]: value },
      step: step + 1,
    });

    const newState = conversationStateService.get(from);

    // finished → go role phase
    if (newState.step >= commonKeys.length) {
      const matchedJobs = await jobService.findJobsByCity(
        newState.answers.job_preference_city,
      );

      if (!matchedJobs || matchedJobs.length === 0) {
        const noJobs: Record<Lang, string> = {
          EN: "❌ Sorry, we couldn’t find any jobs in this city right now.",
          HI: "❌ क्षमा कीजिए, इस शहर में अभी कोई नौकरी उपलब्ध नहीं है।",
        };
        await jobService.sendWhatsAppMessage(from, noJobs[lang]);
        conversationStateService.reset(from);
        conversationStateService.update(from, { currentFlow: "LANGUAGE", step: 0 });
        return noJobs[lang];
      }

      const categories = [...new Set(matchedJobs.map((j: any) => j.role))] as string[];
      const roleMap: Record<number, string> = {};
      categories.forEach((role, i) => (roleMap[i + 1] = role));

      conversationStateService.update(from, {
        job: { phase: "ROLE" as JobPhase },
        step: 0,
        available_jobs: matchedJobs,
        roleMap,
        selectedRole: "",
      });

      const msg = roleMessages[lang](categories);
      await jobService.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // next Q
    const nextKey = commonKeys[newState.step];
    const mappedKey = commonKeysMapping[nextKey][lang] || nextKey;
    const nextQ = await openAiService.generateQuestion(
      mappedKey,
      "",
      state.language,
      newState.answers,
    );

    await jobService.sendWhatsAppMessage(from, nextQ);
    return nextQ;
  }

  // --------- ROLE ---------
  private async handleRole(from: string, text: string, lang: Lang, state: any) {
    const newState = conversationStateService.get(from);

    if (!newState.selectedRole) {
      return await handleRoleSelection({
        text,
        state: newState,
        lang,
        from,
        stateService: conversationStateService,
        jobs: jobService,
        openAi: openAiService,
      });
    }

    // continue role Qs ...
    // (same as your original role handling)
  }

  // --------- JOB_SELECTION ---------
  private async handleJobSelection(from: string, text: string, lang: Lang, state: any) {
    // ... (same as your original, but use singletons instead of this.jobs / this.sheets)
  }

  // --------- JOB_SELECTION_OPTIONS ---------
  private async handleJobSelectionOptions(from: string, text: string, lang: Lang, state: any) {
    // ... (same as your original)
  }

  // --------- KYC ---------
  private async handleKyc(from: string, text: any, lang: Lang, state: any) {
    // ... (same as your original KYC logic, just replace this.sheets -> sheetsService)
  }
}

// ✅ export a singleton (Supabase DI style)
export const jobFlow = new JobFlow();
