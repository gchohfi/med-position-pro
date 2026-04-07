export interface CarouselSlide {
  numero: number;
  papel: "gancho" | "desconstrucao" | "revelacao" | "metodo" | "prova" | "ampliacao" | "identidade" | "cta" | "transicao" | "humanizacao";
  titulo: string;
  corpo: string;
  nota_visual?: string;
  cta?: string;
}

export interface CarouselRoteiro {
  titulo_carrossel: string;
  tese_central: string;
  slides: CarouselSlide[];
  legenda: string;
  hashtags: string[];
  cta_final: string;
  tom: string;
  objetivo: string;
}

export interface BrandIdentity {
  cor_primaria: string;
  cor_secundaria: string;
  cor_texto: string;
  cor_accent: string;
  fonte_titulo: string;
  fonte_corpo: string;
  estilo: "clean" | "bold" | "editorial" | "minimal";
}

export const DEFAULT_BRAND: BrandIdentity = {
  cor_primaria: "#1a1a2e",
  cor_secundaria: "#f8f8f2",
  cor_texto: "#ffffff",
  cor_accent: "#e94560",
  fonte_titulo: "Inter",
  fonte_corpo: "Inter",
  estilo: "editorial",
};

// ─── TRAVESSIA CAROUSEL SYSTEM ─────────────────────────────────────────────

export type TravessIALayout = "capa" | "timg" | "tonly" | "stat" | "turning" | "light" | "timeline" | "final";

export interface TravessIASlide {
  numero: number;
  layout: TravessIALayout;
  // capa
  eyebrow?: string;
  headline?: string;
  img_query?: string;
  // timg, light
  mini_titulo?: string;
  texto?: string;
  // tonly
  zone_label?: string;
  big_text?: string;
  // stat
  stat_number?: string;
  stat_unit?: string;
  e_dai?: string;
  // turning
  turn_text?: string;
  opinion?: string;
  // final
  conclusion?: string;
  pergunta_comentario?: string;
  // timeline
  timeline_steps?: Array<{
    numero: string;
    titulo: string;
    descricao?: string;
    destaque?: boolean;
  }>;
  timeline_titulo?: string;
  timeline_subtitulo?: string;
}

export type PreferredVisualStyle = "travessia" | "editorial_black_gold" | "ivory_sage";

export interface TravessIARoteiro {
  titulo_carrossel: string;
  tese: string;
  jornada?: string;
  slides: TravessIASlide[];
  legenda?: string;
  hashtags?: string[];
  cta_final?: string;
  preferredVisualStyle?: PreferredVisualStyle;
}

export interface CarouselQualityReport {
  score: number;
  summary: "excelente" | "boa" | "regular" | "fraca";
  strengths: string[];
  improvements: string[];
}

export interface NutrologaReviewReport {
  parecer: "aprovado" | "ajustar_antes_de_publicar";
  headlineFeedback: string;
  scientificFeedback: string;
  practicalFeedback: string;
  ctaFeedback: string;
}

export interface CarouselSkill {
  nome_canal: string;
  handle: string;
  posicionamento: string;
  tom: string;
  publico_principal: string;
  publico_secundario: string;
  pilares: string[];
  proibicoes: string[];
  estilo_visual: {
    cor_fundo: string;
    cor_destaque: string;
    cor_texto: string;
    fonte_display: string;
    fonte_corpo: string;
    referencia_visual: string;
    estilo_imagem: string;
    preferredVisualStyle?: PreferredVisualStyle;
  };
}

export const DEFAULT_SKILL: CarouselSkill = {
  nome_canal: "MEDSHIFT",
  handle: "@medshift",
  posicionamento: "Posicionamento estrategico medico",
  tom: "Direto, racional, tecnico e acessivel",
  publico_principal: "Medicos que querem se posicionar no Instagram",
  publico_secundario: "Profissionais de saude em geral",
  pilares: ["Posicionamento", "Estrategia", "Conteudo"],
  proibicoes: ["Nunca promete resultados", "Nunca usa antes/depois", "Respeita CFM 2.336/2023"],
  estilo_visual: {
    cor_fundo: "#111111",
    cor_destaque: "#ffffff",
    cor_texto: "#f0f0f0",
    fonte_display: "Bebas Neue",
    fonte_corpo: "Inter",
    referencia_visual: "Editorial medico premium",
    estilo_imagem: "cinematic, editorial, dark and moody, medical",
    preferredVisualStyle: "editorial_black_gold",
  },
};

