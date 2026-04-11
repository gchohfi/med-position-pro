/**
 * Performance Potential Score — Multi-dimensional scoring engine for carousel content.
 * Evaluates hook strength, clarity, save/comment potential, benchmark fit, brand fit, and more.
 */

import type { TravessIARoteiro, TravessIASlide } from "@/types/carousel";
import { getPreset, type BenchmarkPresetId, type BenchmarkPreset } from "@/lib/benchmark-presets";

export interface PerformanceScore {
  overall: number;
  hook: number;
  save: number;
  comment: number;
  clarity: number;
  authority: number;
  visual: number;
  brandFit: number;
  benchmarkFit: number;
  verdict: "excelente" | "forte" | "bom" | "mediano" | "fraco";
  strengths: string[];
  weaknesses: string[];
  actions: ScoreAction[];
  bestPresetFit: BenchmarkPresetId;
  presetFitNote: string;
}

export interface ScoreAction {
  label: string;
  impact: "alto" | "medio" | "baixo";
  category: "hook" | "cta" | "visual" | "narrativa" | "dados" | "preset";
}

function countWords(text?: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function scoreHook(slides: TravessIASlide[]): { score: number; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];
  const capa = slides.find((s) => s.layout === "capa");

  if (!capa) {
    weaknesses.push("Sem slide de capa — hook inexistente.");
    actions.push({ label: "Adicionar slide de capa com headline provocativa", impact: "alto", category: "hook" });
    return { score: 10, strengths, weaknesses, actions };
  }

  const hlWords = countWords(capa.headline);
  if (hlWords <= 5) { score += 25; strengths.push("Headline curta e impactante."); }
  else if (hlWords <= 7) { score += 15; strengths.push("Headline com bom tamanho."); }
  else { score -= 10; weaknesses.push("Headline longa demais — perde impacto visual."); actions.push({ label: "Encurtar headline da capa para 3-5 palavras", impact: "alto", category: "hook" }); }

  if (capa.eyebrow) { score += 10; strengths.push("Eyebrow presente — reforça contexto."); }
  else { actions.push({ label: "Adicionar eyebrow de especialidade na capa", impact: "baixo", category: "hook" }); }

  const genericPatterns = /^(tudo sobre|como|o que é|dicas para|guia completo|você sabia|sabia que)/i;
  if (capa.headline && genericPatterns.test(capa.headline)) {
    score -= 15;
    weaknesses.push("Hook com padrão genérico — pouco diferenciador.");
    actions.push({ label: "Trocar para pergunta retórica ou afirmação contraintuitiva", impact: "alto", category: "hook" });
  } else if (capa.headline) {
    score += 10;
    strengths.push("Hook diferenciado — evita padrões genéricos.");
  }

  return { score: clamp(score), strengths, weaknesses, actions };
}

function scoreSavePotential(slides: TravessIASlide[]): { score: number; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  let score = 40;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];

  const hasStat = slides.some((s) => s.layout === "stat");
  if (hasStat) { score += 20; strengths.push("Dado/estatística presente — aumenta salvamentos."); }
  else { score -= 5; weaknesses.push("Sem dado numérico — menor potencial de salvamento."); actions.push({ label: "Inserir slide de dado ou estatística", impact: "alto", category: "dados" }); }

  const hasTimeline = slides.some((s) => s.layout === "timeline");
  if (hasTimeline) { score += 15; strengths.push("Conteúdo estruturado (timeline) — altamente salvável."); }

  const uniqueLayouts = new Set(slides.map((s) => s.layout)).size;
  if (uniqueLayouts >= 5) { score += 15; strengths.push("Alta variedade de layouts — conteúdo visualmente rico."); }
  else if (uniqueLayouts >= 4) { score += 8; }
  else { weaknesses.push("Pouca variedade visual."); }

  if (slides.length >= 7 && slides.length <= 10) { score += 10; }

  return { score: clamp(score), strengths, weaknesses, actions };
}

function scoreCommentPotential(slides: TravessIASlide[]): { score: number; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  let score = 35;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];

  const hasQuestion = slides.some((s) => !!s.pergunta_comentario?.trim());
  if (hasQuestion) { score += 30; strengths.push("Pergunta final para estimular comentários."); }
  else { score -= 10; weaknesses.push("Sem pergunta para comentários."); actions.push({ label: "Adicionar pergunta específica no slide final", impact: "alto", category: "cta" }); }

  const hasTurning = slides.some((s) => s.layout === "turning");
  if (hasTurning) { score += 15; strengths.push("Turning point cria tensão e debate."); }

  const hasOpinion = slides.some((s) => !!s.opinion?.trim());
  if (hasOpinion) { score += 10; strengths.push("Opinião posicionada — gera concordância/discordância."); }

  const capa = slides.find((s) => s.layout === "capa");
  if (capa?.headline && /\?/.test(capa.headline)) { score += 10; strengths.push("Headline com pergunta — gera curiosidade e respostas."); }

  return { score: clamp(score), strengths, weaknesses, actions };
}

