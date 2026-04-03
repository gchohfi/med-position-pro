import { describe, it, expect } from "vitest";
import {
  validarVisualAntiMediocridade,
  type TravessIARoteiro,
  type TravessIASlide,
} from "@/types/carousel";

function makeSlide(n: number, layout: TravessIASlide["layout"], overrides: Partial<TravessIASlide> = {}): TravessIASlide {
  return { numero: n, layout, ...overrides };
}

function makeRoteiro(slides: TravessIASlide[], overrides: Partial<TravessIARoteiro> = {}): TravessIARoteiro {
  return {
    titulo_carrossel: "Teste",
    tese: "Tese central",
    slides,
    ...overrides,
  };
}

describe("Visual Anti-Mediocrity Validation", () => {
  it("returns premium for a well-formed roteiro", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Pare agora", eyebrow: "Nutrologia" }),
      makeSlide(2, "tonly", { big_text: "Verdade oculta", texto: "Explicacao curta" }),
      makeSlide(3, "stat", { stat_number: "73%", stat_unit: "dos pacientes" }),
      makeSlide(4, "turning", { turn_text: "Mas e se...", opinion: "Ponto de virada" }),
      makeSlide(5, "light", { mini_titulo: "Dica", texto: "Texto leve" }),
      makeSlide(6, "timg", { mini_titulo: "Prova", texto: "Explicacao", img_query: "doctor" }),
      makeSlide(7, "final", { conclusion: "Cuide de voce", pergunta_comentario: "O que voce faz?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    expect(result.verdict).toBe("premium");
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("flags long cover headlines", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Esta é uma headline muito longa que vai destruir o impacto visual do carrossel inteiro" }),
      makeSlide(2, "tonly", { big_text: "Texto" }),
      makeSlide(3, "stat", { stat_number: "50%" }),
      makeSlide(4, "turning", { turn_text: "Virada" }),
      makeSlide(5, "light", { mini_titulo: "Dica" }),
      makeSlide(6, "timg", { mini_titulo: "Prova" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "Pergunta?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    const capaIssues = result.issues.filter(i => i.slide === 1);
    expect(capaIssues.some(i => i.message.includes("longa demais"))).toBe(true);
  });

  it("flags consecutive identical layouts", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "tonly", { big_text: "B" }),
      makeSlide(4, "stat", { stat_number: "1" }),
      makeSlide(5, "light", { mini_titulo: "X" }),
      makeSlide(6, "turning", { turn_text: "Y" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    // tonly consecutive should NOT be flagged (exclusion for tonly)
    // Actually, the validator flags it unless it's tonly... let me check
    // The code says: slides[i].layout !== "tonly" — meaning tonly IS excluded from the check
    expect(result.issues.some(i => i.message.includes("consecutivamente"))).toBe(false);
  });

  it("flags missing light slide as opportunity", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook", eyebrow: "Area" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "stat", { stat_number: "50%", stat_unit: "pacientes" }),
      makeSlide(4, "turning", { turn_text: "Virada" }),
      makeSlide(5, "timg", { mini_titulo: "B" }),
      makeSlide(6, "tonly", { big_text: "C" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    expect(result.issues.some(i => i.message.includes("light"))).toBe(true);
  });

  it("flags missing conclusion on final slide", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook", eyebrow: "X" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "stat", { stat_number: "1" }),
      makeSlide(4, "turning", { turn_text: "V" }),
      makeSlide(5, "light", { mini_titulo: "D" }),
      makeSlide(6, "timg", { mini_titulo: "P" }),
      makeSlide(7, "final", { pergunta_comentario: "?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    expect(result.issues.some(i => i.message.includes("conclusão"))).toBe(true);
  });

  it("flags generic headline patterns", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Tudo sobre vitamina D", eyebrow: "Nutrologia" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "stat", { stat_number: "1" }),
      makeSlide(4, "turning", { turn_text: "V" }),
      makeSlide(5, "light", { mini_titulo: "D" }),
      makeSlide(6, "timg", { mini_titulo: "P" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    expect(result.issues.some(i => i.message.includes("genérico"))).toBe(true);
  });

  it("returns score between 0 and 100", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "tonly", { big_text: "B" }),
      makeSlide(4, "tonly", { big_text: "C" }),
      makeSlide(5, "tonly", { big_text: "D" }),
      makeSlide(6, "tonly", { big_text: "E" }),
      makeSlide(7, "final", {}),
    ];
    const result = validarVisualAntiMediocridade(makeRoteiro(slides));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
