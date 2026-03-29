import type { SlideData } from "./SlideRenderer";

const OUTPUT_SECTIONS = [
  "Gancho",
  "Quebra de percepção",
  "Explicação / visão",
  "Método / lógica",
  "Manifesto",
  "Fechamento",
];

const SECTION_TO_SLIDE: Record<string, SlideData["type"]> = {
  "Gancho": "hook",
  "Quebra de percepção": "quebra",
  "Explicação / visão": "explicacao",
  "Método / lógica": "metodo",
  "Manifesto": "manifesto",
  "Fechamento": "fechamento",
};

/**
 * Maps the 6 generated content blocks into 8 slides:
 * - Slide 1: Gancho (hook forte)
 * - Slide 2: Quebra de percepção
 * - Slides 3-5: Explicação/visão (split into up to 3 slides)
 * - Slide 6: Método/lógica
 * - Slide 7: Manifesto
 * - Slide 8: Fechamento
 */
export function mapContentToSlides(
  content: Record<string, string>
): SlideData[] {
  const slides: SlideData[] = [];

  // 1. Gancho
  if (content["Gancho"]) {
    slides.push({
      type: "hook",
      label: "Gancho",
      content: content["Gancho"],
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 2. Quebra
  if (content["Quebra de percepção"]) {
    slides.push({
      type: "quebra",
      label: "Quebra de percepção",
      content: content["Quebra de percepção"],
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 3-5. Explicação (split into multiple slides if content is long)
  const explicacao = content["Explicação / visão"] || "";
  if (explicacao) {
    const paragraphs = explicacao
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length <= 3) {
      // Single slide if short
      slides.push({
        type: "explicacao",
        label: "Explicação",
        content: explicacao,
        slideNumber: 0,
        totalSlides: 0,
      });
    } else {
      // Split into 2-3 slides
      const chunkSize = Math.ceil(paragraphs.length / 3);
      const chunks: string[][] = [];
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        chunks.push(paragraphs.slice(i, i + chunkSize));
      }
      chunks.forEach((chunk, i) => {
        slides.push({
          type: "explicacao",
          label: `Explicação ${i + 1}/${chunks.length}`,
          content: chunk.join("\n\n"),
          slideNumber: 0,
          totalSlides: 0,
        });
      });
    }
  }

  // 6. Método
  if (content["Método / lógica"]) {
    slides.push({
      type: "metodo",
      label: "Método",
      content: content["Método / lógica"],
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 7. Manifesto
  if (content["Manifesto"]) {
    slides.push({
      type: "manifesto",
      label: "Manifesto",
      content: content["Manifesto"],
      slideNumber: 0,
      totalSlides: 0,
    });
  }

  // 8. Fechamento
  if (content["Fechamento"]) {
    slides.push({
      type: "fechamento",
      label: "Fechamento",
      content: content["Fechamento"],
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