// Validation (ported from agent_roteirista.py)
export function validarRoteiro(roteiro: TravessIARoteiro): string[] {
  const avisos: string[] = [];
  const slides = roteiro.slides;
  if (slides.length < 7) avisos.push(`Poucos slides para jornada completa: ${slides.length} (mínimo 7)`);
  if (slides.length > 10) avisos.push(`Slides demais para Instagram: ${slides.length} (máximo 10)`);
  if (slides.length > 0 && slides[0].layout !== "capa") avisos.push("Slide 1 nao e capa");
  if (slides.length > 0 && slides[slides.length - 1].layout !== "final") avisos.push("Ultimo slide nao e final");
  for (const s of slides) {
    for (const campo of ["texto", "opinion", "mini_titulo", "big_text", "turn_text", "conclusion"] as const) {
      const val = s[campo];
      if (val && (val.includes(" — ") || val.includes(" – "))) {
        avisos.push(`Slide ${s.numero}: travessao em '${campo}'`);
      }
    }
  }
  return avisos;
}

function countWords(text?: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function avaliarQualidadeRoteiro(roteiro: TravessIARoteiro): CarouselQualityReport {
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 100;
  const slides = roteiro.slides ?? [];

  if (slides.length >= 7 && slides.length <= 10) {
    strengths.push("Quantidade de slides ideal para retenção no Instagram.");
  } else {
    score -= 15;
    improvements.push("Ajustar total para 7-10 slides.");
  }

  if (slides[0]?.layout === "capa") strengths.push("Abre com capa (bom gancho inicial).");
  else {
    score -= 10;
    improvements.push("Começar com layout capa para fortalecer o hook.");
  }

  if (slides.at(-1)?.layout === "final") strengths.push("Fecha com slide final (boa conclusão narrativa).");
  else {
    score -= 10;
    improvements.push("Finalizar com layout final para fechar a jornada.");
  }

  const uniqueLayouts = new Set(slides.map((s) => s.layout)).size;
  if (uniqueLayouts >= 4) strengths.push("Boa variedade de layouts visuais.");
  else {
    score -= 8;
    improvements.push("Aumentar variedade de layouts para evitar repetição.");
  }

  const longHeadlines = slides.filter((s) =>
    countWords(s.headline || s.big_text || s.turn_text || s.conclusion || s.mini_titulo) > 10
  ).length;
  if (longHeadlines === 0) strengths.push("Headlines curtas e escaneáveis.");
  else {
    score -= Math.min(15, longHeadlines * 3);
    improvements.push("Encurtar headlines longas para aumentar leitura rápida.");
  }

  const statSlides = slides.filter((s) => s.layout === "stat").length;
  if (statSlides > 0) strengths.push("Inclui dado/estatística para credibilidade.");
  else improvements.push("Adicionar ao menos 1 slide de dado (stat) para reforçar confiança.");

  const hasCommentQuestion = slides.some((s) => !!s.pergunta_comentario?.trim());
  if (hasCommentQuestion) strengths.push("Tem pergunta de comentário para estimular engajamento.");
  else {
    score -= 7;
    improvements.push("Adicionar pergunta final para estimular comentários.");
  }

  score = Math.max(0, Math.min(100, score));
  const summary: CarouselQualityReport["summary"] =
    score >= 85 ? "excelente" : score >= 70 ? "boa" : score >= 55 ? "regular" : "fraca";

  return { score, summary, strengths, improvements };
}

export function simularRevisaoNutrologa(roteiro: TravessIARoteiro): NutrologaReviewReport {
  const slides = roteiro.slides ?? [];
  const firstHeadline =
    slides[0]?.headline || slides[0]?.big_text || slides[0]?.turn_text || "Gancho inicial";

  const hasScientificAnchor = slides.some((s) => s.layout === "stat" || /\b(estudo|evid[êe]ncia|meta[- ]an[aá]lise|ensaio)\b/i.test(s.texto || ""));
  const hasPracticalStep = slides.some((s) => /\b(passo|rotina|plano|protocolo|consulta|exame)\b/i.test((s.texto || "") + " " + (s.opinion || "")));
  const hasCtaQuestion = slides.some((s) => !!s.pergunta_comentario?.trim());

  const parecer: NutrologaReviewReport["parecer"] =
    hasScientificAnchor && hasPracticalStep && hasCtaQuestion ? "aprovado" : "ajustar_antes_de_publicar";

  return {
    parecer,
    headlineFeedback: `Como nutróloga, eu manteria este gancho "${firstHeadline}" se ele estiver alinhado com a dor real da paciente no consultório.`,
    scientificFeedback: hasScientificAnchor
      ? "Há âncora técnica suficiente (dado/evidência) para sustentar a narrativa sem prometer resultado."
      : "Faltou um slide com dado ou evidência clínica para dar credibilidade ao conteúdo.",
    practicalFeedback: hasPracticalStep
      ? "O roteiro tem orientação aplicável para rotina da paciente, o que aumenta salvamentos."
      : "Eu incluiria orientação prática (exame, rotina ou próximo passo) para transformar interesse em ação.",
    ctaFeedback: hasCtaQuestion
      ? "Boa chamada final para comentários, isso tende a gerar conversa qualificada."
      : "Sugiro fechar com pergunta clínica simples para estimular comentários e dúvidas reais.",
  };
}

// ─── VISUAL ANTI-MEDIOCRITY VALIDATION ─────────────────────────────────────

export type VisualSeverity = "error" | "warning" | "opportunity";

export interface VisualIssue {
  severity: VisualSeverity;
  slide?: number;
  message: string;
  suggestion: string;
}

export interface VisualQualityReport {
  score: number;
  verdict: "premium" | "bom" | "morno" | "fraco";
  issues: VisualIssue[];
}

export function validarVisualAntiMediocridade(roteiro: TravessIARoteiro): VisualQualityReport {
  const issues: VisualIssue[] = [];
  const slides = roteiro.slides ?? [];
  let score = 100;

  // ── Capa fraca ──
  const capa = slides.find(s => s.layout === "capa");
  if (capa) {
    const hlWords = countWords(capa.headline);
    if (hlWords > 8) {
      score -= 15;
      issues.push({
        severity: "error", slide: 1,
        message: `Headline da capa com ${hlWords} palavras — longa demais para impacto visual.`,
        suggestion: "Cortar para 3-6 palavras. A capa é um manifesto, não um resumo.",
      });
    } else if (hlWords > 6) {
      score -= 5;
      issues.push({
        severity: "warning", slide: 1,
        message: "Headline da capa poderia ser mais curta para punch visual.",
        suggestion: "O ideal são 3-5 palavras que criam tensão não resolvida.",
      });
    }
    if (!capa.eyebrow) {
      score -= 3;
      issues.push({
        severity: "opportunity", slide: 1,
        message: "Capa sem eyebrow (contexto acima do título).",
        suggestion: "Adicionar especialidade ou tema curto como eyebrow reforça autoridade.",
      });
    }
  } else {
    score -= 20;
    issues.push({
      severity: "error",
      message: "Carrossel sem slide de capa.",
      suggestion: "Toda campanha precisa abrir com layout capa.",
    });
  }

  // ── Monotonia: layouts consecutivos iguais ──
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout && slides[i].layout !== "tonly") {
      score -= 8;
      issues.push({
        severity: "warning", slide: i + 1,
        message: `Slides ${i} e ${i + 1} usam o mesmo layout "${slides[i].layout}" consecutivamente.`,
        suggestion: "Alternar layouts cria ritmo visual. Troque um deles por stat, turning ou light.",
      });
    }
  }

  // ── Variedade de layouts ──
  const uniqueLayouts = new Set(slides.map(s => s.layout)).size;
  if (uniqueLayouts < 4) {
    score -= 10;
    issues.push({
      severity: "warning",
      message: `Apenas ${uniqueLayouts} layouts distintos — visual fica monótono.`,
      suggestion: "Usar pelo menos 4 layouts diferentes para ritmo editorial.",
    });
  }

  // ── Falta de respiro (light slide) ──
  const hasLight = slides.some(s => s.layout === "light");
  if (!hasLight) {
    score -= 5;
    issues.push({
      severity: "opportunity",
      message: "Nenhum slide light (fundo branco) para respiro visual.",
      suggestion: "Inserir 1 slide light no meio do carrossel quebra a monotonia dark.",
    });
  }

  // ── Falta de dado (stat) ──
  const hasStat = slides.some(s => s.layout === "stat");
  if (!hasStat) {
    score -= 5;
    issues.push({
      severity: "opportunity",
      message: "Sem slide de dado/estatística.",
      suggestion: "Um número de impacto aumenta credibilidade e salva-lives.",
    });
  }

  // ── Excesso de texto por slide ──
  for (const s of slides) {
    const textLength = countWords(s.texto) + countWords(s.opinion) + countWords(s.e_dai);
    if (textLength > 60) {
      score -= 5;
      issues.push({
        severity: "warning", slide: s.numero,
        message: `Slide ${s.numero} com ~${textLength} palavras — excesso de texto.`,
        suggestion: "Instagram é visual. Reduzir para max 40-50 palavras por slide.",
      });
    }
  }

  // ── Final sem assinatura ──
  const final = slides.find(s => s.layout === "final");
  if (final) {
    if (!final.conclusion) {
      score -= 10;
      issues.push({
        severity: "error", slide: slides.length,
        message: "Slide final sem frase de conclusão.",
        suggestion: "O final precisa de uma frase de fechamento que amarre a narrativa.",
      });
    }
    if (!final.pergunta_comentario) {
      score -= 7;
      issues.push({
        severity: "warning", slide: slides.length,
        message: "Slide final sem pergunta para comentários.",
        suggestion: "Uma pergunta específica gera 3-5x mais comentários que um CTA genérico.",
      });
    }
  }

  // ── Headline pouco memorável (genérica) ──
  if (capa) {
    const genericPatterns = /^(tudo sobre|como|o que é|dicas para|guia completo|você sabia)/i;
    if (capa.headline && genericPatterns.test(capa.headline)) {
      score -= 10;
      issues.push({
        severity: "warning", slide: 1,
        message: "Headline da capa começa com padrão genérico.",
        suggestion: "Substituir por provocação, pergunta retórica ou afirmação contraintuitiva.",
      });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const verdict: VisualQualityReport["verdict"] =
    score >= 90 ? "premium" : score >= 75 ? "bom" : score >= 55 ? "morno" : "fraco";

  return { score, verdict, issues };
}

// Convert TravessIA slide to SlideData for the renderer
export function travessiaToSlideData(slide: TravessIASlide, totalSlides: number): import("@/components/carousel/SlideRenderer").SlideData {
  const typeMap: Record<TravessIALayout, import("@/components/carousel/SlideRenderer").SlideData["type"]> = {
    capa: "cover",
    timg: "editorial",
    tonly: "editorial",
    stat: "structured",
    turning: "statement",
    light: "editorial",
    timeline: "structured",
    final: "signature",
  };

  return {
    type: typeMap[slide.layout],
    travessiaLayout: slide.layout,
    label: slide.layout.toUpperCase(),
    headline: slide.headline || slide.big_text || slide.turn_text || slide.conclusion || slide.mini_titulo || "",
    body: slide.texto || slide.opinion || slide.pergunta_comentario || "",
    slideNumber: slide.numero,
    totalSlides,
    eyebrow: slide.eyebrow,
    imgQuery: slide.img_query,
    zoneLabel: slide.zone_label,
    statNumber: slide.stat_number,
    statUnit: slide.stat_unit,
    eDai: slide.e_dai,
    miniTitulo: slide.mini_titulo,
    opinion: slide.opinion,
    conclusion: slide.conclusion,
    perguntaComentario: slide.pergunta_comentario,
    // timeline
    timelineSteps: slide.timeline_steps,
    timelineTitulo: slide.timeline_titulo,
    timelineSubtitulo: slide.timeline_subtitulo,
  };
}
