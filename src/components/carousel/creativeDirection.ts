/**
 * Creative Direction System — Editorial Campaign Level
 * 
 * Philosophy: Each slide creates PERCEPTION, not information.
 * Inspired by Vogue editorials and Apple keynotes.
 * 
 * If it feels safe → it's wrong.
 * If it feels bold, minimal, intentional → accept.
 */

export type ContentIntent = "educativo" | "manifesto" | "conexao" | "conversao" | "hibrido";

export interface CreativeDirection {
  label: string;
  /** Cover: max words for the provocative hook (3-6) */
  coverMaxWords: number;
  /** Cover tone controls visual personality */
  coverTone: "bold" | "warm" | "sharp" | "editorial";
  /** Spacing multiplier (higher = more emptiness) */
  spacingScale: number;
  /** Max words per headline — STRICT */
  headlineMaxWords: number;
  /** Max words per body — STRICT */
  bodyMaxWords: number;
  /** Force extra breathing slides */
  extraBreathing: boolean;
  /** Min breathing slides guaranteed */
  minBreathingSlides: number;
  /** Max content blocks per slide (1 = ultra-minimal) */
  maxBlocksPerSlide: number;
  /** Typography weight: light=elegant, heavy=impactful */
  typographyWeight: "light" | "medium" | "heavy";
  /** Tension pattern: heavy↔minimal alternation */
  rhythmPattern: ("heavy" | "minimal" | "medium")[];
  /** Accent subtlety (lower = more refined) */
  accentIntensity: number;
  /** Whether cover should suppress body text entirely */
  coverSuppressBody: boolean;
}

const CREATIVE_DIRECTIONS: Record<ContentIntent, CreativeDirection> = {
  educativo: {
    label: "Educativo",
    coverMaxWords: 5,
    coverTone: "editorial",
    spacingScale: 1.15,
    headlineMaxWords: 8,
    bodyMaxWords: 10,
    extraBreathing: true,
    minBreathingSlides: 2,
    maxBlocksPerSlide: 2,
    typographyWeight: "medium",
    rhythmPattern: ["heavy", "minimal", "medium", "minimal", "heavy", "minimal", "medium"],
    accentIntensity: 0.35,
    coverSuppressBody: true,
  },
  manifesto: {
    label: "Manifesto",
    coverMaxWords: 4,
    coverTone: "bold",
    spacingScale: 1.5,
    headlineMaxWords: 6,
    bodyMaxWords: 8,
    extraBreathing: true,
    minBreathingSlides: 3,
    maxBlocksPerSlide: 1,
    typographyWeight: "heavy",
    rhythmPattern: ["heavy", "minimal", "heavy", "minimal", "heavy", "minimal", "heavy"],
    accentIntensity: 0.2,
    coverSuppressBody: true,
  },
  conexao: {
    label: "Conexão",
    coverMaxWords: 5,
    coverTone: "warm",
    spacingScale: 1.4,
    headlineMaxWords: 8,
    bodyMaxWords: 10,
    extraBreathing: true,
    minBreathingSlides: 3,
    maxBlocksPerSlide: 1,
    typographyWeight: "light",
    rhythmPattern: ["medium", "minimal", "medium", "minimal", "minimal", "medium", "minimal"],
    accentIntensity: 0.4,
    coverSuppressBody: true,
  },
  conversao: {
    label: "Conversão",
    coverMaxWords: 4,
    coverTone: "sharp",
    spacingScale: 1.1,
    headlineMaxWords: 7,
    bodyMaxWords: 10,
    extraBreathing: true,
    minBreathingSlides: 2,
    maxBlocksPerSlide: 1,
    typographyWeight: "heavy",
    rhythmPattern: ["heavy", "minimal", "heavy", "medium", "heavy", "minimal", "heavy"],
    accentIntensity: 0.5,
    coverSuppressBody: true,
  },
  hibrido: {
    label: "Híbrido",
    coverMaxWords: 5,
    coverTone: "editorial",
    spacingScale: 1.2,
    headlineMaxWords: 8,
    bodyMaxWords: 10,
    extraBreathing: true,
    minBreathingSlides: 2,
    maxBlocksPerSlide: 1,
    typographyWeight: "medium",
    rhythmPattern: ["heavy", "minimal", "medium", "minimal", "heavy", "minimal", "medium"],
    accentIntensity: 0.3,
    coverSuppressBody: true,
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
