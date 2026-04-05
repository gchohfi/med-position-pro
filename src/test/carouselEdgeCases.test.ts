import { describe, it, expect } from "vitest";
import {
  validarRoteiro,
  avaliarQualidadeRoteiro,
  simularRevisaoNutrologa,
  travessiaToSlideData,
  type TravessIARoteiro,
  type TravessIASlide,
} from "@/types/carousel";

function makeSlide(n: number, layout: TravessIASlide["layout"], overrides: Partial<TravessIASlide> = {}): TravessIASlide {
  return { numero: n, layout, ...overrides };
}

function makeRoteiro(slides: TravessIASlide[], overrides: Partial<TravessIARoteiro> = {}): TravessIARoteiro {
  return { titulo_carrossel: "Teste", tese: "Tese", slides, ...overrides };
}

describe("validarRoteiro edge cases", () => {
  it("returns warnings for empty slides array", () => {
    const avisos = validarRoteiro(makeRoteiro([]));
    expect(avisos.some((a) => a.includes("mínimo 7"))).toBe(true);
  });

  it("detects em-dash in multiple fields of same slide", () => {
    const slides = [
      makeSlide(1, "tonly", { texto: "algo — aqui", big_text: "outro – ali" }),
    ];
    const avisos = validarRoteiro(makeRoteiro(slides));
    const dashWarnings = avisos.filter((a) => a.includes("travessao"));
    expect(dashWarnings.length).toBe(2);
  });

  it("returns no warnings for well-formed 7-slide roteiro", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "stat", { stat_number: "50%" }),
      makeSlide(4, "turning", { turn_text: "V" }),
      makeSlide(5, "light", { mini_titulo: "D" }),
      makeSlide(6, "timg", { mini_titulo: "P" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ];
    const avisos = validarRoteiro(makeRoteiro(slides));
    expect(avisos).toHaveLength(0);
  });

  it("does not warn when exactly 7 and exactly 10 slides", () => {
    const make7 = Array.from({ length: 7 }, (_, i) =>
      makeSlide(i + 1, i === 0 ? "capa" : i === 6 ? "final" : "tonly"),
    );
    expect(validarRoteiro(makeRoteiro(make7)).filter((a) => a.includes("mínimo") || a.includes("máximo"))).toHaveLength(0);

    const make10 = Array.from({ length: 10 }, (_, i) =>
      makeSlide(i + 1, i === 0 ? "capa" : i === 9 ? "final" : "tonly"),
    );
    expect(validarRoteiro(makeRoteiro(make10)).filter((a) => a.includes("mínimo") || a.includes("máximo"))).toHaveLength(0);
  });
});

describe("avaliarQualidadeRoteiro edge cases", () => {
  it("handles roteiro with 1 slide gracefully", () => {
    const report = avaliarQualidadeRoteiro(makeRoteiro([makeSlide(1, "capa", { headline: "Solo" })]));
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(["excelente", "boa", "regular", "fraca"]).toContain(report.summary);
  });

  it("clamps score to 0 for heavily penalized roteiro", () => {
    // Roteiro with many issues: wrong first/last layout, no variety, no stat, no question, long headlines
    const slides = Array.from({ length: 3 }, (_, i) =>
      makeSlide(i + 1, "tonly", { big_text: "This is a very very very very long long long long headline text that exceeds limits for sure" }),
    );
    const report = avaliarQualidadeRoteiro(makeRoteiro(slides));
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.summary).toBe("fraca");
  });

  it("returns strengths array even for perfect roteiro", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Pare" }),
      makeSlide(2, "tonly", { big_text: "Verdade" }),
      makeSlide(3, "stat", { stat_number: "73%", stat_unit: "casos" }),
      makeSlide(4, "turning", { turn_text: "Mas" }),
      makeSlide(5, "light", { mini_titulo: "Dica" }),
      makeSlide(6, "timg", { mini_titulo: "Ex" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ];
    const report = avaliarQualidadeRoteiro(makeRoteiro(slides));
    expect(report.strengths.length).toBeGreaterThan(0);
  });

  it("handles empty slides gracefully", () => {
    const report = avaliarQualidadeRoteiro(makeRoteiro([]));
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.improvements.length).toBeGreaterThan(0);
  });
});

describe("simularRevisaoNutrologa edge cases", () => {
  it("handles roteiro with no slides", () => {
    const review = simularRevisaoNutrologa(makeRoteiro([]));
    expect(review.parecer).toBe("ajustar_antes_de_publicar");
    expect(review.headlineFeedback).toBeTruthy();
  });

  it("detects scientific anchor from keyword in texto", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook" }),
      makeSlide(2, "tonly", { texto: "Um estudo recente comprovou que isso funciona." }),
      makeSlide(3, "light", { texto: "Passo prático: solicite exame de rotina." }),
      makeSlide(4, "final", { conclusion: "Fim", pergunta_comentario: "O que você acha?" }),
    ];
    const review = simularRevisaoNutrologa(makeRoteiro(slides));
    expect(review.parecer).toBe("aprovado");
  });
});

describe("travessiaToSlideData edge cases", () => {
  it("handles totalSlides = 0", () => {
    const result = travessiaToSlideData(makeSlide(1, "capa"), 0);
    expect(result.totalSlides).toBe(0);
  });

  it("handles slide with all fields populated", () => {
    const slide: TravessIASlide = {
      numero: 3,
      layout: "stat",
      eyebrow: "EYE",
      headline: "HEAD",
      img_query: "query",
      mini_titulo: "MINI",
      texto: "TEXT",
      zone_label: "ZONE",
      big_text: "BIG",
      stat_number: "99%",
      stat_unit: "unit",
      e_dai: "EDAI",
      turn_text: "TURN",
      opinion: "OP",
      conclusion: "CONC",
      pergunta_comentario: "PERG",
    };
    const result = travessiaToSlideData(slide, 10);
    // headline should pick first in chain: headline
    expect(result.headline).toBe("HEAD");
    // body should pick first in chain: texto
    expect(result.body).toBe("TEXT");
    // All optional fields should be mapped
    expect(result.statNumber).toBe("99%");
    expect(result.eyebrow).toBe("EYE");
    expect(result.opinion).toBe("OP");
    expect(result.conclusion).toBe("CONC");
    expect(result.perguntaComentario).toBe("PERG");
  });
});
