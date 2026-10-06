import { AiUnavailableError } from "@/lib/ai-generate";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return Response.json({ error, ...extra }, { status });
}

export function mapAiError(error: unknown): Response {
  if (error instanceof AiUnavailableError) {
    return jsonError(503, error.message, { code: "ai_unavailable" });
  }

  const message = error instanceof Error ? error.message : "AI request failed";
  if (/rate limit|quota|429/i.test(message)) {
    return jsonError(
      429,
      "AI quota reached for today. Try again later, or use offline Analyze (heuristic) for job matching.",
      { code: "quota" },
    );
  }
  if (/503|unavailable|overloaded/i.test(message)) {
    return jsonError(503, "AI provider is temporarily unavailable. Retry shortly.", {
      code: "provider_unavailable",
    });
  }

  console.error("[ai]", message);
  return jsonError(500, "AI request failed. Please try again.");
}
