import { Injectable } from "@nestjs/common";
import { ConversationStateService } from "../../session/conversation-state.service";
import { JobService } from "../../whatsapp/job.service";
import { OpenAiService } from "../../whatsapp/openai.service";
import { SheetsService } from "../../sheets/sheets.service";
import {
  errorMessages,
  roleMessages,
  jobsMessage,
  commonKeys,
  commonKeysMapping,
  roleKeys,
} from "../../constants/constants";
import { handleRoleSelection } from "../../utils/utility.functions";

type Lang = "EN" | "HI";
type JobPhase = "COMMON" | "ROLE" | "JOB_SELECTION" | "JOB_SELECTION_OPTIONS" | "KYC";

@Injectable()
export class JobFlow {
  constructor(
    private readonly stateService: ConversationStateService,
    private readonly jobs: JobService,
    private readonly openAi: OpenAiService,
    private readonly sheets: SheetsService
  ) { }

  async start(from: string, lang: Lang) {
    const state = this.stateService.get(from) ?? {};
    this.stateService.update(from, {
      currentFlow: "JOB",
      step: 0,
      job: { phase: "COMMON" as JobPhase },
      // keep existing answers if coming back; otherwise ensure it exists
      answers: state.answers ?? {},
    });

    const firstQ =
      (await this.openAi.getCommonQuestion(0, lang, state.answers))?.question ??
      (lang === "EN" ? "What is your name?" : "आपका नाम क्या है?");

    await this.jobs.sendWhatsAppMessage(from, firstQ);
    return firstQ;
  }

