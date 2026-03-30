import type { SlideData } from "./SlideRenderer";
import { getCreativeDirection } from "./creativeDirection";

// ─── TEXT UTILITIES ───────────────────────────────────────────────────────

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function enforceMaxWords(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= max) return text.trim();
  return words.slice(0, max).join(" ") + "…";
}

function extractItems(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-–—•]\s*/, "").trim())
    .filter((line) => line.length > 8);
}

/**
 * Generate a PROVOCATIVE cover headline.
 * Not a truncation — an extraction of the most tension-loaded fragment.
 * Target: 3-6 words that create unresolved tension.
 */
function generateCoverHeadline(text: string, maxWords: number): string {
  const sents = sentences(text);
  if (sents.length === 0) {
    const words = text.split(/\s+/).filter(Boolean);
    return words.slice(0, maxWords).join(" ");
  }

  // Score sentences: shorter + more punctuation tension = better
  const scored = sents.map((s) => {
    const wc = wordCount(s);
    const hasTension = /[?!]/.test(s) || /não|nunca|errado|problema|pare/i.test(s);
    const penalty = Math.abs(wc - maxWords); // closer to target = better
    return { s, score: (hasTension ? 10 : 0) - penalty - (wc > maxWords + 2 ? 20 : 0) };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].s;

  // Strip trailing period for cover punch
  const clean = best.replace(/\.$/, "").trim();
  return enforceMaxWords(clean, maxWords) || clean;
}

/**
 * Extract the single strongest sentence from a block.
 */
function extractStrongestSentence(text: string, maxWords: number): string {
  const sents = sentences(text);
  if (sents.length === 0) return enforceMaxWords(text, maxWords) || text.trim();
  
  // Prefer shorter, punchier
  const valid = sents.filter((s) => wordCount(s) <= maxWords + 2);
  if (valid.length > 0) {
    valid.sort((a, b) => wordCount(a) - wordCount(b));
    return enforceMaxWords(valid[0], maxWords) || valid[0];
  }
  return enforceMaxWords(sents[0], maxWords) || sents[0];
}

// ─── SLIDE MAPPING — EDITORIAL CAMPAIGN SYSTEM ───────────────────────────
//
// Philosophy:
// - Each slide = 1 idea, 1 emotion
// - Max 6-10 words per slide
// - Cover creates tension, never resolves it
// - Breathing slides are emotional pauses, not informative
// - If content is dense → split into more slides, never compress
//

function makeSlide(
  type: SlideData["type"],
  label: string,
  headline: string,
  body?: string
): SlideData {
  return { type, label, headline, body, slideNumber: 0, totalSlides: 0 };
}

export function mapContentToSlides(
  content: Record<string, string>,
  contentType?: string
): SlideData[] {
  const dir = getCreativeDirection(contentType);
  const slides: SlideData[] = [];
  const hlMax = dir.headlineMaxWords;

  // ── 1. COVER — Provocative hook, not summary ──
  const gancho = content["Gancho"] || "";
  if (gancho) {
    const headline = generateCoverHeadline(gancho, dir.coverMaxWords);
    slides.push(makeSlide("cover", "Gancho", headline));
    // No body on cover — ever. The tension must be unresolved.
  }

  // ── 2. STATEMENT — Quebra de percepção ──
  const quebra = content["Quebra de percepção"] || "";
  if (quebra) {
    const sents = sentences(quebra);
    // First sentence as tension statement
    const main = extractStrongestSentence(quebra, hlMax);
    slides.push(makeSlide("statement", "Quebra de percepção", main));
    
    // Second sentence becomes a breathing slide (emotional pause)
    if (sents.length > 1) {
      slides.push(makeSlide(
        "breathing", "Pausa",
        enforceMaxWords(sents[1].replace(/\.$/, ""), hlMax) || ""
      ));
    }
  }

  // ── 3. EDITORIAL — Each paragraph = its own slide ──
  const explicacao = content["Explicação / visão"] || "";
  if (explicacao) {
    // Split into sentences, not paragraphs — 1 idea per slide
    const allSents = sentences(explicacao);
    const maxSlides = Math.min(allSents.length, 3);
    
    for (let i = 0; i < maxSlides; i++) {
      const sent = allSents[i];
      const headline = enforceMaxWords(sent.replace(/\.$/, ""), hlMax) || "";
      
      // Alternate between editorial and breathing for rhythm
      if (i % 2 === 0) {
        slides.push(makeSlide("editorial", "Visão", headline));
      } else {
        slides.push(makeSlide("breathing", "Insight", headline));
      }
    }
  }

  // ── 4. STRUCTURED — Max 3 items, each ultra-short ──
  const metodo = content["Método / lógica"] || "";
  if (metodo) {
    const items = extractItems(metodo);
    if (items.length >= 2) {
      const shortItems = items.slice(0, 3).map(
        (it) => enforceMaxWords(it, hlMax) || it
      );
      slides.push({
        ...makeSlide("structured", "Método", enforceMaxWords(items[0], hlMax - 2) || "Método"),
        items: shortItems.slice(1),
      });
    } else {
      // Single idea → editorial slide
      slides.push(makeSlide(
        "editorial", "Método",
        extractStrongestSentence(metodo, hlMax)
      ));
    }
  }

  // ── 5. Pre-manifesto breathing pause ──
  slides.push(makeSlide("breathing", "Pausa", "Pense nisso."));

  // ── 6. MANIFESTO — Single belief statement ──
  const manifesto = content["Manifesto"] || "";
  if (manifesto) {
    const headline = extractStrongestSentence(manifesto, hlMax + 4);
    slides.push(makeSlide("manifesto", "Manifesto", headline.replace(/\.$/, "")));
  }

  // ── 7. SIGNATURE — Calm, conclusive, not a CTA ──
  const fechamento = content["Fechamento"] || "";
  if (fechamento) {
    const headline = extractStrongestSentence(fechamento, hlMax);
    slides.push(makeSlide("signature", "Fechamento", headline.replace(/\.$/, "")));
  }

  // ── Ensure minimum breathing slides ──
  const breathingCount = slides.filter((s) => s.type === "breathing").length;
  if (breathingCount < dir.minBreathingSlides) {
    // Insert breathing slides at strategic points
    const needed = dir.minBreathingSlides - breathingCount;
    for (let i = 0; i < needed; i++) {
      // Find a position between heavy slides
      const insertAt = Math.min(2 + i * 2, slides.length - 2);
      if (insertAt > 0 && insertAt < slides.length) {
        slides.splice(insertAt, 0, makeSlide(
          "breathing", "Pausa",
          i === 0 ? "Reflita sobre isso." : "—"
        ));
      }
    }
  }

  // ── Update slide numbers ──
  slides.forEach((s, i) => {
    s.slideNumber = i + 1;
    s.totalSlides = slides.length;
  });

  return slides;
}
