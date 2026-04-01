export const ANTHROPIC_MODELS = {
  SONNET: "claude-sonnet-4-20250514",
  HAIKU: "claude-haiku-4-20250414",
} as const;

export type AnthropicModel = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];
