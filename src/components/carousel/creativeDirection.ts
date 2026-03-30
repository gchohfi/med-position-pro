/**
 * Creative Direction System
 * Maps content types to visual behavior profiles that control
 * slide rhythm, spacing, typography tension, and cover generation.
 */

export type ContentIntent = "educativo" | "manifesto" | "conexao" | "conversao" | "hibrido";

export interface CreativeDirection {
  /** Display label */
  label: string;
  /** Cover rewrite: generate a punchy hook headline */
  coverMaxWords: number;
  /** Whether cover should feel aggressive or soft */
  coverTone: "bold" | "warm" | "sharp" | "editorial";
  /** General spacing multiplier (1 = normal, 1.3 = more breathing) */
  spacingScale: number;
  /** Max words per headline block */
  headlineMaxWords: number;
  /** Max words per body block */
  bodyMaxWords: number;
  /** Whether to enforce extra breathing slides */
  extraBreathing: boolean;
  /** Slide density: how many content blocks per slide max */
  maxBlocksPerSlide: number;
  /** Typography weight bias: lighter = elegant, heavier = impactful */
  typographyWeight: "light" | "medium" | "heavy";
  /** Visual tension pattern: alternates between heavy and minimal */
  rhythmPattern: ("heavy" | "minimal" | "medium")[];
  /** Accent opacity modifier */
  accentIntensity: number;
}

const CREATIVE_DIRECTIONS: Record<ContentIntent, CreativeDirection> = {
  educativo: {
    label: "Educativo",
    coverMaxWords: 8,
    coverTone: "editorial",
    spacingScale: 1.0,
    headlineMaxWords: 10,
    bodyMaxWords: 15,
    extraBreathing: false,
    maxBlocksPerSlide: 2,
    typographyWeight: "medium",
    rhythmPattern: ["heavy", "medium", "medium", "minimal", "medium", "heavy", "minimal"],
    accentIntensity: 0.5,
  },
  manifesto: {
    label: "Manifesto",
    coverMaxWords: 6,
    coverTone: "bold",
    spacingScale: 1.4,
    headlineMaxWords: 8,
    bodyMaxWords: 10,
    extraBreathing: true,
    maxBlocksPerSlide: 1,
    typographyWeight: "heavy",
    rhythmPattern: ["heavy", "minimal", "heavy", "minimal", "heavy", "minimal", "heavy"],
    accentIntensity: 0.3,
  },
  conexao: {
    label: "Conexão",
    coverMaxWords: 8,
    coverTone: "warm",
    spacingScale: 1.3,
    headlineMaxWords: 10,
    bodyMaxWords: 12,
    extraBreathing: true,
    maxBlocksPerSlide: 2,
    typographyWeight: "light",
    rhythmPattern: ["medium", "minimal", "medium", "minimal", "medium", "minimal", "medium"],
    accentIntensity: 0.6,
  },
  conversao: {
    label: "Conversão",
    coverMaxWords: 6,
    coverTone: "sharp",
    spacingScale: 1.0,
    headlineMaxWords: 8,
    bodyMaxWords: 12,
    extraBreathing: false,
    maxBlocksPerSlide: 2,
    typographyWeight: "heavy",
    rhythmPattern: ["heavy", "medium", "heavy", "medium", "heavy", "minimal", "heavy"],
    accentIntensity: 0.7,
  },
  hibrido: {
    label: "Híbrido",
    coverMaxWords: 8,
    coverTone: "editorial",
    spacingScale: 1.1,
    headlineMaxWords: 10,
    bodyMaxWords: 14,
    extraBreathing: false,
    maxBlocksPerSlide: 2,
    typographyWeight: "medium",
    rhythmPattern: ["heavy", "medium", "minimal", "medium", "heavy", "minimal", "medium"],
    accentIntensity: 0.5,
  },
};

export function getCreativeDirection(tipo?: string): CreativeDirection {
  if (tipo && tipo in CREATIVE_DIRECTIONS) {
    return CREATIVE_DIRECTIONS[tipo as ContentIntent];
  }
  return CREATIVE_DIRECTIONS.hibrido;
}

/**
 * Returns the rhythm tension for a given slide index.
 * Cycles through the pattern to enforce visual variation.
 */
export function getSlideTension(
  direction: CreativeDirection,
  slideIndex: number
): "heavy" | "minimal" | "medium" {
  const pattern = direction.rhythmPattern;
  return pattern[slideIndex % pattern.length];
}
