/**
 * Shared JSON extraction helper for Edge Functions.
 * Uses safeJsonParse for robust handling of truncated/malformed AI output.
 */

import { safeJsonParse } from "./json-utils.ts";

export function extractJSON(text: string): Record<string, unknown> {
  // 1. Direct robust parse
  try {
    return safeJsonParse(text);
  } catch {
    // fall through
  }

  // 2. Strip markdown code fences
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return safeJsonParse(stripped);
  } catch {
    // fall through
  }

  // 3. Find first { … } block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    return safeJsonParse(match[0]);
  }

  throw new Error("Não foi possível extrair JSON da resposta");
}
