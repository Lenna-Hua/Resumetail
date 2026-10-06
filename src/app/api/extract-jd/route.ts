import { z } from "zod";
import { generateAiObject, hasAnyAiKey } from "@/lib/ai-generate";
import { jsonError } from "@/lib/api-errors";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { extractJdHeuristic } from "@/lib/extract-jd-heuristic";
import { normalizeParsedJD } from "@/lib/coverage";

const WeightedSkillSchema = z.object({
  phrase: z.string(),
  weight: z.number().min(0).max(1),
  forms: z.array(z.string()).optional(),
});

const ParsedJdSchema = z.object({
  roleTitle: z.string(),
  seniority: z.string(),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
  skills: z
    .object({
      hard: z.array(WeightedSkillSchema),
      soft: z.array(WeightedSkillSchema),
      domain: z.array(WeightedSkillSchema),
    })
    .optional(),
});

const BodySchema = z.object({
  jdText: z.string().min(50, "Paste at least 50 characters of job description."),
});

export async function POST(request: Request) {
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

  const { jdText } = parsed.data;

  // Always available: heuristic path when AI is not configured.
  if (!hasAnyAiKey()) {
    return Response.json({
      parsedJD: extractJdHeuristic(jdText),
      source: "heuristic",
    });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`extract-jd:${ip}`);
  if (!limit.ok) {
    return Response.json(
      {
        parsedJD: extractJdHeuristic(jdText),
        source: "heuristic",
        warning: "AI daily limit reached — used offline extraction instead.",
      },
      {
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  try {
    const object = await generateAiObject({
      schema: ParsedJdSchema,
      system:
        "You extract structured hiring signals from job descriptions for resume matching. Be precise; prefer exact skill phrases from the posting. Weight required skills higher (0.8–1.0) than preferred (0.4–0.7). Include common acronym/full-name forms when relevant.",
      prompt: `Extract a structured job profile from this posting:\n\n${jdText.slice(0, 12000)}`,
    });

    return Response.json({
      parsedJD: normalizeParsedJD(object),
      source: "ai",
      remaining: limit.remaining,
    });
  } catch (error) {
    // Degrade gracefully — checker-first product stays useful.
    console.error("[extract-jd] AI failed, falling back to heuristic", error);
    return Response.json({
      parsedJD: extractJdHeuristic(jdText),
      source: "heuristic",
      warning: "AI extract failed — used offline extraction instead.",
    });
  }
}
