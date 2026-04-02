/**
 * Shared JSON extraction helper for Edge Functions.
 *
 * Attempts:
 *  1. Direct JSON.parse
 *  2. Strip markdown code fences, then parse
 *  3. Find the first { … } block, then parse
 */

export function extractJSON(text: string): Record<string, unknown> {
  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }

  // 2. Strip markdown code fences
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // fall through
  }

  // 3. Find first { … } block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }

  throw new Error("Não foi possível extrair JSON da resposta");
}
