/**
 * Benchmark Presets — Editorial creative direction system
 *
 * Each preset is a full creative direction package that influences:
 * tone, hook strength, narrative rhythm, layout choices, CTA style, and visual recommendation.
 */

import type { PreferredVisualStyle, TravessIALayout } from "@/types/carousel";

/* ── Types ─────────────────────────────────────────────── */

export type BenchmarkPresetId =
  | "impacto_viral"
  | "autoridade_premium"
  | "educacao_sofisticada"
  | "consultorio_humano";

export interface BenchmarkBehavior {
  /** Editorial tone direction for AI */
  editorialTone: string;
  /** Hook style: how provocative the opening should be */
  hookStyle: "provocativo" | "sofisticado" | "didatico" | "acolhedor";
  /** CTA style at the end */
  ctaStyle: "provocativo" | "refinado" | "acolhedor" | "intimo";
  /** Narrative rhythm description */
  narrativeStyle: string;
  /** Headline max words (influences AI strictness) */
  headlineMaxWords: number;
  /** Body density: how much text per slide */
  bodyDensity: "ultra_conciso" | "conciso" | "moderado";
  /** Preferred layouts to use more often */
  recommendedLayouts: TravessIALayout[];
  /** Layouts to avoid or use sparingly */
  avoidLayouts: TravessIALayout[];
  /** Patterns the AI must avoid */
  forbiddenPatterns: string[];
  /** Turning slide frequency: how many turning/virada slides */
  turningFrequency: "alta" | "media" | "baixa";
  /** Stat slide emphasis */
  statEmphasis: "forte" | "moderada" | "sutil";
}

export interface BenchmarkVisualMapping {
  /** Recommended visual style */
  preferredVisualStyle: PreferredVisualStyle;
  /** Accent hint for UI (semantic token reference) */
  uiAccentHint: string;
}

export interface BenchmarkPreset {
  id: BenchmarkPresetId;
  label: string;
  tagline: string;
  description: string;
  behavior: BenchmarkBehavior;
  visual: BenchmarkVisualMapping;
}

/* ── Presets ────────────────────────────────────────────── */

