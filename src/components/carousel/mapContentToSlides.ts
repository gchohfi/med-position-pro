import type { SlideData } from "./SlideRenderer";

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

// ─── SLIDE RHYTHM ─────────────────────────────────────────────────────────
// Each carousel follows a strict editorial rhythm:
//   1. COVER (dark, minimal, bold)
//   2. STATEMENT (tension/contrast — single strong sentence)
//   3. EDITORIAL (explanation — headline + short support)
//   4. BREATHING (ultra-minimal — one insight phrase)
//   5. STRUCTURED (method — max 3 short items)
//   6. MANIFESTO (dark, single sentence, large type)
//   7. SIGNATURE (warm closing)
//
// If content is rich, additional editorial/breathing slides are inserted.
// Content is ALWAYS split rather than compressed.

export function mapContentToSlides(
  content: Record<string, string>
): SlideData[] {
  const slides: SlideData[] = [];

  // ── 1. COVER — Gancho ──
  const gancho = content["Gancho"] || "";
  if (gancho) {
    const headline = extractShortHeadline(gancho, 10);
    const body = enforceMaxWords(extractRemainder(gancho, headline), 12);
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
    // First sentence as statement
    slides.push({
      type: "statement",
      label: "Quebra de percepção",
      headline: enforceMaxWords(sents[0], 18) || extractShortHeadline(quebra, 18),
      slideNumber: 0,
      totalSlides: 0,
    });
    // If there's more, add a breathing slide with the key insight
    if (sents.length > 1) {
      slides.push({
        type: "breathing",
        label: "Insight",
        headline: enforceMaxWords(sents[1], 12) || "",
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // ── 3. EDITORIAL — Explicação / visão ──
  const explicacao = content["Explicação / visão"] || "";
  if (explicacao) {
    const paragraphs = explicacao.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

    // Always split into multiple slides: one editorial per key idea
    for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
      const para = paragraphs[i];
      if (wordCount(para) <= 20) {
        // Short enough for a breathing slide
        slides.push({
          type: i === 0 ? "editorial" : "breathing",
          label: "Visão",
          headline: enforceMaxWords(para, 12) || "",
          slideNumber: 0,
          totalSlides: 0,
        });
      } else {
        // Split into headline + body
        const headline = extractShortHeadline(para, 8);
        const body = enforceMaxWords(extractRemainder(para, headline), 15);
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
      // If more than 3 items, split into 2 structured slides
      if (items.length > 3) {
        const firstBatch = items.slice(0, 3);
        const secondBatch = items.slice(3, 6);
        slides.push({
          type: "structured",
          label: "Método",
          headline: enforceMaxWords(firstBatch[0], 8) || "Método",
          items: firstBatch.slice(1).map((it) => enforceMaxWords(it, 12) || it),
          slideNumber: 0,
          totalSlides: 0,
        });
        if (secondBatch.length > 0) {
          slides.push({
            type: "structured",
            label: "Método",
            headline: enforceMaxWords(secondBatch[0], 8) || "Continuação",
            items: secondBatch.slice(1).map((it) => enforceMaxWords(it, 12) || it),
            slideNumber: 0,
            totalSlides: 0,
          });
        }
      } else {
        const headline = items[0].length < 50 ? enforceMaxWords(items[0], 8) : "Método";
        const listItems = items[0].length < 50 ? items.slice(1) : items;
        slides.push({
          type: "structured",
          label: "Método",
          headline: headline || "Método",
          items: listItems.slice(0, 3).map((it) => enforceMaxWords(it, 12) || it),
          slideNumber: 0,
          totalSlides: 0,
        });
      }
    } else {
      // Not enough items — editorial layout
      const headline = extractShortHeadline(metodo, 8);
      slides.push({
        type: "editorial",
        label: "Método",
        headline,
        body: enforceMaxWords(extractRemainder(metodo, headline), 15),
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // ── 5. MANIFESTO ──
  const manifesto = content["Manifesto"] || "";
  if (manifesto) {
    // Only the strongest single sentence
    const sents = sentences(manifesto);
    slides.push({
      type: "manifesto",
      label: "Manifesto",
      headline: enforceMaxWords(sents[0], 18) || extractShortHeadline(manifesto, 18),
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // ── 6. SIGNATURE — Fechamento ──
  const fechamento = content["Fechamento"] || "";
  if (fechamento) {
    const headline = extractShortHeadline(fechamento, 10);
    const body = enforceMaxWords(extractRemainder(fechamento, headline), 12);
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
    // Insert a breathing slide before manifesto
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
