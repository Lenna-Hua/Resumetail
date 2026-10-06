import { z } from "zod";
import { generateAiObject, hasAnyAiKey } from "@/lib/ai-generate";
import { mapAiError, jsonError } from "@/lib/api-errors";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({
  bullet: z.string().min(1),
  section: z.string().optional(),
  resumeContext: z.string().optional(),
  jdSummary: z.string().min(1),
});

const ResultSchema = z.object({
  suggestion: z.string(),
  alignedJdElements: z.array(z.string()),
});

export async function POST(request: Request) {
  if (!hasAnyAiKey()) {
    return jsonError(
      503,
      "AI rewrite needs GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY. Match checks still work without AI.",
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

  const { bullet, section, resumeContext, jdSummary } = parsed.data;

  try {
    const object = await generateAiObject({
      schema: ResultSchema,
      system:
        "You rewrite resume bullets for a specific job. Preserve truthful achievements, metrics, employers, and tools. Do not invent experience. Prefer strong action verbs and outcome language. Keep roughly similar length.",
      prompt: [
        `Section: ${section || "Experience"}`,
        `Job profile:\n${jdSummary.slice(0, 4000)}`,
        resumeContext ? `Resume context (do not copy blindly):\n${resumeContext.slice(0, 3000)}` : null,
        `Original bullet:\n${bullet}`,
        "Return one improved bullet and the JD elements it aligns to.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    return Response.json({ ...object, remaining: limit.remaining });
  } catch (error) {
    return mapAiError(error);
  }
}