const PRESETS: Record<BenchmarkPresetId, BenchmarkPreset> = {
  impacto_viral: {
    id: "impacto_viral",
    label: "Impacto Viral",
    tagline: "Gancho forte. Quebra de crença. Máximo engajamento.",
    description:
      "Direção criativa para conteúdo que provoca, gera debate e maximiza salvamentos e comentários. Headlines curtas e afiadas, ritmo narrativo alto com viradas frequentes.",
    behavior: {
      editorialTone:
        "Tom direto e provocativo. Frases curtas que criam tensão. Cada slide deve provocar uma reação. Linguagem de consultório informal, como se a médica estivesse revelando algo que poucos sabem. Usar dados que surpreendem. Hooks no estilo: 'Você está fazendo ERRADO', 'Tomei X e AGORA?', 'Ninguém te conta isso'.",
      hookStyle: "provocativo",
      ctaStyle: "provocativo",
      narrativeStyle:
        "Ritmo alto: gancho provocativo → dado surpreendente → virada de perspectiva → revelação → CTA confrontador. Alternar tensão forte com respiros mínimos. Cada slide deve ter uma micro-tensão que puxa para o próximo.",
      headlineMaxWords: 5,
      bodyDensity: "ultra_conciso",
      recommendedLayouts: ["capa", "turning", "stat", "tonly", "final"],
      avoidLayouts: ["timeline"],
      forbiddenPatterns: [
        "Headlines genéricas como 'Tudo sobre X' ou 'Dicas para Y'",
        "Tom neutro ou acadêmico",
        "Frases longas e explicativas na capa",
        "CTA genérico como 'Gostou? Comente'",
      ],
      turningFrequency: "alta",
      statEmphasis: "forte",
    },
    visual: {
      preferredVisualStyle: "travessia",
      uiAccentHint: "destructive",
    },
  },

  autoridade_premium: {
    id: "autoridade_premium",
    label: "Autoridade Premium",
    tagline: "Sofisticação médica. Percepção de alto valor.",
    description:
      "Direção criativa para construir autoridade e marca pessoal forte. Capa manifesto, tipografia elegante, posicionamento refinado. Para médicos que querem ser percebidos como referência absoluta.",
    behavior: {
      editorialTone:
        "Tom de autoridade sofisticada. A médica fala como quem domina o assunto e não precisa provar. Menos coloquial que viral, mais posicionamento. Frases assertivas, nunca inseguras. Usar termos técnicos com elegância, traduzindo quando necessário. Sensação de editorial médico premium.",
      hookStyle: "sofisticado",
      ctaStyle: "refinado",
      narrativeStyle:
        "Ritmo controlado: manifesto → contexto profundo → evidência sólida → opinião de autoridade → recomendação refinada → assinatura. Menos viradas bruscas, mais construção de percepção. A narrativa deve transmitir que quem fala é uma referência.",
      headlineMaxWords: 6,
      bodyDensity: "conciso",
      recommendedLayouts: ["capa", "tonly", "stat", "timg", "turning", "final"],
      avoidLayouts: [],
      forbiddenPatterns: [
        "Tom excessivamente coloquial ou informal",
        "Hooks sensacionalistas tipo clickbait",
        "Perguntas de engajamento genéricas",
        "Linguagem que diminui a autoridade médica",
      ],
      turningFrequency: "media",
      statEmphasis: "forte",
    },
    visual: {
      preferredVisualStyle: "editorial_black_gold",
      uiAccentHint: "accent",
    },
  },

  educacao_sofisticada: {
    id: "educacao_sofisticada",
    label: "Educação Sofisticada",
    tagline: "Didática elegante. Conteúdo útil e salvável.",
    description:
      "Direção criativa para conteúdo educativo de alto nível. Clareza, acessibilidade e elegância visual. Para médicos que querem educar com profundidade sem perder leveza.",
    behavior: {
      editorialTone:
        "Tom didático e acolhedor. A médica ensina com clareza e gentileza, como em uma consulta calma. Explicações acessíveis sem simplificar demais. Cada slide deve ter uma pepita de conhecimento prático. Linguagem inclusiva e empática. Sensação de consultório premium e organizado.",
      hookStyle: "didatico",
      ctaStyle: "acolhedor",
      narrativeStyle:
        "Ritmo suave e progressivo: contexto → explicação clara → dado de suporte → dica prática → resumo → convite. Mais slides explicativos e de light (fundo claro). Menos viradas bruscas, mais construção gradual de entendimento. Ideal para conteúdo que o paciente salva para reler.",
      headlineMaxWords: 8,
      bodyDensity: "moderado",
      recommendedLayouts: ["capa", "timg", "tonly", "light", "stat", "timeline", "final"],
      avoidLayouts: [],
      forbiddenPatterns: [
        "Hooks agressivos ou sensacionalistas",
        "Tom de confronto ou provocação excessiva",
        "Linguagem que gera ansiedade no paciente",
        "Dados sem contexto explicativo",
      ],
      turningFrequency: "baixa",
      statEmphasis: "moderada",
    },
    visual: {
      preferredVisualStyle: "ivory_sage",
      uiAccentHint: "accent",
    },
  },

  consultorio_humano: {
    id: "consultorio_humano",
    label: "Consultório Humano",
    tagline: "Proximidade real. Conteúdo que abraça.",
    description:
      "Direção criativa para conteúdo profundamente humano e empático. A médica compartilha como amiga e profissional. Para quem quer criar conexão genuína com pacientes.",
    behavior: {
      editorialTone:
        "Tom conversacional e íntimo. A médica fala como se estivesse sentada com a paciente tomando café. Vulnerabilidade calculada: compartilha bastidores, dúvidas que pacientes trazem, situações reais do consultório. Usa 'eu', 'você', 'a gente'. Perguntas empáticas: 'Já passou por isso?', 'Sabe aquele momento que...'. Menos dados, mais histórias e acolhimento.",
      hookStyle: "acolhedor",
      ctaStyle: "intimo",
      narrativeStyle:
        "Ritmo orgânico e humano: identificação → empatia → contexto pessoal → orientação gentil → convite íntimo. Hooks menos agressivos, mais identificáveis. A narrativa deve soar como um desabafo profissional ou conselho de amiga médica. O final deve ser convidativo e pessoal, não imperativo.",
      headlineMaxWords: 7,
      bodyDensity: "moderado",
      recommendedLayouts: ["capa", "tonly", "timg", "light", "turning", "final"],
      avoidLayouts: ["timeline"],
      forbiddenPatterns: [
        "Tom frio ou distante",
        "Linguagem excessivamente técnica",
        "Hooks que geram medo ou ansiedade",
        "CTA imperativo ou comercial",
        "Dados sem tradução humana",
      ],
      turningFrequency: "media",
      statEmphasis: "sutil",
    },
    visual: {
      preferredVisualStyle: "ivory_sage",
      uiAccentHint: "accent",
    },
  },
};

