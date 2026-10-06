import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

export type AiProviderId = "google" | "groq";

export function hasGoogleKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function hasAnyAiKey(): boolean {
  return hasGoogleKey() || hasGroqKey();
}

export function getPrimaryModel(): LanguageModel | null {
  if (hasGoogleKey()) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    const modelId =
      process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || "gemini-2.5-flash-lite";
    return google(modelId);
  }

  if (hasGroqKey()) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
    return groq(modelId);
  }

  return null;
}

export function getFallbackModel(): LanguageModel | null {
  if (!hasGoogleKey() || !hasGroqKey()) return null;
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  return groq(modelId);
}

export function isRetryableAiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status =
    "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : "status" in error
        ? Number((error as { status?: number }).status)
        : NaN;
  if (status === 429 || status === 503) return true;
  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return /rate limit|quota|overloaded|unavailable|429|503/i.test(message);
}
