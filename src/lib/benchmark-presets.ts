/**
 * Benchmark Presets — Editorial direction system for medical content.
 * Each preset governs tone, hook intensity, narrative rhythm, visual recommendation, and CTA style.
 */

import type { PreferredVisualStyle, TravessIALayout } from "@/types/carousel";

export type BenchmarkPresetId =
  | "impacto_viral"
  | "autoridade_premium"
  | "educacao_sofisticada"
  | "consultorio_humano";

export interface BenchmarkBehavior {
  editorialTone: string;
  hookStyle: "provocativo" | "sofisticado" | "didatico" | "acolhedor";
  ctaStyle: "provocativo" | "refinado" | "acolhedor" | "intimo";
  narrativeRhythm: "alta_tensao" | "elegante" | "didatico" | "conversacional";
  headlineMaxWords: number;
  bodyMaxWords: number;
  turningFrequency: "alta" | "media" | "baixa";
  recommendedLayouts: TravessIALayout[];
  forbiddenPatterns: string[];
  textDensity: "minimal" | "moderada" | "rica";
}

export interface BenchmarkPreset {
  id: BenchmarkPresetId;
  label: string;
  tagline: string;
  description: string;
  icon: string;
  preferredVisualStyle: PreferredVisualStyle;
  behavior: BenchmarkBehavior;
  uiAccentHint: string;
}

export const BENCHMARK_PRESETS: Record<BenchmarkPresetId, BenchmarkPreset> = {
  impacto_viral: {
    id: "impacto_viral",
    label: "Impacto Viral",
    tagline: "Gancho forte, retenção máxima",
    description: "Provoca, quebra crenças e gera comentários e salvamentos. Ritmo alto com headlines curtas.",
    icon: "⚡",
    preferredVisualStyle: "travessia",
    uiAccentHint: "#EF4444",
    behavior: {
      editorialTone: "Direto, provocativo, contraintuitivo. Cada slide é uma afirmação que exige atenção.",
      hookStyle: "provocativo",
      ctaStyle: "provocativo",
      narrativeRhythm: "alta_tensao",
      headlineMaxWords: 5,
      bodyMaxWords: 25,
      turningFrequency: "alta",
      recommendedLayouts: ["capa", "turning", "stat", "tonly", "turning", "light", "final"],
      forbiddenPatterns: ["Headlines genéricas", "Tom professoral", "CTA passivo"],
      textDensity: "minimal",
    },
  },
  autoridade_premium: {
    id: "autoridade_premium",
    label: "Autoridade Premium",
    tagline: "Sofisticação e marca pessoal forte",
    description: "Posicionamento de alto valor com tipografia elegante e tom refinado. Percepção de autoridade.",
    icon: "👑",
    preferredVisualStyle: "editorial_black_gold",
    uiAccentHint: "#C9A84C",
    behavior: {
      editorialTone: "Sofisticado, confiante, editorial. Cada slide transmite expertise e exclusividade.",
      hookStyle: "sofisticado",
      ctaStyle: "refinado",
      narrativeRhythm: "elegante",
      headlineMaxWords: 7,
      bodyMaxWords: 35,
      turningFrequency: "media",
      recommendedLayouts: ["capa", "tonly", "stat", "timg", "turning", "light", "final"],
      forbiddenPatterns: ["Linguagem coloquial", "Exclamações excessivas", "CTA agressivo"],
      textDensity: "moderada",
    },
  },
  educacao_sofisticada: {
    id: "educacao_sofisticada",
    label: "Educação Sofisticada",
    tagline: "Clareza didática, elegância visual",
    description: "Conteúdo útil e salvável com leveza visual. Sensação de consultório premium e acessibilidade.",
    icon: "📖",
    preferredVisualStyle: "ivory_sage",
    uiAccentHint: "#4A7C59",
    behavior: {
      editorialTone: "Didático, claro, acessível. Ensina com elegância sem ser simplista.",
      hookStyle: "didatico",
      ctaStyle: "acolhedor",
      narrativeRhythm: "didatico",
      headlineMaxWords: 8,
      bodyMaxWords: 40,
      turningFrequency: "baixa",
      recommendedLayouts: ["capa", "tonly", "timg", "stat", "light", "timeline", "final"],
      forbiddenPatterns: ["Tom agressivo", "Headlines chocantes", "Sensacionalismo"],
      textDensity: "rica",
    },
  },
  consultorio_humano: {
    id: "consultorio_humano",
    label: "Consultório Humano",
    tagline: "Proximidade, empatia e acolhimento",
    description: "Tom conversacional e íntimo. Foco na dor real do paciente com linguagem consultiva e humana.",
    icon: "💛",
    preferredVisualStyle: "ivory_sage",
    uiAccentHint: "#D97706",
    behavior: {
      editorialTone: "Acolhedor, empático, consultivo. Como uma conversa no consultório.",
      hookStyle: "acolhedor",
      ctaStyle: "intimo",
      narrativeRhythm: "conversacional",
      headlineMaxWords: 8,
      bodyMaxWords: 40,
      turningFrequency: "baixa",
      recommendedLayouts: ["capa", "tonly", "light", "timg", "tonly", "light", "final"],
      forbiddenPatterns: ["Tom frio", "Dados sem contexto humano", "CTA comercial"],
      textDensity: "rica",
    },
  },
};

export const PRESET_LIST = Object.values(BENCHMARK_PRESETS);

export function getPreset(id?: BenchmarkPresetId | string | null): BenchmarkPreset {
  if (id && id in BENCHMARK_PRESETS) return BENCHMARK_PRESETS[id as BenchmarkPresetId];
  return BENCHMARK_PRESETS.autoridade_premium;
}

export function getPresetDefault(): BenchmarkPreset {
  return BENCHMARK_PRESETS.autoridade_premium;
}

/** Build comparison traits for two presets */
export interface PresetComparisonTrait {
  label: string;
  presetA: string;
  presetB: string;
}

export function comparePresets(a: BenchmarkPreset, b: BenchmarkPreset): PresetComparisonTrait[] {
  return [
    { label: "Tom editorial", presetA: a.behavior.editorialTone.split(".")[0], presetB: b.behavior.editorialTone.split(".")[0] },
    { label: "Estilo do gancho", presetA: a.behavior.hookStyle, presetB: b.behavior.hookStyle },
    { label: "Estilo do CTA", presetA: a.behavior.ctaStyle, presetB: b.behavior.ctaStyle },
    { label: "Ritmo narrativo", presetA: a.behavior.narrativeRhythm.replace("_", " "), presetB: b.behavior.narrativeRhythm.replace("_", " ") },
    { label: "Densidade de texto", presetA: a.behavior.textDensity, presetB: b.behavior.textDensity },
    { label: "Visual recomendado", presetA: a.preferredVisualStyle.replace(/_/g, " "), presetB: b.preferredVisualStyle.replace(/_/g, " ") },
  ];
}