/* ── Utilities ──────────────────────────────────────────── */

export const ALL_PRESETS: BenchmarkPreset[] = Object.values(PRESETS);

export const PRESET_IDS: BenchmarkPresetId[] = Object.keys(PRESETS) as BenchmarkPresetId[];

export function getPreset(id?: string | null): BenchmarkPreset | null {
  if (!id || !(id in PRESETS)) return null;
  return PRESETS[id as BenchmarkPresetId];
}

export function getPresetOrDefault(id?: string | null): BenchmarkPreset {
  return getPreset(id) ?? PRESETS.autoridade_premium;
}

export const DEFAULT_PRESET_ID: BenchmarkPresetId = "autoridade_premium";

/**
 * Maps a legacy preferredVisualStyle to the closest preset.
 * Used for backward compatibility with existing skill data.
 */
export function inferPresetFromVisualStyle(style?: PreferredVisualStyle): BenchmarkPresetId {
  switch (style) {
    case "travessia":
      return "impacto_viral";
    case "editorial_black_gold":
      return "autoridade_premium";
    case "ivory_sage":
      return "educacao_sofisticada";
    default:
      return "autoridade_premium";
  }
}

/**
 * Generates the AI prompt section for a benchmark preset.
 * This is injected into the system prompt of agent-carrossel.
 */
export function presetToPromptBlock(preset: BenchmarkPreset): string {
  const b = preset.behavior;
  return `## DIREÇÃO CRIATIVA: ${preset.label.toUpperCase()}
${preset.description}

### TOM EDITORIAL
${b.editorialTone}

### ESTILO DO HOOK
${b.hookStyle === "provocativo" ? "Provocativo e confrontador. A capa deve criar tensão imediata." :
  b.hookStyle === "sofisticado" ? "Sofisticado e assertivo. A capa deve transmitir autoridade e elegância." :
  b.hookStyle === "didatico" ? "Didático e claro. A capa deve prometer conhecimento valioso." :
  "Acolhedor e identificável. A capa deve criar conexão emocional."}

### RITMO NARRATIVO
${b.narrativeStyle}

### ESTILO DO CTA
${b.ctaStyle === "provocativo" ? "CTA confrontador que desafia o leitor a agir. Ex: 'Você vai continuar fazendo errado?'" :
  b.ctaStyle === "refinado" ? "CTA sóbrio e elegante. Ex: 'Se identificou? Salve para sua próxima consulta.'" :
  b.ctaStyle === "acolhedor" ? "CTA gentil e convidativo. Ex: 'Qual dessas dicas você já faz? Me conta nos comentários.'" :
  "CTA íntimo e pessoal. Ex: 'Me conta: você já passou por isso? Quero te ouvir nos comentários.'"}

### REGRAS DE DENSIDADE
- Headline máximo: ${b.headlineMaxWords} palavras
- Corpo: ${b.bodyDensity === "ultra_conciso" ? "Ultra conciso, máximo 30 palavras por slide" : b.bodyDensity === "conciso" ? "Conciso, máximo 40 palavras por slide" : "Moderado, máximo 50 palavras por slide"}
- Viradas (turning): ${b.turningFrequency === "alta" ? "Usar 2-3 slides de virada" : b.turningFrequency === "media" ? "Usar 1-2 slides de virada" : "Usar no máximo 1 slide de virada"}
- Dados (stat): ${b.statEmphasis === "forte" ? "Pelo menos 1-2 slides stat com dados de impacto" : b.statEmphasis === "moderada" ? "1 slide stat com dado contextualizado" : "Stat opcional, priorizar narrativa humana"}

### LAYOUTS RECOMENDADOS
Priorizar: ${b.recommendedLayouts.join(", ")}
${b.avoidLayouts.length > 0 ? `Evitar: ${b.avoidLayouts.join(", ")}` : ""}

### PROIBIÇÕES
${b.forbiddenPatterns.map((p) => `- ${p}`).join("\n")}

### VISUAL RECOMENDADO
preferredVisualStyle: "${preset.visual.preferredVisualStyle}"
`;
}
