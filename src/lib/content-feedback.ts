/**
 * Content Feedback — performance loop for editorial learning.
 * Tracks perceived outcomes and feeds into strategic memory + advisor.
 */

import { supabase } from "@/integrations/supabase/client";
import type { BenchmarkPresetId } from "@/lib/benchmark-presets";
import { getPreset } from "@/lib/benchmark-presets";
import type { PreferredVisualStyle } from "@/types/carousel";

/* ── Types ──────────────────────────────────────────────── */

export type OutcomeTag =
  | "gerou_comentarios"
  | "gerou_salvamentos"
  | "gerou_leads"
  | "ficou_bonito_mas_morno"
  | "nao_combinou_publico"
  | "funcionou_muito_bem"
  | "reusar_linha";

export const OUTCOME_OPTIONS: { tag: OutcomeTag; label: string; emoji: string }[] = [
  { tag: "funcionou_muito_bem", label: "Funcionou muito bem", emoji: "🔥" },
  { tag: "gerou_comentarios", label: "Gerou comentários", emoji: "💬" },
  { tag: "gerou_salvamentos", label: "Gerou salvamentos", emoji: "🔖" },
  { tag: "gerou_leads", label: "Gerou leads/consultas", emoji: "📩" },
  { tag: "ficou_bonito_mas_morno", label: "Bonito mas morno", emoji: "😐" },
  { tag: "nao_combinou_publico", label: "Não combinou com meu público", emoji: "🚫" },
  { tag: "reusar_linha", label: "Quero usar essa linha de novo", emoji: "♻️" },
];

export interface ContentFeedback {
  id?: string;
  user_id: string;
  content_output_id: string | null;
  benchmark_preset: BenchmarkPresetId | null;
  visual_style: PreferredVisualStyle | null;
  outcome_tags: OutcomeTag[];
  satisfaction: number | null; // 1-5
  clarity_score: number | null;
  authority_score: number | null;
  aesthetic_score: number | null;
  posted: boolean;
  reuse_direction: boolean;
  notes: string | null;
}

/* ── DB Operations ──────────────────────────────────────── */

export async function saveFeedback(feedback: ContentFeedback): Promise<string | null> {
  const { data, error } = await supabase
    .from("content_feedback")
    .insert({
      user_id: feedback.user_id,
      content_output_id: feedback.content_output_id,
      benchmark_preset: feedback.benchmark_preset,
      visual_style: feedback.visual_style,
      outcome_tags: feedback.outcome_tags as any,
      satisfaction: feedback.satisfaction,
      clarity_score: feedback.clarity_score,
      authority_score: feedback.authority_score,
      aesthetic_score: feedback.aesthetic_score,
      posted: feedback.posted,
      reuse_direction: feedback.reuse_direction,
      notes: feedback.notes,
    } as any)
    .select("id")
    .single();

  if (error) {
    console.warn("Failed to save feedback:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function getFeedbackForUser(userId: string): Promise<ContentFeedback[]> {
  const { data, error } = await supabase
    .from("content_feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    content_output_id: row.content_output_id,
    benchmark_preset: row.benchmark_preset,
    visual_style: row.visual_style,
    outcome_tags: (row.outcome_tags ?? []) as OutcomeTag[],
    satisfaction: row.satisfaction,
    clarity_score: row.clarity_score,
    authority_score: row.authority_score,
    aesthetic_score: row.aesthetic_score,
    posted: row.posted ?? false,
    reuse_direction: row.reuse_direction ?? false,
    notes: row.notes,
  }));
}

/* ── Performance Insights ───────────────────────────────── */

export interface PresetPerformance {
  preset: BenchmarkPresetId;
  label: string;
  avgSatisfaction: number;
  totalUses: number;
  positiveRate: number; // % of positive outcomes
}

const POSITIVE_TAGS: OutcomeTag[] = [
  "funcionou_muito_bem",
  "gerou_comentarios",
  "gerou_salvamentos",
  "gerou_leads",
  "reusar_linha",
];

export function derivePerformanceInsights(
  feedbacks: ContentFeedback[],
): PresetPerformance[] {
  const byPreset: Record<string, { sats: number[]; positive: number; total: number }> = {};

  for (const fb of feedbacks) {
    const key = fb.benchmark_preset ?? "unknown";
    if (!byPreset[key]) byPreset[key] = { sats: [], positive: 0, total: 0 };
    byPreset[key].total += 1;
    if (fb.satisfaction) byPreset[key].sats.push(fb.satisfaction);
    const hasPositive = fb.outcome_tags.some((t) => POSITIVE_TAGS.includes(t));
    if (hasPositive) byPreset[key].positive += 1;
  }

  return Object.entries(byPreset)
    .filter(([key]) => key !== "unknown")
    .map(([key, val]) => ({
      preset: key as BenchmarkPresetId,
      label: getPreset(key).label,
      avgSatisfaction: val.sats.length > 0
        ? Math.round((val.sats.reduce((a, b) => a + b, 0) / val.sats.length) * 10) / 10
        : 0,
      totalUses: val.total,
      positiveRate: val.total > 0 ? Math.round((val.positive / val.total) * 100) : 0,
    }))
    .sort((a, b) => b.positiveRate - a.positiveRate);
}

/** Get a short performance-aware hint for the advisor */
export function getPerformanceHint(feedbacks: ContentFeedback[]): string | null {
  const insights = derivePerformanceInsights(feedbacks);
  if (insights.length === 0) return null;

  const best = insights[0];
  if (best.totalUses < 2) return null;

  return `${best.label} tem ${best.positiveRate}% de resultado positivo em ${best.totalUses} usos`;
}

/** Get best-performing preset from feedback history */
export function getBestPerformingPreset(
  feedbacks: ContentFeedback[],
): BenchmarkPresetId | null {
  const insights = derivePerformanceInsights(feedbacks);
  if (insights.length === 0 || insights[0].totalUses < 2) return null;
  return insights[0].preset;
}
