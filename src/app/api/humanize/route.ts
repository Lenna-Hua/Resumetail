import { z } from "zod";
import { generateAiObject, hasAnyAiKey } from "@/lib/ai-generate";
import { mapAiError, jsonError } from "@/lib/api-errors";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({
  text: z.string().min(40),
  context: z.string().optional(),
});

const ResultSchema = z.object({
  text: z.string(),
});

export async function POST(request: Request) {
  if (!hasAnyAiKey()) {
    return jsonError(503, "Humanize needs an AI API key.", { code: "ai_unavailable" });
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

  const { text, context } = parsed.data;

  try {
    const object = await generateAiObject({
      schema: ResultSchema,
      system:
        "You lightly humanize professional writing. Remove AI-sounding filler and clichés while preserving facts, tone, and meaning. Do not invent content.",
      prompt: [
        context ? `Role context: ${context}` : null,
        `Rewrite to sound more natural:\n\n${text.slice(0, 6000)}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    return Response.json({ ...object, remaining: limit.remaining });
  } catch (error) {
    return mapAiError(error);
  }
}