  async handle(from: string, text: string, state: any) {
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
        // safety: re-start common phase
        return this.start(from, lang);
    }
  }

  // ---------- COMMON PHASE ----------
  private async handleCommon(from: string, text: string, lang: Lang, state: any) {
    const step: number = state.step ?? 0;
    const currentKey = commonKeys[step];

    const { isValid, value } = await this.openAi.validateAnswer(currentKey, text);
    if (!isValid) {
      if (currentKey === "age") {
        // ineligible → send error and send them back to language
        this.stateService.reset(from);
        this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });
      }
      const msg = errorMessages[lang](currentKey);
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // save the answer & move to next
    this.stateService.update(from, {
      answers: { ...state.answers, [currentKey]: value },
      step: step + 1,
    });
    if (currentKey === "full_name") {
      await this.sheets.appendLeadRow(value, from);
    }
    const newState = this.stateService.get(from);

    // finished common → fetch roles for city and switch to ROLE phase
    if (newState.step >= commonKeys.length) {
      const matchedJobs = await this.jobs.findJobsByCity(
        newState.answers.job_preference_city
      );

      if (!matchedJobs || matchedJobs.length === 0) {
        const noJobs: Record<Lang, string> = {
          EN: "❌ Sorry, we couldn’t find any jobs in this city right now.\n👉 Try another city or press *R* to reset.",
          HI: "❌ क्षमा कीजिए, इस शहर में अभी कोई नौकरी उपलब्ध नहीं है।\n👉 किसी और शहर से प्रयास करें, या *R* दबाएँ।",
        };
        await this.jobs.sendWhatsAppMessage(from, noJobs[lang]);
        this.stateService.reset(from);
        this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });
        return noJobs[lang];
      }

      const categories = [...new Set(matchedJobs.map((j: any) => j.role))] as string[];
      const roleMap: Record<number, string> = {};
      categories.forEach((role, i) => (roleMap[i + 1] = role));

      this.stateService.update(from, {
        // keep top-level flow as JOB, but change internal phase
        job: { phase: "ROLE" as JobPhase },
        step: 0,
        available_jobs: matchedJobs,
        roleMap,
        selectedRole: "",
      });

      const msg = roleMessages[lang](categories);
      await this.jobs.sendWhatsAppMessage(from, msg);

      const maxButtonsPerMsg = 3;
      for (let i = 0; i < categories.length; i += maxButtonsPerMsg) {
        const chunk = categories.slice(i, i + maxButtonsPerMsg);

        const buttons = chunk.map((role, index) => {
          let title = `${i + index + 1}. ${role}`;
          if (title.length > 20) title = title.slice(0, 17) + '...';
          return { id: `${i + index + 1}`, title };
        });


        const groupText =
          lang === "HI"
            ? `✨ नौकरी विकल्प (${i + 1}–${i + chunk.length})`
            : `✨ Job Options (${i + 1}–${i + chunk.length})`;
        await this.jobs.sendWhatsAppMessage(from, groupText, buttons);
      }
      return msg;
    }

    // ask the next common question
    const nextKey = commonKeys[newState.step];
    const mappedKey = commonKeysMapping[nextKey][lang] || nextKey;
    const nextQ = await this.openAi.generateQuestion(
      mappedKey,
      "",
      state.language,
      newState.answers
    );

    await this.jobs.sendWhatsAppMessage(from, nextQ);
    return nextQ;
  }

  // ---------- ROLE PHASE ----------
  private async handleRole(from: string, text: string, lang: Lang, state: any) {
    const newState = this.stateService.get(from);

    // if no role selected yet, delegate to utility that sets selectedRole/step
    if (!newState.selectedRole) {
      return await handleRoleSelection({
        text,
        state: newState,
        lang,
        from,
        stateService: this.stateService,
        jobs: this.jobs,
        openAi: this.openAi,
      });
    }

    const role = newState.selectedRole;
    const step = newState.step ?? 0;
    const currentKey = roleKeys[role][step];

    this.stateService.update(from, {
      answers: { ...newState.answers, [currentKey]: text },
      step: step + 1,
    });

    const latest = this.stateService.get(from);

    // finished role-specific Qs → show filtered jobs
    if (latest.step >= roleKeys[role].length) {
      const filtered = (latest.available_jobs ?? []).filter((j: any) => j.role === role);

      this.stateService.update(from, {
        job: { phase: "JOB_SELECTION" as JobPhase },
        step: 0,
        available_jobs: filtered,
      });
      const glyphs = (s: string) => Array.from(s);
      const trimTo = (s: string, max: number) =>
        glyphs(s).slice(0, max).join("");


      function makeButtonTitle(i: number, job: any): string {
        const num = `${i + 1}️⃣`;

        const withClient = `${num} ${job.role} – ${job.client}`;
        if (glyphs(withClient).length <= 20) return withClient;

        const roleOnly = `${num} ${job.role}`;
        if (glyphs(roleOnly).length <= 20) return roleOnly;

        // final fallback: truncated role with ellipsis
        const head = `${num} `;
        const room = Math.max(1, 20 - glyphs(head).length - 1);
        return `${head}${trimTo(job.role, room)}…`;
      }
      const jobs = filtered;
      const listMsg = jobsMessage[lang](jobs);
      if (jobs.length <= 2) {
        const buttons = filtered.map((job: any, i) => ({
          id: `${i + 1}`,
          title: makeButtonTitle(i, job),
        }));

        buttons.push({ id: "0", title: "🚫 Not Interested" });

        await this.jobs.sendWhatsAppMessage(from, listMsg, buttons);
      } else {
        const chunkSize = 3;
        function chunkArray(arr: any[], size: number) {
          return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
          );
        }

        // send the list message first
        await this.jobs.sendWhatsAppMessage(from, listMsg);

        const jobChunks = chunkArray(jobs, chunkSize);

        for (let i = 0; i < jobChunks.length; i++) {
          const chunk = jobChunks[i];
          const start = i * chunkSize + 1;
          const end = i * chunkSize + chunk.length;

          const header =
            lang === "HI"
              ? `✨ नौकरी विकल्प (${start}–${end})`
              : `✨ Job Options (${start}–${end})`;

          const buttons = chunk.map((job: any, j) => ({
            id: `${i * chunkSize + j + 1}`,
            title: makeButtonTitle(i * chunkSize + j, job),
          }));

          await this.jobs.sendWhatsAppMessage(from, header, buttons);

          // after the last chunk, send "Not Interested" as a separate message
          if (i === jobChunks.length - 1) {
            const notInterestedText =
              lang === "HI"
                ? "यदि इनमें से कोई नौकरी उपयुक्त नहीं है, तो नीचे '🚫 Not Interested' दबाएँ।"
                : "If none of these jobs suit you, tap '🚫 Not Interested' below.";

            // small delay to preserve order
            await new Promise((r) => setTimeout(r, 250));

            await this.jobs.sendWhatsAppMessage(from, notInterestedText, [
              { id: "0", title: "🚫 Not Interested" },
            ]);
          }
        }

        return listMsg;
      }

      return listMsg;
    }

    const nextQ = await this.openAi.getRoleQuestion(
      role,
      latest.step,
      state.language,
      latest.answers
    );
    if (nextQ) {
      const buttons =
        lang === "HI"
          ? [
            { id: "yes", title: "✅ हाँ" },
            { id: "no", title: "❌ नहीं" },
          ]
          : [
            { id: "yes", title: "✅ Yes" },
            { id: "no", title: "❌ No" },
          ];
      console.log('check role question', nextQ);
      await this.jobs.sendWhatsAppMessage(from, nextQ.question, buttons);
      return nextQ.question;
    }
  }

  // ---------- JOB SELECTION ----------
  private async handleJobSelection(from: string, text: string, lang: Lang, state: any) {
    const selectedIndex = parseInt(text, 10);
    const count = state?.available_jobs?.length ?? 0;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex > count) {
      const msg =
        lang === "EN"
          ? "❌ Invalid choice. Please reply with a valid job number."
          : "❌ गलत विकल्प। कृपया सही नौकरी नंबर लिखें।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // 0 → Not interested → go to options (try again/back/exit)
    if (selectedIndex === 0) {
      this.stateService.update(from, {
        job: { phase: "JOB_SELECTION_OPTIONS" as JobPhase },
        step: 0,
      });

      const msg =
        lang === "EN"
          ? "🙏 We are sorry to know that. You can try other jobs, go back to menu, or exit."
          : "🙏 हमें खेद है। आप अन्य नौकरियाँ देख सकते हैं, मेनू पर लौट सकते हैं, या बाहर निकल सकते हैं।";
      await this.jobs.sendWhatsAppMessage(from, msg, [
        { id: "try_again", title: lang === "EN" ? "🔁 Try Other Jobs" : "🔁 अन्य नौकरियाँ देखें" },
        { id: "back_menu", title: lang === "EN" ? "🏠 Back to Menu" : "🏠 मुख्य मेनू" },
        { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌ बाहर निकलें" },
      ]);
      return msg;
    }

    // > 0 → Interested in a job
    let selectedJob: any = state.available_jobs[selectedIndex - 1];
    try {
      let formatted = selectedJob;
      if (typeof selectedJob === "string") formatted = JSON.parse(selectedJob);
      if (formatted && typeof formatted === "object") {
        formatted = `${formatted.role} | ${formatted.client} | ${formatted.city}, ${formatted.state} | ${formatted.locality} | ${formatted.salary}`;
      }
      await this.sheets.appendRow(
        { ...state.answers, selectedJob: formatted, status: "Interested" },
        from
      );
    } catch (e) {
      console.error("❌ Failed to save to sheets", e);
    }
    this.stateService.update(from, {
      job: { phase: "KYC" as JobPhase },
      step: 0,
    });



    await this.jobs.sendWhatsAppMessage(from,
      lang === "EN"
        ? "🚀 We are now starting your KYC process. 📑 For this, Aadhaar, PAN, and Bank Proof are required. Do you have them ready?"
        : "🚀 अब हम आपका KYC प्रक्रिया शुरू कर रहे हैं। 📑 इसके लिए आधार, पैन और बैंक प्रूफ अनिवार्य है। क्या आपके पास तैयार है?",

      [
        { id: "continue", title: lang === "EN" ? "✅ Continue" : "✅ जारी रखें" },
        { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌ बाहर निकलें" },
      ]
    );
    return `lang === "EN"
      ? "We are now starting your KYC process.📑 Aadhaar, PAN, and Bank Proof are required for KYC. Do you have them ready?" 
      : "📑 KYC के लिए आधार, पैन और बैंक प्रूफ अनिवार्य है। क्या आपके पास तैयार है?",
    [
      { id: "continue", title: lang === "EN" ? "✅ Continue" : "✅ जारी रखें" },
      { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌ बाहर निकलें" },
    ]`;
  }

  // ---------- JOB SELECTION OPTIONS (rejection path) ----------
  private async handleJobSelectionOptions(from: string, text: string, lang: Lang, state: any) {
    if (text === "try_again") {
      const matched = await this.jobs.findJobsByCity(state.answers.job_preference_city);
      if (!matched || matched.length === 0) {
        const noJobs: Record<Lang, string> = {
          EN: "❌ Sorry, still no jobs in this city. Try another city or press *R* to reset.",
          HI: "❌ क्षमा करें, इस शहर में अभी भी नौकरियाँ नहीं हैं। किसी और शहर से प्रयास करें या *R* दबाएँ।",
        };
        await this.jobs.sendWhatsAppMessage(from, noJobs[lang]);
        this.stateService.reset(from);
        this.stateService.update(from, { currentFlow: "LANGUAGE", step: 0 });
        return noJobs[lang];
      }

      const categories = Array.from(new Set(matched.map((j: any) => j.role))) as string[];
      const roleMap: Record<number, string> = {};
      categories.forEach((r, i) => (roleMap[i + 1] = r));

      this.stateService.update(from, {
        job: { phase: "ROLE" as JobPhase },
        step: 0,
        available_jobs: matched,
        roleMap,
        selectedRole: "",
      });

      const msg = roleMessages[lang](categories);
      await this.jobs.sendWhatsAppMessage(from, msg);

      // 🔘 Send buttons (same as in handleCommon)
      const maxButtonsPerMsg = 3;
      for (let i = 0; i < categories.length; i += maxButtonsPerMsg) {
        const chunk = categories.slice(i, i + maxButtonsPerMsg);

        const buttons = chunk.map((role, index) => {
          let title = `${i + index + 1}. ${role}`;
          if (title.length > 20) title = title.slice(0, 17) + '...';
          return { id: `${i + index + 1}`, title };
        });

        const groupText =
          lang === "HI"
            ? `✨ नौकरी विकल्प (${i + 1}–${i + chunk.length})`
            : `✨ Job Options (${i + 1}–${i + chunk.length})`;

        await this.jobs.sendWhatsAppMessage(from, groupText, buttons);
      }

      return msg;
    }

    if (text === "back_menu") {
      // jump back inside JOB → COMMON at the city question (index 3, as per your logic)
      this.stateService.update(from, {
        job: { phase: "COMMON" as JobPhase },
        step: 3,
        roleMap: {},
        available_jobs: [],
        selectedRole: "",
      });

      const msg =
        lang === "EN"
          ? "🏠 Back to main menu in Jobs. Please tell me the city where you want to work."
          : "🏠 नौकरियों के मुख्य मेनू पर वापस। कृपया बताएं आप किस शहर में काम करना चाहते हैं।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    if (text === "exit") {
      this.stateService.reset(from);
      const msg =
        lang === "EN"
          ? "🙏 No problem. You can return anytime to check new jobs."
          : "🙏 कोई बात नहीं। आप कभी भी वापस आकर नई नौकरियाँ देख सकते हैं।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // unrecognized → repeat options
    const repeat =
      lang === "EN"
        ? "Please choose one of the options."
        : "कृपया दिए गए विकल्पों में से चुनें।";
    await this.jobs.sendWhatsAppMessage(from, repeat, [
      { id: "try_again", title: lang === "EN" ? "🔁 Try Other Jobs" : "🔁 अन्य नौकरियाँ देखें" },
      { id: "back_menu", title: lang === "EN" ? "🏠 Back to Menu" : "🏠 मुख्य मेनू" },
      { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌ बाहर निकलें" },
    ]);
    return repeat;
  }

  private async handleKyc(from: string, text: any, lang: Lang, state: any) {
    const step = state.step ?? 0;
    console.log('kyc flow started', step);
    if (state.kyc_intro) {
      if (["kyc_instagram", "kyc_friend", "kyc_employee"].includes(text)) {
        const sourceMap: Record<string, string> = {
          kyc_instagram: "Instagram/Facebook",
          kyc_friend: "Friend",
          kyc_employee: "Employee/Rafiki Worker",
        };

        this.stateService.update(from, {
          ...state,
          answers: { ...state.answers, rafiki_source: sourceMap[text] },
          kyc_intro: false, // done with intro
          step: 0,
        });

        // Now ask the normal KYC intro question
        const msg =
          lang === "EN"
            ? "🚀 We are now starting your KYC process. 📑 Aadhaar, PAN, and Bank Proof are required. Do you have them ready?"
            : "🚀 अब हम आपका KYC प्रक्रिया शुरू कर रहे हैं। 📑 इसके लिए आधार, पैन और बैंक प्रूफ अनिवार्य है। क्या आपके पास तैयार है?";
        await this.jobs.sendWhatsAppMessage(from, msg, [
          { id: "continue", title: lang === "EN" ? "✅ Continue" : "✅ जारी रखें" },
          { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌बाहर निकलें" },
        ]);
        return msg;
      } else {
        // repeat if invalid input
        await this.jobs.sendWhatsAppMessage(
          from,
          lang === "EN"
            ? "👉 Please select where you heard about Rafiki app"
            : "👉 कृपया चुनें आपको Rafiki ऐप के बारे में कहाँ से पता चला?",
          [
            { id: "kyc_instagram", title: "Instagram / Facebook" },
            { id: "kyc_friend", title: lang === "EN" ? "Friend" : "दोस्त" },
            { id: "kyc_employee", title: lang === "EN" ? "Employee " : "कर्मचारी" },
          ]
        );
        return "Repeat Rafiki source question";
      }
    }
    // Step 0 → Intro: ask if docs are ready
    if (step === 0) {
      if (text === "continue") {
        this.stateService.update(from, {
          ...state,
          currentFlow: "JOB",
          job: { phase: "KYC" },
          step: 1
        });
        const msg = lang === "EN"
          ? "📸 Please upload *Aadhaar Front* photo."
          : "📸 कृपया *आधार कार्ड का फ्रंट फोटो* अपलोड करें।";
        await this.jobs.sendWhatsAppMessage(from, msg);
        return msg;
      }
      if (text === "exit") {
        this.stateService.reset(from);
        const exitMsg = lang === "EN"
          ? "🙏 No problem. You can complete KYC later."
          : "🙏 कोई बात नहीं। आप बाद में KYC पूरा कर सकते हैं।";
        await this.jobs.sendWhatsAppMessage(from, exitMsg);
        return exitMsg;
      }

      // If invalid input, show again
      const introMsg = lang === "EN"
        ? "🚀 We are now starting your KYC process. 📑 For this, Aadhaar, PAN, and Bank Proof are required. Do you have them ready?"
        : "🚀 अब हम आपका KYC प्रक्रिया शुरू कर रहे हैं। 📑 इसके लिए आधार, पैन और बैंक प्रूफ अनिवार्य है। क्या आपके पास तैयार है?";
      await this.jobs.sendWhatsAppMessage(from, introMsg, [
        { id: "continue", title: lang === "EN" ? "✅ Continue" : "✅ जारी रखें" },
        { id: "exit", title: lang === "EN" ? "❌ Exit" : "❌ बाहर निकलें" },
      ]);
      return introMsg;
    }

    // Helper: detect media
    function messageIsMedia(message: any): boolean {
      return !!(message?.image || message?.document);
    }

    // Step 1 → Aadhaar Front
    if (step === 1) {
      if (!messageIsMedia(text)) {
        const err = lang === "EN"
          ? "❌ Please upload a valid *Aadhaar Front* image."
          : "❌ कृपया एक मान्य *आधार कार्ड फ्रंट* इमेज अपलोड करें।";
        await this.jobs.sendWhatsAppMessage(from, err);
        return err;
      }
      const fileUrl = await this.jobs.handleMediaUpload(text);
      const answers = { ...state.answers, aadhar_front: fileUrl };
      this.stateService.update(from, { step: 2, answers });

      const msg = lang === "EN"
        ? "✅ Aadhaar Front uploaded. Now upload *Aadhaar Back* photo."
        : "✅ आधार का फ्रंट अपलोड हो गया। अब *आधार कार्ड का बैक फोटो* अपलोड करें।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // Step 2 → Aadhaar Back
    if (step === 2) {
      if (!messageIsMedia(text)) {
        const err = lang === "EN"
          ? "❌ Please upload a valid *Aadhaar Back* image."
          : "❌ कृपया एक मान्य *आधार कार्ड बैक* इमेज अपलोड करें।";
        await this.jobs.sendWhatsAppMessage(from, err);
        return err;
      }
      const fileUrl = await this.jobs.handleMediaUpload(text);
      const answers = { ...state.answers, aadhar_back: fileUrl };
      this.stateService.update(from, { step: 3, answers });

      const msg = lang === "EN"
        ? "✅ Aadhaar uploaded. Now upload *PAN Card* photo."
        : "✅ आधार कार्ड अपलोड हो गया। अब *पैन कार्ड* का फोटो अपलोड करें।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // Step 3 → PAN
    if (step === 3) {
      if (!messageIsMedia(text)) {
        const err = lang === "EN"
          ? "❌ Please upload a valid *PAN Card* image."
          : "❌ कृपया एक मान्य *पैन कार्ड* इमेज अपलोड करें।";
        await this.jobs.sendWhatsAppMessage(from, err);
        return err;
      }
      const fileUrl = await this.jobs.handleMediaUpload(text);
      const answers = { ...state.answers, pan_card: fileUrl };
      this.stateService.update(from, { step: 4, answers });

      const msg = lang === "EN"
        ? "✅ PAN uploaded. Now upload *Bank Proof* (Passbook/Cancelled Cheque)."
        : "✅ पैन अपलोड हो गया। अब *बैंक प्रूफ* (पासबुक/रद्द चेक) अपलोड करें।";
      await this.jobs.sendWhatsAppMessage(from, msg);
      return msg;
    }

    // Step 4 → Bank Proof
    if (step === 4) {
      if (!messageIsMedia(text)) {
        const err = lang === "EN"
          ? "❌ Please upload a valid *Bank Proof* image."
          : "❌ कृपया एक मान्य *बैंक प्रूफ* इमेज अपलोड करें।";
        await this.jobs.sendWhatsAppMessage(from, err);
        return err;
      }
      const fileUrl = await this.jobs.handleMediaUpload(text);
      const answers = { ...state.answers, bank_proof: fileUrl };

      // ✅ Save all answers & reset
      await this.sheets.appendKycRow(answers, from);
      this.stateService.reset(from);

      const thanks = lang === "EN"
        ? "🎉 Thank you! Your Aadhaar, PAN, and Bank Proof have been submitted successfully. We will get back to you with more details soon. To restart the process anytime, just type *hi*."
        : "🎉 धन्यवाद! आपका आधार, पैन और बैंक प्रूफ सफलतापूर्वक जमा हो गया है। हम आपको जल्द ही अधिक जानकारी के साथ संपर्क करेंगे। प्रक्रिया को फिर से शुरू करने के लिए, बस *hi* टाइप करें।";


      await this.jobs.sendWhatsAppMessage(from, thanks, undefined, true);
      return thanks;
    }
  }



}