function scoreClarity(roteiro: TravessIARoteiro): { score: number; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];

  if (roteiro.tese && roteiro.tese.length > 20) { score += 20; strengths.push("Tese central clara e definida."); }
  else { score -= 10; weaknesses.push("Tese central fraca ou ausente."); actions.push({ label: "Definir tese central mais assertiva", impact: "alto", category: "narrativa" }); }

  const slides = roteiro.slides || [];
  const overloadedSlides = slides.filter((s) => {
    const words = countWords(s.texto) + countWords(s.opinion) + countWords(s.e_dai);
    return words > 50;
  }).length;
  if (overloadedSlides === 0) { score += 15; strengths.push("Densidade textual adequada em todos os slides."); }
  else { score -= overloadedSlides * 5; weaknesses.push(`${overloadedSlides} slide(s) com excesso de texto.`); actions.push({ label: "Reduzir texto dos slides sobrecarregados", impact: "medio", category: "narrativa" }); }

  if (slides.length > 0 && slides[slides.length - 1].layout === "final") { score += 10; strengths.push("Fechamento narrativo presente."); }
  else { score -= 5; actions.push({ label: "Adicionar slide final para fechar a narrativa", impact: "medio", category: "narrativa" }); }

  return { score: clamp(score), strengths, weaknesses, actions };
}

function scoreAuthority(slides: TravessIASlide[]): { score: number; strengths: string[]; weaknesses: string[]; } {
  let score = 40;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const hasStat = slides.some((s) => s.layout === "stat");
  if (hasStat) { score += 20; strengths.push("Referência numérica reforça credibilidade."); }

  const hasEvidence = slides.some((s) => /\b(estudo|evidência|meta[- ]análise|pesquisa|protocolo|dados)\b/i.test((s.texto || "") + " " + (s.opinion || "")));
  if (hasEvidence) { score += 20; strengths.push("Menção a evidência científica."); }
  else { weaknesses.push("Sem menção a fontes ou evidências."); }

  const hasTimeline = slides.some((s) => s.layout === "timeline");
  if (hasTimeline) { score += 10; }

  if (slides.length >= 7) { score += 10; }

  return { score: clamp(score), strengths, weaknesses };
}

function scoreVisual(slides: TravessIASlide[]): { score: number; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  let score = 40;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];

  const uniqueLayouts = new Set(slides.map((s) => s.layout)).size;
  if (uniqueLayouts >= 5) { score += 25; strengths.push("Excelente variedade visual."); }
  else if (uniqueLayouts >= 4) { score += 15; strengths.push("Boa variedade de layouts."); }
  else { score -= 5; weaknesses.push("Variedade visual insuficiente."); actions.push({ label: "Adicionar layouts variados (stat, turning, light)", impact: "medio", category: "visual" }); }

  for (let i = 1; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout && slides[i].layout !== "tonly") {
      score -= 8;
      weaknesses.push(`Layouts repetidos consecutivamente (slides ${i} e ${i + 1}).`);
      actions.push({ label: `Trocar layout do slide ${i + 1} para quebrar monotonia`, impact: "medio", category: "visual" });
      break;
    }
  }

  const hasLight = slides.some((s) => s.layout === "light");
  if (hasLight) { score += 10; strengths.push("Respiro visual (slide light) presente."); }
  else { actions.push({ label: "Inserir slide light para respiro visual", impact: "baixo", category: "visual" }); }

  if (slides[0]?.layout === "capa" && slides[slides.length - 1]?.layout === "final") {
    score += 10; strengths.push("Estrutura capa → final completa.");
  }

  return { score: clamp(score), strengths, weaknesses, actions };
}

