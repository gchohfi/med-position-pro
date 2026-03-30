import type { SlideData } from "./SlideRenderer";
import { getCreativeDirection, type CreativeDirection } from "./creativeDirection";

/**
 * Splits text into sentences.
 */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

/**
 * Count words in a string.
 */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract a short headline (max words).
 */
function extractShortHeadline(text: string, maxWords = 10): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * Extract remaining text after headline for body.
 */
function extractRemainder(text: string, headline: string): string | undefined {
  const clean = headline.replace("…", "");
  const idx = text.indexOf(clean);
  if (idx === -1) return undefined;
  const remaining = text.slice(idx + clean.length).trim();
  if (!remaining || remaining.length < 15) return undefined;
  return remaining;
}

/**
 * Splits text into clean bullet items.
 */
function extractItems(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-–—•]\s*/, "").trim())
    .filter((line) => line.length > 8);
}

/**
 * Enforce max words on a string, truncating at word boundary.
 */
function enforceMaxWords(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= max) return text.trim();
  return words.slice(0, max).join(" ") + "…";
}

/**
 * Generate a punchy cover headline from raw text.
 * Instead of truncating, extracts the strongest fragment.
 */
function generateCoverHeadline(text: string, maxWords: number): string {
  const sents = sentences(text);
  if (sents.length === 0) return extractShortHeadline(text, maxWords);

  // Pick the shortest, punchiest sentence (under maxWords)
  const candidates = sents
    .map((s) => ({ s, wc: wordCount(s) }))
    .filter((c) => c.wc <= maxWords + 2);

  if (candidates.length > 0) {
    // Prefer shorter, punchier
    candidates.sort((a, b) => a.wc - b.wc);
    return enforceMaxWords(candidates[0].s, maxWords) || candidates[0].s;
  }

  // Fallback: take first sentence, enforce limit
  return enforceMaxWords(sents[0], maxWords) || extractShortHeadline(text, maxWords);
}

// ─── SLIDE RHYTHM ─────────────────────────────────────────────────────────
// Each carousel follows a strict editorial rhythm driven by creative direction.
// Content type determines spacing, density, and tension alternation.

