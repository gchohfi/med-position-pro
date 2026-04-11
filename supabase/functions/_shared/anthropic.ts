/**
 * Shared AI helpers for Edge Functions — now routed through Lovable AI Gateway.
 *
 * callClaude      — non-streaming, returns parsed JSON
 * callClaudeRaw   — non-streaming, returns the raw text
 * callClaudeStream — streaming, returns the OpenAI-compatible SSE Response
 * buildAnthropicStream — pass-through (stream is already OpenAI-compatible)
 *
 * All functions now accept `_apiKey` for backward compat but use LOVABLE_API_KEY.
 */

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  stream?: boolean;
}

function getLovableKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

// ── Non-streaming: returns raw text ──────────────────────────────────────────

export async function callClaudeRaw(
  _apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeOptions = {},
): Promise<string> {
  const key = getLovableKey();

  const res = await fetch(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      max_tokens: opts.maxTokens || 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded — try again later");
    if (res.status === 402) throw new Error("Credits exhausted — add funds in Settings → Workspace → Usage");
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return content;
}

// ── Non-streaming: returns parsed JSON ───────────────────────────────────────

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeOptions = {},
): Promise<Record<string, unknown>> {
  const { extractJSON } = await import("./json.ts");
  const text = await callClaudeRaw(apiKey, systemPrompt, userPrompt, opts);
  return extractJSON(text);
}

// ── Streaming: returns the SSE Response (already OpenAI-compatible) ──────────

export async function callClaudeStream(
  _apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeOptions = {},
): Promise<Response> {
  const key = getLovableKey();

  const res = await fetch(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded — try again later");
    if (res.status === 402) throw new Error("Credits exhausted — add funds in Settings → Workspace → Usage");
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  return res;
}

/**
 * buildAnthropicStream — now a simple pass-through since the Lovable AI Gateway
 * already returns OpenAI-compatible SSE format. The body is forwarded as-is.
 */
export function buildAnthropicStream(gatewayResponse: Response): ReadableStream {
  return gatewayResponse.body!;
}
