/**
 * Shared Anthropic / Claude helpers for Edge Functions.
 *
 * callClaude      — non-streaming, returns parsed JSON
 * callClaudeRaw   — non-streaming, returns the raw text from Claude
 * callClaudeStream — streaming, returns the Anthropic SSE Response
 * buildAnthropicStream — converts Anthropic SSE → OpenAI-compatible SSE ReadableStream
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  stream?: boolean;
}

// ── Non-streaming: returns raw text ──────────────────────────────────────────

export async function callClaudeRaw(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeOptions = {},
): Promise<string> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: false,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (!content) throw new Error("Resposta vazia do Claude");
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

// ── Streaming: returns the raw Anthropic Response ────────────────────────────

export async function callClaudeStream(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeOptions = {},
): Promise<Response> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  return res;
}

/**
 * Converts an Anthropic SSE response body into an OpenAI-compatible SSE
 * ReadableStream (data: { choices:[{ delta:{ content } }] }\n\n).
 */
export function buildAnthropicStream(anthropicResponse: Response): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const reader = anthropicResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              const chunk = JSON.stringify({
                choices: [{ delta: { content: parsed.delta.text } }],
              });
              controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}
