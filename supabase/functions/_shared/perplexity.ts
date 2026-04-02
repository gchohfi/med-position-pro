/**
 * Shared Perplexity helpers for Edge Functions.
 *
 * callPerplexity       — returns raw Response (or null on failure), body = { model, ...body }
 * callPerplexityText   — returns the text content string from the first choice
 * callPerplexityStream — returns a streaming Perplexity Response (or null)
 */

const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";
const DEFAULT_MODEL = "sonar";

// ── Low-level: returns raw Response (or null) ─────────────────────────────────

export async function callPerplexity(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response | null> {
  try {
    const res = await fetch(PERPLEXITY_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: DEFAULT_MODEL, ...body }),
    });
    if (res.ok) return res;
    console.log(`[Perplexity] error: ${res.status}`);
    return null;
  } catch (e) {
    console.log(`[Perplexity] exception: ${e}`);
    return null;
  }
}

// ── Helper: returns plain text from first choice, throws on failure ───────────

export async function callPerplexityText(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model = DEFAULT_MODEL,
  extraBody: Record<string, unknown> = {},
): Promise<string> {
  const res = await fetch(PERPLEXITY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, ...extraBody }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Helper: streaming variant ─────────────────────────────────────────────────

export async function callPerplexityStream(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response | null> {
  return callPerplexity(apiKey, { stream: true, ...body });
}
