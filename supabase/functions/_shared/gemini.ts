/**
 * Shared helpers for Edge Functions:
 * - CORS headers (re-exported from cors.ts)
 * - Gemini API with retry + exponential backoff (429 handling)
 * - Perplexity API helper (re-exported from perplexity.ts)
 * - Rate limiting (in-memory, per-user)
 * - Response helpers
 */

export { corsHeaders } from "./cors.ts";
export { callPerplexity } from "./perplexity.ts";

// ── Rate Limiting (in-memory, per-user, 10 req/min) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Clean up stale entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ── Gemini ──
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

export async function callGemini(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[Gemini] retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    const res = await fetch(GEMINI_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "gemini-2.5-flash", ...body }),
    });

    if (res.ok) return res;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      lastError = await res.text();
      console.log(`[Gemini] 429 (attempt ${attempt + 1}): ${lastError.slice(0, 120)}`);
      continue;
    }

    return res;
  }

  throw new Error(`Gemini failed after ${MAX_RETRIES} retries: ${lastError}`);
}

export async function callGeminiStream(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return callGemini(apiKey, { stream: true, ...body });
}

// ── Response helpers ──
import { corsHeaders as _corsHeaders } from "./cors.ts";

export function errorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ..._corsHeaders, "Content-Type": "application/json" } },
  );
}

export function jsonResponse(data: unknown) {
  return new Response(
    JSON.stringify(data),
    { headers: { ..._corsHeaders, "Content-Type": "application/json" } },
  );
}

export function streamResponse(body: ReadableStream | null) {
  return new Response(body, {
    headers: { ..._corsHeaders, "Content-Type": "text/event-stream" },
  });
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
    { status: 429, headers: { ..._corsHeaders, "Content-Type": "application/json" } },
  );
}
