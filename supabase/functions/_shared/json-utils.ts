/**
 * Safe JSON parsing utility for AI-generated content.
 * Handles control characters, smart quotes, escaped single quotes,
 * and other common issues that Gemini/LLMs include in their JSON output.
 */

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
    // Gemini frequently produces these in Portuguese text
    cleaned = cleaned.replace(/\\'/g, "'");

    // Fix 2: Clean control characters (except valid JSON escapes like \n, \t)
    // Replace raw control chars, not the escaped versions
    cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, " ");

    // Fix 3: Replace smart/curly quotes with standard quotes
    cleaned = cleaned.replace(/\u201c/g, '"').replace(/\u201d/g, '"');
    cleaned = cleaned.replace(/\u2018/g, "'").replace(/\u2019/g, "'");

    // Fix 4: Remove trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(cleaned);
    } catch {
      // Try extracting JSON object from surrounding text (e.g., markdown fences)
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Last resort: try to fix common issues in the extracted JSON
          let extracted = jsonMatch[0];
          // Remove any remaining invalid escape sequences
          extracted = extracted.replace(/\\([^"\\\/bfnrtu])/g, "$1");
          return JSON.parse(extracted);
        }
      }
      throw new Error("Could not parse AI response as JSON");
    }
  }
}