export function mapContentToSlides(
  content: Record<string, string>,
  contentType?: string
): SlideData[] {
  const dir = getCreativeDirection(contentType);
  const slides: SlideData[] = [];

  const hlMax = dir.headlineMaxWords;
  const bodyMax = dir.bodyMaxWords;

  // ── 1. COVER — Gancho ──
  const gancho = content["Gancho"] || "";
  if (gancho) {
    // Generate a punchy cover headline, not just truncate
    const headline = generateCoverHeadline(gancho, dir.coverMaxWords);
    const body = dir.maxBlocksPerSlide >= 2
      ? enforceMaxWords(extractRemainder(gancho, headline), bodyMax)
      : undefined;
    slides.push({
      type: "cover",
      label: "Gancho",
      headline,
      body,
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // ── 2. STATEMENT — Quebra de percepção ──
  const quebra = content["Quebra de percepção"] || "";
  if (quebra) {
    const sents = sentences(quebra);
    slides.push({
      type: "statement",
      label: "Quebra de percepção",
      headline: enforceMaxWords(sents[0], hlMax + 8) || extractShortHeadline(quebra, hlMax + 8),
      slideNumber: 0,
      totalSlides: 0,
    });
    // For manifesto/conexao, always add a breathing slide after tension
    if (sents.length > 1 || dir.extraBreathing) {
      slides.push({
        type: "breathing",
        label: "Insight",
        headline: enforceMaxWords(sents[1] || sents[0], hlMax) || "",
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // ── 3. EDITORIAL — Explicação / visão ──
  const explicacao = content["Explicação / visão"] || "";
  if (explicacao) {
    const paragraphs = explicacao.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const maxParas = dir.maxBlocksPerSlide === 1 ? 4 : 3;

    for (let i = 0; i < Math.min(paragraphs.length, maxParas); i++) {
      const para = paragraphs[i];
      if (wordCount(para) <= hlMax) {
        // Short enough for a breathing/editorial slide
        slides.push({
          type: i === 0 ? "editorial" : "breathing",
          label: "Visão",
          headline: enforceMaxWords(para, hlMax) || "",
          slideNumber: 0,
          totalSlides: 0,
        });
      } else {
        const headline = extractShortHeadline(para, hlMax - 2);
        const body = dir.maxBlocksPerSlide >= 2
          ? enforceMaxWords(extractRemainder(para, headline), bodyMax)
          : undefined;
        slides.push({
          type: "editorial",
          label: "Visão",
          headline,
          body,
          slideNumber: 0,
          totalSlides: 0,
        });
      }
    }
  }

  // ── 4. STRUCTURED — Método / lógica ──
  const metodo = content["Método / lógica"] || "";
  if (metodo) {
    const items = extractItems(metodo);
    if (items.length >= 2) {
      if (items.length > 3) {
        const firstBatch = items.slice(0, 3);
        const secondBatch = items.slice(3, 6);
        slides.push({
          type: "structured",
          label: "Método",
          headline: enforceMaxWords(firstBatch[0], hlMax) || "Método",
          items: firstBatch.slice(1).map((it) => enforceMaxWords(it, bodyMax) || it),
          slideNumber: 0,
          totalSlides: 0,
        });
        if (secondBatch.length > 0) {
          slides.push({
            type: "structured",
            label: "Método",
            headline: enforceMaxWords(secondBatch[0], hlMax) || "Continuação",
            items: secondBatch.slice(1).map((it) => enforceMaxWords(it, bodyMax) || it),
            slideNumber: 0,
            totalSlides: 0,
          });
        }
      } else {
        const headline = items[0].length < 50 ? enforceMaxWords(items[0], hlMax) : "Método";
        const listItems = items[0].length < 50 ? items.slice(1) : items;
        slides.push({
          type: "structured",
          label: "Método",
          headline: headline || "Método",
          items: listItems.slice(0, 3).map((it) => enforceMaxWords(it, bodyMax) || it),
          slideNumber: 0,
          totalSlides: 0,
        });
      }
    } else {
      const headline = extractShortHeadline(metodo, hlMax);
      slides.push({
        type: "editorial",
        label: "Método",
        headline,
        body: dir.maxBlocksPerSlide >= 2
          ? enforceMaxWords(extractRemainder(metodo, headline), bodyMax)
          : undefined,
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // ── Insert breathing before manifesto for high-spacing content types ──
  if (dir.extraBreathing && slides.length >= 4) {
    slides.push({
      type: "breathing",
      label: "Pausa",
      headline: "Reflita sobre isso.",
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // ── 5. MANIFESTO ──
  const manifesto = content["Manifesto"] || "";
  if (manifesto) {
    const sents = sentences(manifesto);
    slides.push({
      type: "manifesto",
      label: "Manifesto",
      headline: enforceMaxWords(sents[0], hlMax + 8) || extractShortHeadline(manifesto, hlMax + 8),
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // ── 6. SIGNATURE — Fechamento ──
  const fechamento = content["Fechamento"] || "";
  if (fechamento) {
    const headline = extractShortHeadline(fechamento, hlMax);
    const body = dir.maxBlocksPerSlide >= 2
      ? enforceMaxWords(extractRemainder(fechamento, headline), bodyMax)
      : undefined;
    slides.push({
      type: "signature",
      label: "Fechamento",
      headline,
      body,
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // ── Ensure rhythm: at least one breathing slide exists ──
  const hasBreathing = slides.some((s) => s.type === "breathing");
  if (!hasBreathing && slides.length >= 5) {
    const manifestoIdx = slides.findIndex((s) => s.type === "manifesto");
    if (manifestoIdx > 0) {
      const prevSlide = slides[manifestoIdx - 1];
      slides.splice(manifestoIdx, 0, {
        type: "breathing",
        label: "Pausa",
        headline: prevSlide.body
          ? enforceMaxWords(prevSlide.body, 8) || "Reflita sobre isso."
          : "Reflita sobre isso.",
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // ── Update slide numbers ──
  const total = slides.length;
  slides.forEach((s, i) => {
    s.slideNumber = i + 1;
    s.totalSlides = total;
  });

  return slides;
}