function scoreBenchmarkFit(roteiro: TravessIARoteiro, presetId: BenchmarkPresetId): { score: number; note: string; bestFit: BenchmarkPresetId; strengths: string[]; weaknesses: string[]; actions: ScoreAction[] } {
  const preset = getPreset(presetId);
  const slides = roteiro.slides || [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actions: ScoreAction[] = [];
  let score = 50;

  // Check headline length against preset max
  const capa = slides.find((s) => s.layout === "capa");
  const hlWords = countWords(capa?.headline);
  if (hlWords <= preset.behavior.headlineMaxWords) { score += 15; strengths.push(`Headline dentro do limite do preset (${preset.behavior.headlineMaxWords} palavras).`); }
  else { score -= 10; weaknesses.push(`Headline excede o limite do preset ${preset.label}.`); }

  // Check text density
  const avgWords = slides.reduce((sum, s) => sum + countWords(s.texto) + countWords(s.opinion), 0) / Math.max(slides.length, 1);
  const expectedMax = preset.behavior.textDensity === "minimal" ? 20 : preset.behavior.textDensity === "moderada" ? 35 : 50;
  if (avgWords <= expectedMax) { score += 15; strengths.push(`Densidade textual coerente com ${preset.label}.`); }
  else { score -= 10; weaknesses.push(`Texto mais denso que o esperado para ${preset.label}.`); }

  // Check layouts presence
  const usedLayouts = new Set(slides.map((s) => s.layout));
  const recommended = new Set(preset.behavior.recommendedLayouts);
  const overlap = [...usedLayouts].filter((l) => recommended.has(l)).length;
  if (overlap >= 4) { score += 15; strengths.push("Layouts alinhados com a direção do preset."); }
  else if (overlap >= 3) { score += 8; }
  else { score -= 5; weaknesses.push("Layouts pouco alinhados com o preset escolhido."); }

  // Determine best preset fit
  const presetIds: BenchmarkPresetId[] = ["impacto_viral", "autoridade_premium", "educacao_sofisticada", "consultorio_humano"];
  let bestFit = presetId;
  let bestScore = score;

  if (hlWords <= 5 && avgWords <= 20) {
    if (presetId !== "impacto_viral") { bestFit = "impacto_viral"; bestScore = score + 10; }
  } else if (avgWords >= 30 && slides.some((s) => s.layout === "timeline")) {
    if (presetId !== "educacao_sofisticada") { bestFit = "educacao_sofisticada"; }
  }

  const note = bestFit !== presetId
    ? `O conteúdo ficaria mais forte com o preset "${getPreset(bestFit).label}".`
    : `Conteúdo bem alinhado com "${preset.label}".`;

  if (bestFit !== presetId) {
    actions.push({ label: `Considerar mudar para preset ${getPreset(bestFit).label}`, impact: "medio", category: "preset" });
  }

  return { score: clamp(score), note, bestFit, strengths, weaknesses, actions };
}

export function calculatePerformanceScore(
  roteiro: TravessIARoteiro,
  presetId: BenchmarkPresetId
): PerformanceScore {
  const slides = roteiro.slides || [];
  const hookResult = scoreHook(slides);
  const saveResult = scoreSavePotential(slides);
  const commentResult = scoreCommentPotential(slides);
  const clarityResult = scoreClarity(roteiro);
  const authorityResult = scoreAuthority(slides);
  const visualResult = scoreVisual(slides);
  const benchResult = scoreBenchmarkFit(roteiro, presetId);

  // Brand fit = average of clarity + authority (simplified — brand = message + credibility)
  const brandFit = clamp(Math.round((clarityResult.score + authorityResult.score) / 2));

  // Weighted overall
  const overall = clamp(Math.round(
    hookResult.score * 0.18 +
    saveResult.score * 0.12 +
    commentResult.score * 0.10 +
    clarityResult.score * 0.15 +
    authorityResult.score * 0.12 +
    visualResult.score * 0.13 +
    brandFit * 0.08 +
    benchResult.score * 0.12
  ));

  const allStrengths = [...new Set([
    ...hookResult.strengths,
    ...saveResult.strengths,
    ...commentResult.strengths,
    ...clarityResult.strengths,
    ...authorityResult.strengths,
    ...visualResult.strengths,
    ...benchResult.strengths,
  ])];

  const allWeaknesses = [...new Set([
    ...hookResult.weaknesses,
    ...saveResult.weaknesses,
    ...commentResult.weaknesses,
    ...clarityResult.weaknesses,
    ...authorityResult.weaknesses,
    ...visualResult.weaknesses,
    ...benchResult.weaknesses,
  ])];

  const allActions = [
    ...hookResult.actions,
    ...saveResult.actions,
    ...commentResult.actions,
    ...clarityResult.actions,
    ...visualResult.actions,
    ...benchResult.actions,
  ].sort((a, b) => {
    const order = { alto: 0, medio: 1, baixo: 2 };
    return order[a.impact] - order[b.impact];
  }).slice(0, 5);

  const verdict: PerformanceScore["verdict"] =
    overall >= 85 ? "excelente" : overall >= 72 ? "forte" : overall >= 58 ? "bom" : overall >= 40 ? "mediano" : "fraco";

  return {
    overall,
    hook: hookResult.score,
    save: saveResult.score,
    comment: commentResult.score,
    clarity: clarityResult.score,
    authority: authorityResult.score,
    visual: visualResult.score,
    brandFit,
    benchmarkFit: benchResult.score,
    verdict,
    strengths: allStrengths.slice(0, 4),
    weaknesses: allWeaknesses.slice(0, 4),
    actions: allActions,
    bestPresetFit: benchResult.bestFit,
    presetFitNote: benchResult.note,
  };
}
