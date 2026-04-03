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

export type TravessIALayout = "capa" | "timg" | "tonly" | "stat" | "turning" | "light" | "final";

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
}

export interface TravessIARoteiro {
  titulo_carrossel: string;
  tese: string;
  jornada?: string;
  slides: TravessIASlide[];
  legenda?: string;
  hashtags?: string[];
  cta_final?: string;
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

// Convert TravessIA slide to SlideData for the renderer
export function travessiaToSlideData(slide: TravessIASlide, totalSlides: number): import("@/components/carousel/SlideRenderer").SlideData {
  const typeMap: Record<TravessIALayout, import("@/components/carousel/SlideRenderer").SlideData["type"]> = {
    capa: "cover",
    timg: "editorial",
    tonly: "editorial",
    stat: "structured",
    turning: "statement",
    light: "editorial",
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
  };
}
