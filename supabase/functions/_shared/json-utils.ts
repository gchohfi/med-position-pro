/**
 * Safe JSON parsing utility for AI-generated content.
 * Handles control characters, smart quotes, and other common issues
 * that Gemini/LLMs sometimes include in their JSON output.
 */

export function safeJsonParse(content: unknown): any {
  // If already an object, return as-is
  if (typeof content === "object" && content !== null) return content;

  const raw = typeof content === "string" ? content : JSON.stringify(content);

  // First try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // Clean control characters and smart quotes
    let cleaned = raw.replace(/[\x00-\x1f\x7f-\x9f]/g, " ");
    cleaned = cleaned.replace(/\u201c/g, '"').replace(/\u201d/g, '"');
    cleaned = cleaned.replace(/\u2018/g, "'").replace(/\u2019/g, "'");

    try {
      return JSON.parse(cleaned);
    } catch {
      // Try extracting JSON object from surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response as JSON");
    }
  }
}
