import { describe, expect, it } from "vitest";
import {
  avaliarQualidadeRoteiro,
  simularRevisaoNutrologa,
  validarRoteiro,
  type TravessIARoteiro,
} from "@/types/carousel";

const buildSlide = (numero: number, layout: TravessIARoteiro["slides"][number]["layout"]) => ({
  numero,
  layout,
  headline: `Headline ${numero}`,
  texto: `Texto de apoio ${numero}`,
});

describe("qualidade e validacao do roteiro de carrossel", () => {
  it("marca aviso quando roteiro tem menos de 7 slides", () => {
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Teste",
      tese: "Tese",
      slides: [
        { ...buildSlide(1, "capa") },
        { ...buildSlide(2, "tonly") },
        { ...buildSlide(3, "final"), pergunta_comentario: "Faz sentido para você?" },
      ],
    };

    const avisos = validarRoteiro(roteiro);
    expect(avisos.some((a) => a.includes("mínimo 7"))).toBe(true);
  });

  it("marca aviso quando roteiro passa de 10 slides", () => {
    const slides = Array.from({ length: 11 }, (_, i) =>
      buildSlide(i + 1, i === 0 ? "capa" : i === 10 ? "final" : "tonly")
    );
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Teste",
      tese: "Tese",
      slides,
    };

    const avisos = validarRoteiro(roteiro);
    expect(avisos.some((a) => a.includes("máximo 10"))).toBe(true);
  });

  it("gera score alto para roteiro bem estruturado", () => {
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Guia",
      tese: "Tese",
      slides: [
        { numero: 1, layout: "capa", headline: "Erro comum no consultório" },
        { numero: 2, layout: "tonly", big_text: "O problema não é só técnica", texto: "Contexto breve" },
        { numero: 3, layout: "stat", stat_number: "73%", stat_unit: "dos casos", texto: "Dado de apoio", e_dai: "Isso muda conduta" },
        { numero: 4, layout: "turning", turn_text: "Mas há uma saída", opinion: "Ajuste de protocolo resolve parte do cenário." },
        { numero: 5, layout: "light", mini_titulo: "Aplicação", texto: "Passo prático em linguagem simples." },
        { numero: 6, layout: "timg", mini_titulo: "Exemplo", texto: "Caso de rotina clínica." },
        { numero: 7, layout: "final", conclusion: "Comece pelo básico hoje", pergunta_comentario: "Qual etapa você vai aplicar?" },
      ],
    };

    const report = avaliarQualidadeRoteiro(roteiro);
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.summary).toBe("excelente");
  });

  it("simula parecer de nutróloga com foco em evidência e próximo passo", () => {
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Nutrologia prática",
      tese: "Ajuste nutricional começa por diagnóstico",
      slides: [
        { numero: 1, layout: "capa", headline: "Seu cansaço não é normal" },
        { numero: 2, layout: "tonly", big_text: "Sinal clínico importa", texto: "Rotina e sintomas precisam de contexto." },
        { numero: 3, layout: "stat", stat_number: "68%", stat_unit: "das pacientes", texto: "Estudos apontam baixa adesão sem plano personalizado." },
        { numero: 4, layout: "light", mini_titulo: "Plano", texto: "Defina passo a passo de rotina e solicitação de exames." },
        { numero: 5, layout: "final", conclusion: "Comece pelo diagnóstico", pergunta_comentario: "Qual dificuldade você sente hoje?" },
      ],
    };

    const review = simularRevisaoNutrologa(roteiro);
    expect(review.parecer).toBe("aprovado");
    expect(review.scientificFeedback.length).toBeGreaterThan(10);
  });

  it("avisa quando primeiro slide não é capa e último não é final", () => {
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Erro de estrutura",
      tese: "Tese",
      slides: [
        { numero: 1, layout: "tonly", big_text: "Abertura errada", texto: "Texto" },
        { numero: 2, layout: "light", mini_titulo: "Meio", texto: "Texto" },
        { numero: 3, layout: "stat", stat_number: "40%", stat_unit: "casos", texto: "Texto" },
        { numero: 4, layout: "turning", turn_text: "Virada", opinion: "Texto" },
        { numero: 5, layout: "light", mini_titulo: "Aplicação", texto: "Texto" },
        { numero: 6, layout: "timg", mini_titulo: "Exemplo", texto: "Texto" },
        { numero: 7, layout: "light", mini_titulo: "Fim sem final", texto: "Texto" },
      ],
    };

    const avisos = validarRoteiro(roteiro);
    expect(avisos.some((a) => a.includes("Slide 1 nao e capa"))).toBe(true);
    expect(avisos.some((a) => a.includes("Ultimo slide nao e final"))).toBe(true);
  });

  it("simulação de nutróloga pede ajuste quando faltam evidência e pergunta final", () => {
    const roteiro: TravessIARoteiro = {
      titulo_carrossel: "Sem âncora",
      tese: "Tese",
      slides: [
        { numero: 1, layout: "capa", headline: "Tema amplo" },
        { numero: 2, layout: "tonly", big_text: "Conceito", texto: "Explicação genérica." },
        { numero: 3, layout: "light", mini_titulo: "Dica", texto: "Dica sem passo prático concreto." },
        { numero: 4, layout: "final", conclusion: "Fim" },
      ],
    };

    const review = simularRevisaoNutrologa(roteiro);
    expect(review.parecer).toBe("ajustar_antes_de_publicar");
    expect(review.ctaFeedback.toLowerCase()).toContain("pergunta");
  });
});
