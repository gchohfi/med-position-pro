import type { SlideData } from "./SlideRenderer";

/**
 * Extracts the first sentence or short fragment from text.
 * Used to pull a punchy headline from longer content.
 */
function extractHeadline(text: string, maxLen = 120): string {
  // Try to find the first sentence
  const sentenceMatch = text.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch && sentenceMatch[0].length <= maxLen) {
    return sentenceMatch[0].trim();
  }
  // Otherwise truncate at word boundary
  if (text.length <= maxLen) return text.trim();
  return text.slice(0, maxLen).replace(/\s+\S*$/, "").trim() + "…";
}

/**
 * Extracts remaining text after the headline for body content.
 */
function extractBody(text: string, headline: string): string | undefined {
  const remaining = text.slice(headline.replace("…", "").length).trim();
  if (!remaining || remaining.length < 20) return undefined;
  return remaining;
}

/**
 * Splits text into clean bullet items (by newlines, numbered lists, or dashes).
 */
function extractItems(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-–—•]\s*/, "").trim())
    .filter((line) => line.length > 10);
}

/**
 * Maps the 6 generated content blocks into premium editorial slides.
 * 
 * Slide rhythm:
 * 1. COVER (dark) — Gancho headline, striking and minimal
 * 2. STATEMENT (light) — Quebra de percepção, single strong sentence  
 * 3. EDITORIAL (light) — Explicação headline + body
 * 4. STRUCTURED (light) — Método as numbered items
 * 5. MANIFESTO (dark) — Strong declaration, italic centered
 * 6. SIGNATURE (warm) — Fechamento with brand signature
 * 
 * Additional editorial slides inserted if content is rich enough.
 */
export function mapContentToSlides(
  content: Record<string, string>
): SlideData[] {
  const slides: SlideData[] = [];

  // 1. COVER — Gancho
  const gancho = content["Gancho"] || "";
  if (gancho) {
    const headline = extractHeadline(gancho, 100);
    const body = extractBody(gancho, headline);
    slides.push({
      type: "cover",
      label: "Gancho",
      headline,
      body,
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 2. STATEMENT — Quebra de percepção
  const quebra = content["Quebra de percepção"] || "";
  if (quebra) {
    slides.push({
      type: "statement",
      label: "Quebra de percepção",
      headline: extractHeadline(quebra, 200),
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 3. EDITORIAL — Explicação / visão
  const explicacao = content["Explicação / visão"] || "";
  if (explicacao) {
    const paragraphs = explicacao.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

    if (paragraphs.length <= 2) {
      // Single editorial slide
      const headline = extractHeadline(paragraphs[0], 100);
      const body = paragraphs.length > 1 ? paragraphs[1] : extractBody(paragraphs[0], headline);
      slides.push({
        type: "editorial",
        label: "Visão",
        headline,
        body,
        slideNumber: 0,
        totalSlides: 0,
      });
    } else {
      // Split into 2 editorial slides for rhythm
      const headline1 = extractHeadline(paragraphs[0], 100);
      slides.push({
        type: "editorial",
        label: "Visão",
        headline: headline1,
        body: paragraphs[1],
        slideNumber: 0,
        totalSlides: 0,
      });

      // Second half as a statement for visual contrast
      const remainingText = paragraphs.slice(2).join(" ");
      if (remainingText.length > 30) {
        slides.push({
          type: "statement",
          label: "Visão",
          headline: extractHeadline(remainingText, 200),
          slideNumber: 0,
          totalSlides: 0,
        });
      }
    }
  }

  // 4. STRUCTURED — Método / lógica
  const metodo = content["Método / lógica"] || "";
  if (metodo) {
    const items = extractItems(metodo);
    if (items.length >= 2) {
      // Use first item or a generic headline
      const headline = items[0].length < 60 ? items[0] : "Método";
      const listItems = items[0].length < 60 ? items.slice(1) : items;
      slides.push({
        type: "structured",
        label: "Método",
        headline,
        items: listItems.slice(0, 4),
        slideNumber: 0,
        totalSlides: 0,
      });
    } else {
      // Not enough items, use editorial layout
      const headline = extractHeadline(metodo, 100);
      slides.push({
        type: "editorial",
        label: "Método",
        headline,
        body: extractBody(metodo, headline),
        slideNumber: 0,
        totalSlides: 0,
      });
    }
  }

  // 5. MANIFESTO — Strong declaration
  const manifesto = content["Manifesto"] || "";
  if (manifesto) {
    slides.push({
      type: "manifesto",
      label: "Manifesto",
      headline: extractHeadline(manifesto, 250),
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 6. SIGNATURE — Fechamento
  const fechamento = content["Fechamento"] || "";
  if (fechamento) {
    const headline = extractHeadline(fechamento, 100);
    const body = extractBody(fechamento, headline);
    slides.push({
      type: "signature",
      label: "Fechamento",
      headline,
      body,
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // Update slide numbers
  const total = slides.length;
  slides.forEach((s, i) => {
    s.slideNumber = i + 1;
    s.totalSlides = total;
  });

  return slides;
}
