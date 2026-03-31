/**
 * Shared helpers for Edge Functions:
 * - CORS headers
 * - Gemini API with retry + exponential backoff (429 handling)
 * - Perplexity API helper (optional, web-grounded)
 * - Rate limiting (in-memory, per-user)
 * - Response helpers
 */

// ── CORS ──
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
export const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// ── Perplexity (optional) ──
export async function callPerplexity(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response | null> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "sonar", ...body }),
    });
    if (res.ok) return res;
    console.log(`[Perplexity] error: ${res.status}`);
    return null;
  } catch (e) {
    console.log(`[Perplexity] exception: ${e}`);
    return null;
  }
}

// ── Response helpers ──
export function errorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export function jsonResponse(data: unknown) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export function streamResponse(body: ReadableStream | null) {
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
