/**
 * Safe JSON parsing utility for AI-generated content.
 * Handles control characters, smart quotes, escaped single quotes,
 * truncated responses, and other common issues that Gemini/LLMs
 * include in their JSON output.
 */

/**
 * Extract a JSON object from AI text that may contain markdown fences or surrounding prose.
 * For more robust parsing (control chars, truncation repair), use safeJsonParse instead.
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

export function safeJsonParse(content: unknown): any {
  // If already an object, return as-is
  if (typeof content === "object" && content !== null) return content;

  const raw = typeof content === "string" ? content : String(content);

  // First try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // Apply all known fixes
    let cleaned = raw;

    // Fix 1: Replace escaped single quotes (\') which are invalid in JSON
    cleaned = cleaned.replace(/\\'/g, "'");

    // Fix 2: Remove ALL invalid escape sequences (keep only valid JSON escapes)
    cleaned = cleaned.replace(/\\([^"\\\/bfnrtu])/g, "$1");

    // Fix 3: Clean raw control characters
    cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, " ");

    // Fix 4: Replace smart/curly quotes with standard quotes
    cleaned = cleaned.replace(/\u201c/g, '"').replace(/\u201d/g, '"');
    cleaned = cleaned.replace(/\u2018/g, "'").replace(/\u2019/g, "'");

    // Fix 5: Remove trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(cleaned);
    } catch {
      // Fix 6: Handle truncated JSON (when max_completion_tokens cuts off)
      if (!cleaned.trimEnd().endsWith("}")) {
        const repaired = repairTruncatedJson(cleaned);
        if (repaired) {
          try {
            return JSON.parse(repaired);
          } catch {
            // Fall through to regex extraction
          }
        }
      }

      // Fix 7: Try extracting JSON object from surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Try repairing the extracted JSON too
          const repaired = repairTruncatedJson(jsonMatch[0]);
          if (repaired) {
            try {
              return JSON.parse(repaired);
            } catch {
              // Final fallback
            }
          }
        }
      }
      throw new Error("Could not parse AI response as JSON");
    }
  }
}

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 */
function repairTruncatedJson(json: string): string | null {
  try {
    // Find the last complete value (before truncation)
    // Remove any trailing incomplete string
    let repaired = json;

    // If we're inside an unterminated string, close it
    const lastQuote = repaired.lastIndexOf('"');
    if (lastQuote > 0) {
      // Check if this quote is the start of an unterminated string
      const afterQuote = repaired.substring(lastQuote + 1);
      // If there's no closing quote after content, the string is unterminated
      if (!afterQuote.includes('"') && afterQuote.trim().length > 0) {
        // Truncate to the last complete property
        const lastComma = repaired.lastIndexOf(",", lastQuote);
        const lastBrace = repaired.lastIndexOf("}", lastQuote);
        const lastBracket = repaired.lastIndexOf("]", lastQuote);
        const cutPoint = Math.max(lastComma, lastBrace, lastBracket);
        if (cutPoint > 0) {
          repaired = repaired.substring(0, cutPoint);
          // Remove trailing comma if present
          repaired = repaired.replace(/,\s*$/, "");
        }
      }
    }

    // Count and close open braces/brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (const ch of repaired) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === "{") openBraces++;
        else if (ch === "}") openBraces--;
        else if (ch === "[") openBrackets++;
        else if (ch === "]") openBrackets--;
      }
    }

    // Close any open brackets then braces
    repaired += "]".repeat(Math.max(0, openBrackets));
    repaired += "}".repeat(Math.max(0, openBraces));

    return repaired;
  } catch {
    return null;
  }
}
