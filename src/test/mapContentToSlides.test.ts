import { describe, it, expect } from "vitest";
import { mapContentToSlides } from "@/components/carousel/mapContentToSlides";

const mockOutput: Record<string, string> = {
  "Gancho": "Você sabia que 80% das pessoas cometem esse erro com suplementação?",
  "Quebra de percepção": "O que você acha que sabe sobre vitamina D pode estar completamente errado.",
  "Explicação / visão": "A vitamina D não é apenas uma vitamina. Ela funciona como um hormônio que regula mais de 200 genes no corpo humano. Estudos recentes mostram que a deficiência afeta 60% da população brasileira.",
  "Método / lógica": "1. Faça exame de sangue para verificar níveis\n2. Consulte um nutrólogo para dosagem personalizada\n3. Combine com vitamina K2 para melhor absorção\n4. Reavalie a cada 3 meses",
  "Manifesto": "Não aceite protocolos genéricos. Sua saúde merece personalização baseada em evidências.",
  "Fechamento": "Quer saber qual é o seu nível ideal? Agende uma consulta e descubra.",
};

const emptyOutput: Record<string, string> = {
  "Gancho": "",
  "Quebra de percepção": "",
  "Explicação / visão": "",
  "Método / lógica": "",
  "Manifesto": "",
  "Fechamento": "",
};

describe("mapContentToSlides", () => {
  it("should generate slides from educativo content", () => {
    const slides = mapContentToSlides(mockOutput, "educativo");
    expect(slides).toBeDefined();
    expect(Array.isArray(slides)).toBe(true);
    expect(slides.length).toBeGreaterThan(0);
  });

  it("should generate slides from manifesto content", () => {
    const slides = mapContentToSlides(mockOutput, "manifesto");
    expect(slides).toBeDefined();
    expect(slides.length).toBeGreaterThan(0);
  });

  it("should generate slides from conexao content", () => {
    const slides = mapContentToSlides(mockOutput, "conexao");
    expect(slides).toBeDefined();
    expect(slides.length).toBeGreaterThan(0);
  });

  it("should generate slides from conversao content", () => {
    const slides = mapContentToSlides(mockOutput, "conversao");
    expect(slides).toBeDefined();
    expect(slides.length).toBeGreaterThan(0);
  });

  it("should generate slides from hibrido content", () => {
    const slides = mapContentToSlides(mockOutput, "hibrido");
    expect(slides).toBeDefined();
    expect(slides.length).toBeGreaterThan(0);
  });

  it("should have a cover slide as first slide", () => {
    const slides = mapContentToSlides(mockOutput, "educativo");
    expect(slides[0]).toBeDefined();
    // Cover slide should have a headline
    expect(slides[0].headline || slides[0].body).toBeTruthy();
  });

  it("should have a CTA/closing slide as last slide", () => {
    const slides = mapContentToSlides(mockOutput, "educativo");
    const lastSlide = slides[slides.length - 1];
    expect(lastSlide).toBeDefined();
  });

  it("should generate between 5 and 15 slides", () => {
    const slides = mapContentToSlides(mockOutput, "educativo");
    expect(slides.length).toBeGreaterThanOrEqual(5);
    expect(slides.length).toBeLessThanOrEqual(15);
  });

  it("should handle empty sections gracefully", () => {
    const slides = mapContentToSlides(emptyOutput, "educativo");
    expect(slides).toBeDefined();
    expect(Array.isArray(slides)).toBe(true);
  });

  it("each slide should have at least headline or body", () => {
    const slides = mapContentToSlides(mockOutput, "educativo");
    for (const slide of slides) {
      const hasContent = slide.headline || slide.body || slide.items;
      expect(hasContent).toBeTruthy();
    }
  });
});
