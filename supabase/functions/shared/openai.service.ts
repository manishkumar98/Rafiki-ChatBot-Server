// supabase/functions/openai-service/index.ts
import OpenAI from "https://esm.sh/openai@4.56.0";
import {
  roleKeys,
  validationOptions,
  commonKeys,
  commonKeysMapping,
  roleKeysMapping,
} from "../webhook/constants/constants.ts";

// ✅ OpenAI client singleton (Deno compatible)
const client = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

class OpenAiService {
  async generateQuestion(
    key: string,
    role: string = "",
    language: "EN" | "HI" = "EN",
    context: Record<string, string> = {}
  ): Promise<string> {
    // pick a random variation
    const variations = key.split("|").map((q) => q.trim()).filter(Boolean);
    const selected = variations[Math.floor(Math.random() * variations.length)];

    const rolePrompt = role
      ? `You are a friendly HR assistant interviewing for the role "${role}".`
      : "You are a friendly HR assistant collecting general job application details.";

    const langPrompt =
      language === "HI"
        ? "Generate the question in polite Hindi (use 'आप'), keep it short, friendly, whatsapp tone."
        : "Generate the question in English, keep it short, friendly, natural.";

    const nameContext = context.full_name
      ? `The candidate's name is ${context.full_name}. Mention their name occasionally (once in 2–3 questions).`
      : "";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${rolePrompt} ${langPrompt}
          - Task: Rephrase the given question so it doesn’t look hardcoded.
          - Keep it warm, conversational, interactive.
          - Avoid heavy Hindi words (use normal Hinglish).
          - Bold placeholders like *name*, *city*.
          - Do NOT change meaning.
          - No quotation marks around output.
          ${nameContext}`,
        },
        { role: "user", content: `Question: ${selected}` },
      ],
    });

    const raw = completion.choices[0].message?.content?.trim() ?? selected;
    return raw.replace(/\*\*(.*?)\*\*/g, "*$1*"); // convert bold
  }

  async validateAnswer(
    key: string,
    answer: string
  ): Promise<{ isValid: boolean; value?: string }> {
    if (key === "age") {
      const numMatch = answer.match(/\d+/);
      if (numMatch) {
        const age = parseInt(numMatch[0], 10);
        if (age >= 18 && age <= 70) {
          return { isValid: true, value: age.toString() };
        }
        return { isValid: false };
      }
    }

    const prompt = `Validate this input: "${answer}" for key: ${key}.
    Rules: ${validationOptions[key]}
    Return only "VALID:<value>" if valid, or "INVALID" if not.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0]?.message?.content?.trim();
    if (result?.startsWith("VALID:")) {
      return { isValid: true, value: result.replace("VALID:", "").trim() };
    }
    return { isValid: false };
  }

  async getCommonQuestion(
    step: number,
    language: "EN" | "HI" = "EN",
    context: Record<string, string> = {}
  ): Promise<{ key: string; question: string } | null> {
    if (step >= commonKeys.length) return null;
    const key = commonKeys[step];
    const mappedKey = commonKeysMapping[key][language] || key;
    const question = await this.generateQuestion(mappedKey, "", language, context);
    return { key, question };
  }

  async getRoleQuestion(
    role: string,
    step: number,
    language: "EN" | "HI" = "EN",
    context: Record<string, string> = {}
  ): Promise<{ key: string; question: string } | null> {
    const keys = roleKeys[role];
    if (!keys || step >= keys.length) return null;
    const key = keys[step];
    const mappedKey = roleKeysMapping[key][language] || key;
    const question = await this.generateQuestion(mappedKey, role, language, context);
    return { key, question };
  }
}

// ✅ Singleton instance (persists across warm requests)
export const openAiService = new OpenAiService();
