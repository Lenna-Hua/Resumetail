import { generateObject, generateText, type LanguageModel } from "ai";
import type { ZodType } from "zod";
import {
  getFallbackModel,
  getPrimaryModel,
  hasAnyAiKey,
  isRetryableAiError,
} from "@/lib/ai-model";

export class AiUnavailableError extends Error {
  constructor(message = "No AI provider configured.") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

async function withAiFallback<T>(
  run: (model: LanguageModel) => Promise<T>,
): Promise<T> {
  const primary = getPrimaryModel();
  if (!primary) {
    throw new AiUnavailableError(
      "AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY.",
    );
  }

  try {
    return await run(primary);
  } catch (error) {
    const fallback = getFallbackModel();
    if (!fallback || !isRetryableAiError(error)) throw error;
    return await run(fallback);
  }
}

export async function generateAiObject<T>(options: {
  schema: ZodType<T>;
  system?: string;
  prompt: string;
}): Promise<T> {
  const { object } = await withAiFallback((model) =>
    generateObject({
      model,
      schema: options.schema,
      system: options.system,
      prompt: options.prompt,
    }),
  );
  return object;
}

export async function generateAiText(options: {
  system?: string;
  prompt: string;
}): Promise<string> {
  const { text } = await withAiFallback((model) =>
    generateText({
      model,
      system: options.system,
      prompt: options.prompt,
    }),
  );
  return text.trim();
}

export { hasAnyAiKey };
