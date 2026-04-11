/**
 * Strategic Memory — learns editorial preferences per user over time.
 * Feeds signals from preset choices, rewrites, exports, and saves.
 */

import { supabase } from "@/integrations/supabase/client";
import type { BenchmarkPresetId } from "@/lib/benchmark-presets";
import { getPreset, PRESET_LIST } from "@/lib/benchmark-presets";
import type { PreferredVisualStyle } from "@/types/carousel";

/* ── Types ──────────────────────────────────────────────── */

export interface StrategicMemory {
  id?: string;
  user_id: string;
  preferred_presets: BenchmarkPresetId[];
  rejected_patterns: string[];
  preferred_visual_styles: PreferredVisualStyle[];
  tone_preferences: Record<string, number>;     // e.g. { "sofisticado": 5, "provocativo": 1 }
  cta_preferences: Record<string, number>;
  hook_intensity: "leve" | "moderado" | "forte";
  last_accepted_directions: DirectionEntry[];
  last_rejected_directions: DirectionEntry[];
  rewrite_count: number;
  export_count: number;
  notes_summary: string | null;
  updated_at?: string;
}

interface DirectionEntry {
  preset: BenchmarkPresetId;
  visual: PreferredVisualStyle;
  ts: string;
}

export type MemorySignal =
  | { type: "preset_chosen"; preset: BenchmarkPresetId }
  | { type: "preset_rejected"; preset: BenchmarkPresetId }
  | { type: "visual_chosen"; visual: PreferredVisualStyle }
  | { type: "rewrite" }
  | { type: "export" }
  | { type: "save"; preset: BenchmarkPresetId; visual: PreferredVisualStyle };

const EMPTY_MEMORY: Omit<StrategicMemory, "user_id"> = {
  preferred_presets: [],
  rejected_patterns: [],
  preferred_visual_styles: [],
  tone_preferences: {},
  cta_preferences: {},
  hook_intensity: "moderado",
  last_accepted_directions: [],
  last_rejected_directions: [],
  rewrite_count: 0,
  export_count: 0,
  notes_summary: null,
};

/* ── DB Operations ──────────────────────────────────────── */

export async function getStrategicMemoryForUser(userId: string): Promise<StrategicMemory | null> {
  const { data, error } = await supabase
    .from("strategic_memory")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load strategic memory:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    preferred_presets: (data.preferred_presets as BenchmarkPresetId[]) ?? [],
    rejected_patterns: (data.rejected_patterns as string[]) ?? [],
    preferred_visual_styles: (data.preferred_visual_styles as PreferredVisualStyle[]) ?? [],
    tone_preferences: (data.tone_preferences as Record<string, number>) ?? {},
    cta_preferences: (data.cta_preferences as Record<string, number>) ?? {},
    hook_intensity: (data.hook_intensity as StrategicMemory["hook_intensity"]) ?? "moderado",
    last_accepted_directions: (data.last_accepted_directions as unknown as DirectionEntry[]) ?? [],
    last_rejected_directions: (data.last_rejected_directions as unknown as DirectionEntry[]) ?? [],
    rewrite_count: data.rewrite_count ?? 0,
    export_count: data.export_count ?? 0,
    notes_summary: data.notes_summary,
    updated_at: data.updated_at,
  };
}

export async function updateStrategicMemory(
  userId: string,
  memory: Partial<Omit<StrategicMemory, "user_id" | "id">>,
): Promise<void> {
  const existing = await getStrategicMemoryForUser(userId);

  if (existing) {
    await supabase
      .from("strategic_memory")
      .update(memory as any)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("strategic_memory")
      .insert({ user_id: userId, ...EMPTY_MEMORY, ...memory } as any);
  }
}

/* ── Signal Processing ──────────────────────────────────── */

