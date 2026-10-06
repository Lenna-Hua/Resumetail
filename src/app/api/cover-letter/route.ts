import { z } from "zod";
import { generateAiObject, hasAnyAiKey } from "@/lib/ai-generate";
import { mapAiError, jsonError } from "@/lib/api-errors";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getTonePreset } from "@/lib/cover-letter-tones";
import type { CoverLetterTone } from "@/lib/types";

const BodySchema = z.object({
  resumeText: z.string().min(40),
  jdSummary: z.string().min(20),
  roleTitle: z.string().optional(),
  tone: z.enum(["concise", "friendly", "direct"]).default("concise"),
});

const ResultSchema = z.object({
  letter: z.string(),
  highlights: z.array(z.string()),
});

export async function POST(request: Request) {
  if (!hasAnyAiKey()) {
    return jsonError(
      503,
      "Cover letter drafting needs an AI API key. You can still write one manually.",
      { code: "ai_unavailable" },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`ai:${ip}`);
  if (!limit.ok) {
    return jsonError(429, "AI daily limit reached (~20 calls). Try again tomorrow.", {
      code: "quota",
      retryAfterSec: limit.retryAfterSec,
    });
  }

  const { resumeText, jdSummary, roleTitle, tone } = parsed.data;
  const tonePreset = getTonePreset(tone as CoverLetterTone);

  try {
    const object = await generateAiObject({
      schema: ResultSchema,
      system: `You draft honest cover letters from a resume and job profile. Never invent employers, degrees, or metrics. ${tonePreset.instruction}`,
      prompt: [
        roleTitle ? `Target role: ${roleTitle}` : null,
        `Job profile:\n${jdSummary.slice(0, 4000)}`,
        `Resume:\n${resumeText.slice(0, 6000)}`,
        "Write the letter body only (no postal header). Also list 3–5 highlights you emphasized.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    return Response.json({ ...object, remaining: limit.remaining });
  } catch (error) {
    return mapAiError(error);
  }
}
