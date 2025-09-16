import { Injectable } from "@nestjs/common";
import { ConversationStateService } from "../../session/conversation-state.service";
import { JobService } from "../../whatsapp/job.service";
import { FeedbackQ, getQuestionsForType } from "../../constants/feedback.constants";
import { SheetsService } from "../../sheets/sheets.service";

@Injectable()
export class FeedbackFlow {
    constructor(
        private stateService: ConversationStateService,
        private jobs: JobService,
        private sheets: SheetsService
    ) { }

    private langOf(state: any): "EN" | "HI" {
        return (state?.language ?? "HI") as "EN" | "HI";
    }

    private parseAnswer(q: FeedbackQ, text: string): any {
        const t = (text || "").trim();

        if (q.type === "boolean") {
            const v = t.toLowerCase();
            if (["yes", "y", "haan", "han", "ha", "h"].includes(v)) return true;
            if (["no", "n", "nah", "nahin", "nahi"].includes(v)) return false;
            return t; // fallback raw
        }

        if (q.type === "scale") {
            const num = Number(t);
            if (!isNaN(num) && num >= 1 && num <= 5) return String(num);
            return t; // fallback raw
        }

        // text
        return t;
    }

    private nextIndex(questions: FeedbackQ[], answers: Record<string, any>, fromIndex: number) {
        let i = fromIndex;
        while (i < questions.length) {
            const q = questions[i];
            if (!q.when) return i;
            const { if: depKey, equals } = q.when;
            if (depKey && (answers as any)[depKey] === equals) return i;
            i++;
        }
        return i; // may equal questions.length
    }

    async handle(from: string, text: string, state: any) {
        

        const lang = this.langOf(state);
        const type = state.feedback_type || "ALL";
        const allQuestions = getQuestionsForType(type);
        if (state.step === -1) {
            if (text === "lang_en" || text === "lang_hi") {
                const lang = text === "lang_hi" ? "HI" : "EN";
                this.stateService.update(from, { language: lang, step: 0 }); // now start at first feedback Q

                const allQuestions = getQuestionsForType(type);
                const introQ = allQuestions[0];
                if (introQ.options) {
                    await this.jobs.sendWhatsAppMessage(from, introQ.prompt[lang], introQ.options[lang]);
                } else {
                    await this.jobs.sendWhatsAppMessage(from, introQ.prompt[lang]);
                }
                return "Language set, feedback started";
            } else {
                await this.jobs.sendWhatsAppMessage(
                    from,
                    "❌ Invalid choice. Please select a language:",
                    [
                        { id: "lang_en", title: "English" },
                        { id: "lang_hi", title: "हिंदी" },
                    ]
                );
                return "Invalid language choice";
            }
        }
        if (!state.language) {
            await this.jobs.sendWhatsAppMessage(
                from,
                "👋 Hello! Your feedback is important to us — we’d love to know about your experience 🏡🍴💼 🙂. 🙏 Please choose your language to give feedback:",
                [
                    { id: "lang_en", title: "English" },
                    { id: "lang_hi", title: "हिंदी" },
                ]
            );
            this.stateService.update(from, { currentFlow: "FEEDBACK", step: -1 });
            return "Awaiting language selection";
        }

        if (text === "__INIT__") {
            const startIdx = this.nextIndex(allQuestions, state.nps_feedback_answers || {}, 0);
            if (startIdx >= allQuestions.length) {
                await this.jobs.sendWhatsAppMessage(from, lang === "EN" ? "No feedback questions configured." : "कोई फीडबैक प्रश्न कॉन्फ़िगर नहीं हैं।");
                this.stateService.reset(from);
                return "Feedback started but no questions.";
            }
            this.stateService.update(from, { step: startIdx });
            const introQ = allQuestions[startIdx];
            if (introQ.options) {
                await this.jobs.sendWhatsAppMessage(from, introQ.prompt[lang],introQ.options[lang]);
            } else {
                await this.jobs.sendWhatsAppMessage(from, introQ.prompt[lang]);
            }
            return introQ.prompt[lang];
        }

        const step = state.step ?? 0;
        const answers = state.nps_feedback_answers || {};
        const idx = this.nextIndex(allQuestions, answers, step);

        if (idx >= allQuestions.length) {
            await this.jobs.sendWhatsAppMessage(
                from,
                lang === "EN"
                    ? "🙏 Thank you! Your feedback has been recorded. Have a wonderful day! ✨\n\n👉 Type *hi* anytime to restart."
                    : "🙏 धन्यवाद! आपका फ़ीडबैक रिकॉर्ड कर लिया गया है, आपका दिन शुभ हो! ✨\n\n👉 कभी भी पुनः प्रारंभ करने के लिए *hi* लिखें।",undefined,true
            );
            this.stateService.reset(from);
            return "Feedback done (no pending question).";
        }

        const currentQ = allQuestions[idx];

        // Exit logic for intro
        if (currentQ.key.endsWith("Intro")) {
            if (text.toLowerCase() === "exit" || text.toLowerCase() === "❌  exit") {
                try {
                    await this.sheets.appendFeedbackRow(state.nps_feedback_answers || {}, from);
                } catch (e) {
                    console.error("❌ Failed to save partial feedback", e);
                }
                await this.jobs.sendWhatsAppMessage(
                    from,
                    lang === "EN" ? "❌  Feedback cancelled. Have a nice day!" : "❌ फ़ीडबैक रद्द कर दिया गया, आपका दिन शुभ हो!", undefined,true
                );
                this.stateService.reset(from);
                return "Feedback exited.";
            }
        }

        const parsed = this.parseAnswer(currentQ, text);
        (answers as any)[currentQ.key] = parsed;

        let next = this.nextIndex(allQuestions, answers, idx + 1);

        if (next < allQuestions.length) {
            this.stateService.update(from, { nps_feedback_answers: answers, step: next });
            const nextQ = allQuestions[next];
            if (nextQ.options) {
                await this.jobs.sendWhatsAppMessage(from, nextQ.prompt[lang], nextQ.options[lang]);
            } else {
                await this.jobs.sendWhatsAppMessage(from, nextQ.prompt[lang]);
            }
            return `Saved ${currentQ.key}, asked next`;
        }

        this.stateService.update(from, { nps_feedback_answers: answers });
        try {
            await this.sheets.appendFeedbackRow(answers, from);
        } catch (e) {
            console.error("❌ Failed to save feedback", e);
        }
        await this.jobs.sendWhatsAppMessage(
            from,
            lang === "EN"
            ? "🙏 Thank you! Your feedback has been recorded. Have a wonderful day! ✨\n\n👉 Type *hi* anytime to restart."
            : "🙏 धन्यवाद! आपका फ़ीडबैक रिकॉर्ड कर लिया गया है, आपका दिन शुभ हो! ✨\n\n👉 कभी भी पुनः प्रारंभ करने के लिए *hi* लिखें।", undefined,true

        );
        this.stateService.reset(from);
        return "Feedback completed";
    }

}
