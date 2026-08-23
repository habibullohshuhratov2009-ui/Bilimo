import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/config/env";

let client: Anthropic | null = null;
function ai(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicKey() });
  return client;
}

export type AiText = { text: string; model: string; inTokens: number; outTokens: number };

/** AI o'chiq bo'lsa shu xato uchadi — routelar uni 503 ga aylantiradi. */
export class AiDisabledError extends Error {
  constructor() {
    super("AI o'chirilgan");
    this.name = "AiDisabledError";
  }
}

export async function ask(system: string, user: string, maxTokens = 900, model?: string): Promise<AiText> {
  if (!env.aiEnabled()) throw new AiDisabledError();
  const res = await ai().messages.create({
    model: model ?? env.model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  return {
    text,
    model: res.model,
    inTokens: res.usage.input_tokens,
    outTokens: res.usage.output_tokens,
  };
}

export type QuizQuestion = { q: string; options: string[]; correct: number; why: string };

/** Model ba'zan JSON atrofiga matn qo'shadi — shuni tozalab, tekshirib qaytaramiz. */
export function parseQuiz(raw: string): QuizQuestion[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI javobida JSON topilmadi");
  const data = JSON.parse(raw.slice(start, end + 1));
  const list = Array.isArray(data.questions) ? data.questions : [];
  const ok = list.filter(
    (x: any) =>
      typeof x?.q === "string" &&
      Array.isArray(x.options) &&
      x.options.length === 4 &&
      Number.isInteger(x.correct) &&
      x.correct >= 0 &&
      x.correct < 4
  );
  if (!ok.length) throw new Error("AI test tuza olmadi");
  return ok as QuizQuestion[];
}
