/**
 * Input sanitization for AI prompts.
 *
 * Strips common prompt-injection patterns that try to override system
 * instructions or inject new roles. This is NOT a bullet-proof defense
 * (no text filter can be), but it raises the bar significantly and
 * removes the most obvious attack vectors.
 */

const INJECTION_PATTERNS = [
  // Role overrides
  /\b(ignore|disregard|forget)\b.{0,30}\b(above|previous|prior|instructions?|system|prompt)\b/gi,
  // New role injections
  /\b(you are now|act as|pretend to be|new instructions?|system:\s)/gi,
  // Delimiter escapes (common in GPT-style attacks)
  /```(system|assistant|user)\b/gi,
  // XML-style injection tags
  /<\/?(?:system|instructions?|prompt|role|context)\b[^>]*>/gi,
];

/**
 * Sanitize user-provided text before embedding it in an AI prompt.
 *
 * - Trims and limits length
 * - Strips known prompt-injection patterns
 * - Returns empty string for falsy input
 */
export function sanitizeInput(input: unknown, maxLength = 2000): string {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim().slice(0, maxLength);
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[filtered]");
  }
  return clean;
}

/**
 * Sanitize an array of strings (e.g. pilares, hashtags).
 */
export function sanitizeArray(arr: unknown, maxItems = 20, maxItemLength = 200): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((item) => sanitizeInput(item, maxItemLength))
    .filter(Boolean);
}