/** Process a batch of signals and merge into existing memory */
export async function processMemorySignals(
  userId: string,
  signals: MemorySignal[],
): Promise<void> {
  const mem = (await getStrategicMemoryForUser(userId)) ?? { user_id: userId, ...EMPTY_MEMORY };

  for (const sig of signals) {
    switch (sig.type) {
      case "preset_chosen": {
        // Boost preferred preset
        const list = [...mem.preferred_presets];
        if (!list.includes(sig.preset)) list.push(sig.preset);
        mem.preferred_presets = list.slice(-5);
        // Track tone
        const preset = getPreset(sig.preset);
        mem.tone_preferences[preset.behavior.hookStyle] =
          (mem.tone_preferences[preset.behavior.hookStyle] ?? 0) + 1;
        mem.cta_preferences[preset.behavior.ctaStyle] =
          (mem.cta_preferences[preset.behavior.ctaStyle] ?? 0) + 1;
        // Track accepted direction
        mem.last_accepted_directions = [
          { preset: sig.preset, visual: preset.preferredVisualStyle, ts: new Date().toISOString() },
          ...mem.last_accepted_directions,
        ].slice(0, 10);
        break;
      }
      case "preset_rejected": {
        const rejList = [...mem.rejected_patterns];
        if (!rejList.includes(sig.preset)) rejList.push(sig.preset);
        mem.rejected_patterns = rejList.slice(-10);
        const rPreset = getPreset(sig.preset);
        mem.last_rejected_directions = [
          { preset: sig.preset, visual: rPreset.preferredVisualStyle, ts: new Date().toISOString() },
          ...mem.last_rejected_directions,
        ].slice(0, 10);
        break;
      }
      case "visual_chosen": {
        const vList = [...mem.preferred_visual_styles];
        if (!vList.includes(sig.visual)) vList.push(sig.visual);
        mem.preferred_visual_styles = vList.slice(-5);
        break;
      }
      case "rewrite":
        mem.rewrite_count += 1;
        break;
      case "export":
        mem.export_count += 1;
        break;
      case "save": {
        const sList = [...mem.preferred_presets];
        if (!sList.includes(sig.preset)) sList.push(sig.preset);
        mem.preferred_presets = sList.slice(-5);
        const svList = [...mem.preferred_visual_styles];
        if (!svList.includes(sig.visual)) svList.push(sig.visual);
        mem.preferred_visual_styles = svList.slice(-5);
        mem.last_accepted_directions = [
          { preset: sig.preset, visual: sig.visual, ts: new Date().toISOString() },
          ...mem.last_accepted_directions,
        ].slice(0, 10);
        break;
      }
    }
  }

  // Derive hook intensity from tone preferences
  const hookScores = mem.tone_preferences;
  const totalHookSignals = Object.values(hookScores).reduce((a, b) => a + b, 0);
  if (totalHookSignals >= 3) {
    const provocativo = (hookScores["provocativo"] ?? 0);
    const ratio = provocativo / totalHookSignals;
    mem.hook_intensity = ratio > 0.5 ? "forte" : ratio < 0.2 ? "leve" : "moderado";
  }

  const { user_id, id, updated_at, ...rest } = mem as StrategicMemory;
  await updateStrategicMemory(userId, rest);
}

/* ── Recommendation ─────────────────────────────────────── */

export interface MemoryRecommendation {
  suggestedPreset: BenchmarkPresetId;
  confidence: "alta" | "media" | "baixa";
  reason: string;
}

/** Get a memory-aware preset recommendation. Briefing suggestion takes priority but memory adjusts. */
export function getMemoryAwarePresetRecommendation(
  memory: StrategicMemory | null,
  briefingSuggestion?: BenchmarkPresetId,
): MemoryRecommendation {
  // No memory → use briefing or default
  if (!memory || memory.last_accepted_directions.length === 0) {
    return {
      suggestedPreset: briefingSuggestion ?? "autoridade_premium",
      confidence: "baixa",
      reason: briefingSuggestion
        ? "Recomendação baseada no briefing atual."
        : "Sem histórico suficiente ainda.",
    };
  }

  // Count preset frequency in accepted directions
  const freq: Record<string, number> = {};
  for (const d of memory.last_accepted_directions) {
    freq[d.preset] = (freq[d.preset] ?? 0) + 1;
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const topPreset = sorted[0]?.[0] as BenchmarkPresetId | undefined;
  const topCount = sorted[0]?.[1] ?? 0;

  // If briefing suggestion is rejected frequently, override
  if (briefingSuggestion && memory.rejected_patterns.includes(briefingSuggestion) && topPreset) {
    return {
      suggestedPreset: topPreset,
      confidence: "alta",
      reason: `Você costuma preferir ${getPreset(topPreset).label}. A direção "${getPreset(briefingSuggestion).label}" foi ajustada com base no seu histórico.`,
    };
  }

  // If we have strong signal (3+), use it
  if (topPreset && topCount >= 3) {
    // But if briefing suggests differently, note it
    if (briefingSuggestion && briefingSuggestion !== topPreset) {
      return {
        suggestedPreset: topPreset,
        confidence: "media",
        reason: `Seu histórico favorece ${getPreset(topPreset).label}, mas o briefing sugere ${getPreset(briefingSuggestion).label}.`,
      };
    }
    return {
      suggestedPreset: topPreset,
      confidence: "alta",
      reason: `Baseado no seu histórico de ${topCount} usos recentes.`,
    };
  }

  // Weak signal → briefing wins
  return {
    suggestedPreset: briefingSuggestion ?? topPreset ?? "autoridade_premium",
    confidence: "baixa",
    reason: "Recomendação inicial — seu perfil de preferências ainda está se formando.",
  };
}

/** Short UI-friendly hint from memory */
export function getMemoryHint(memory: StrategicMemory | null): string | null {
  if (!memory || memory.last_accepted_directions.length < 2) return null;

  const freq: Record<string, number> = {};
  for (const d of memory.last_accepted_directions) {
    freq[d.preset] = (freq[d.preset] ?? 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top || top[1] < 2) return null;

  const preset = getPreset(top[0] as BenchmarkPresetId);
  return `Você costuma preferir ${preset.label}`;
}
