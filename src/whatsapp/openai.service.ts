import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import {
  roleKeys,
  validationOptions,
  commonKeys,
  commonKeysMapping,
  roleKeysMapping,
} from "../constants/constants";


@Injectable()
export class OpenAiService {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



  async generateQuestion(
    key: string,
    role: string = "",
    language: "EN" | "HI" = "EN",
    context: Record<string, string> = {}
  ): Promise<string> {
    // pick a random variation from key
    const variations = key.split("|").map(q => q.trim()).filter(Boolean);
    const selected = variations[Math.floor(Math.random() * variations.length)];

    // role prompt
    const rolePrompt = role
      ? `You are a friendly HR assistant interviewing for the role "${role}".`
      : "You are a friendly HR assistant collecting general job application details.";

    // language prompt
    const langPrompt =
      language === "HI"
        ? "Generate the question in polite Hindi (use 'आप'), keep it short, friendly, whatsapp tone."
        : "Generate the question in English, keep it short, friendly, natural.";

    // refined name context
    const nameContext = context.full_name
      ? `The candidate's name is ${context.full_name}. 
       Mention their name occasionally (e.g., once in every 2–3 questions), 
       not in every response. If not natural, skip it.`
      : "";

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${rolePrompt} ${langPrompt}
        - Task: Rephrase the given question so it doesn’t look hardcoded.
        - Always keep it warm and conversational, keep it interactive.
        - Keep sentences very simple, avoid heavy Hindi words (use normal Hinglish).
        - Only bold the placeholder words (like name, city).
        - Do NOT change the meaning of the question.
        - Do NOT add quotation marks around the output.
        ${nameContext}`,
        },
        {
          role: "user",
          content: `Question: ${selected}`,
        },
      ],
    });
    const raw = completion.choices[0].message?.content?.trim() ?? selected;
    return raw.replace(/\*\*(.*?)\*\*/g, "*$1*");
  }


  async validateAnswer(key: string, answer: string): Promise<{ isValid: boolean; value?: string }> {
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

    const response = await this.client.chat.completions.create({
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
