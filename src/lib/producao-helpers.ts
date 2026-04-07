import type { CarouselSlide } from "@/types/carousel";

export interface GeneratedCampaignSlide extends CarouselSlide {
  approved?: boolean;
}

export interface CampaignResult {
  titulo: string;
  legenda: string;
  hashtags: string[];
  slides: GeneratedCampaignSlide[];
}

const VALID_PAPEIS = new Set<CarouselSlide["papel"]>([
  "gancho",
  "desconstrucao",
  "revelacao",
  "metodo",
  "prova",
  "ampliacao",
  "identidade",
  "cta",
  "transicao",
  "humanizacao",
]);

const FALLBACK_PAPEIS: CarouselSlide["papel"][] = [
  "gancho",
  "desconstrucao",
  "revelacao",
  "metodo",
  "prova",
  "ampliacao",
  "identidade",
  "cta",
  "transicao",
  "humanizacao",
];

const LEGACY_BLOCKS: Array<{ label: string; papel: CarouselSlide["papel"] }> = [
  { label: "Gancho", papel: "gancho" },
  { label: "Quebra de percepção", papel: "desconstrucao" },
  { label: "Explicação / visão", papel: "revelacao" },
  { label: "Método / lógica", papel: "metodo" },
  { label: "Manifesto", papel: "identidade" },
  { label: "Fechamento", papel: "cta" },
];

const TITLE_KEYS = ["titulo", "titulo_campanha", "titulo_carrossel", "title"] as const;
const LEGENDA_KEYS = ["legenda", "caption"] as const;
const NESTED_KEYS = ["slide_plan_json", "slide_plan", "generated_content"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function cleanText(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

function firstStringFromRecord(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return cleanText(value);
    }
  }

  return undefined;
}

function firstStringFromSources(
  sources: Record<string, unknown>[],
  keys: readonly string[]
): string | undefined {
  for (const source of sources) {
    const value = firstStringFromRecord(source, keys);
    if (value) return value;
  }

  return undefined;
}

function isValidPapel(value: unknown): value is CarouselSlide["papel"] {
  return typeof value === "string" && VALID_PAPEIS.has(value as CarouselSlide["papel"]);
}

function toSlideNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeHashtags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function buildLegacySlides(source: Record<string, unknown>): GeneratedCampaignSlide[] {
  return LEGACY_BLOCKS.reduce<GeneratedCampaignSlide[]>((slides, block) => {
    const raw = source[block.label];
    if (typeof raw !== "string" || !raw.trim()) return slides;

    slides.push({
      numero: slides.length + 1,
      papel: block.papel,
      titulo: block.label,
      corpo: cleanText(raw),
      approved: true,
    });

    return slides;
  }, []);
}

function normalizeSlides(value: unknown): GeneratedCampaignSlide[] {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.reduce<GeneratedCampaignSlide[]>((slides, slide, index) => {
    if (!isRecord(slide)) return slides;

    const titulo = firstStringFromRecord(slide, [
      "titulo",
      "headline",
      "mini_titulo",
      "label",
      "eyebrow",
    ]);

    const corpo = firstStringFromRecord(slide, [
      "corpo",
      "texto",
      "body",
      "big_text",
      "turn_text",
      "conclusion",
      "opinion",
    ]);

    const notaVisual = firstStringFromRecord(slide, ["nota_visual", "visual_direction", "img_query"]);
    const cta = firstStringFromRecord(slide, ["cta", "pergunta_comentario"]);

    slides.push({
      numero: toSlideNumber(slide.numero, slides.length + 1),
      papel: isValidPapel(slide.papel)
        ? slide.papel
        : FALLBACK_PAPEIS[Math.min(index, FALLBACK_PAPEIS.length - 1)],
      titulo: titulo || `Slide ${index + 1}`,
      corpo: corpo || "",
      nota_visual: notaVisual,
      cta,
      approved: slide.approved !== false,
    });

    return slides;
  }, []);
}

function collectSources(input: unknown): Record<string, unknown>[] {
  const root = parseMaybeJson(input);
  if (!isRecord(root)) return [];

  const sources: Record<string, unknown>[] = [root];

  for (const key of NESTED_KEYS) {
    const nested = parseMaybeJson(root[key]);
    if (isRecord(nested)) {
      sources.push(nested);
      continue;
    }

    if (Array.isArray(nested)) {
      sources.push({ slides: nested });
    }
  }

  return sources;
}

export function normalizeCampaignResult(
  input: unknown,
  fallbackTitle = "Campanha sem título"
): CampaignResult | null {
  const sources = collectSources(input);
  if (sources.length === 0) return null;

  const slides =
    sources
      .map((source) => normalizeSlides(source.slides))
      .find((items) => items.length > 0) ??
    sources
      .map((source) => buildLegacySlides(source))
      .find((items) => items.length > 0) ??
    [];

  if (slides.length === 0) return null;

  const hashtags =
    sources
      .map((source) => normalizeHashtags(source.hashtags))
      .find((items) => items.length > 0) ?? [];

  return {
    titulo: firstStringFromSources(sources, TITLE_KEYS) || fallbackTitle,
    legenda: firstStringFromSources(sources, LEGENDA_KEYS) || "",
    hashtags,
    slides,
  };
}
