import type { SlideData } from "@/components/carousel/SlideRenderer";

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
  if (slides.length < 10) avisos.push(`Poucos slides: ${slides.length}`);
  if (slides.length > 15) avisos.push(`Slides demais: ${slides.length}`);
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

export type VisualSeverity = "erro_estrutural" | "warning_visual" | "oportunidade_refino";

export interface VisualIssue {
  severity: VisualSeverity;
  code: string;
  message: string;
  slideNumber?: number;
}

export interface SlideVisualScore {
  slideNumber: number;
  layout?: SlideData["travessiaLayout"];
  score: number;
  status: "forte" | "ok" | "morno" | "critico";
  issues: VisualIssue[];
}

export interface CarouselVisualScore {
  scoreGeral: number;
  statusGeral: "forte" | "ok" | "morno" | "critico";
  slideScores: SlideVisualScore[];
  issues: VisualIssue[];
}

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const scoreStatus = (score: number): SlideVisualScore["status"] => {
  if (score >= 82) return "forte";
  if (score >= 67) return "ok";
  if (score >= 48) return "morno";
  return "critico";
};

const buildIssue = (
  severity: VisualSeverity,
  code: string,
  message: string,
  slideNumber?: number,
): VisualIssue => ({ severity, code, message, slideNumber });

function avaliarSlideVisual(
  slide: SlideData,
  doctorImageUrl?: string | null,
): SlideVisualScore {
  let score = 78;
  const issues: VisualIssue[] = [];
  const headline = slide.headline?.trim() || "";
  const body = slide.body?.trim() || "";
  const layout = slide.travessiaLayout;
  const words = headline ? headline.split(/\s+/).length : 0;
  const hasDoctorImage = !!doctorImageUrl;

  if (!headline) {
    score -= 26;
    issues.push(buildIssue("erro_estrutural", "headline_missing", "Headline ausente.", slide.slideNumber));
  } else if (words >= 18) {
    score -= 12;
    issues.push(
      buildIssue(
        "warning_visual",
        "headline_overlong",
        "Headline longa demais para impacto editorial. Considere reduzir e criar mais tensão.",
        slide.slideNumber,
      ),
    );
  } else if (words <= 3) {
    score -= 6;
    issues.push(
      buildIssue(
        "oportunidade_refino",
        "headline_short",
        "Headline curta demais; pode perder memorabilidade.",
        slide.slideNumber,
      ),
    );
  }

  if (body.length > 260) {
    score -= 14;
    issues.push(
      buildIssue(
        "warning_visual",
        "text_overload",
        "Texto secundário excessivo. O slide pode parecer denso e pouco premium.",
        slide.slideNumber,
      ),
    );
  } else if (body.length > 180) {
    score -= 8;
    issues.push(
      buildIssue(
        "oportunidade_refino",
        "text_dense",
        "Texto secundário pode ser condensado para aumentar respiro visual.",
        slide.slideNumber,
      ),
    );
  }

  if (layout === "capa") {
    if (words > 14) {
      score -= 10;
      issues.push(
        buildIssue(
          "warning_visual",
          "cover_no_tension",
          "Capa com headline longa reduz tensão de abertura.",
          slide.slideNumber,
        ),
      );
    }
    if (!slide.eyebrow) {
      score -= 5;
      issues.push(
        buildIssue(
          "oportunidade_refino",
          "cover_no_eyebrow",
          "Capa sem eyebrow perde camada editorial de autoridade.",
          slide.slideNumber,
        ),
      );
    }
    if (!hasDoctorImage) {
      score -= 8;
      issues.push(
        buildIssue(
          "oportunidade_refino",
          "cover_no_doctor",
          "Sem presença da doutora na capa, a assinatura premium pode enfraquecer.",
          slide.slideNumber,
        ),
      );
    }
  }

  if (layout === "timg") {
    if (!slide.imgQuery && !hasDoctorImage) {
      score -= 12;
      issues.push(
        buildIssue(
          "warning_visual",
          "image_weak_usage",
          "Slide texto+imagem sem direção visual clara de imagem.",
          slide.slideNumber,
        ),
      );
    }
    if (body.length > 210) {
      score -= 8;
      issues.push(
        buildIssue(
          "oportunidade_refino",
          "timg_body_long",
          "Muito texto no layout texto+imagem; composição pode perder elegância.",
          slide.slideNumber,
        ),
      );
    }
  }

  if (layout === "final") {
    if (!slide.conclusion || slide.conclusion.trim().length < 24) {
      score -= 14;
      issues.push(
        buildIssue(
          "warning_visual",
          "closing_weak",
          "Fechamento sem frase de conclusão forte o suficiente.",
          slide.slideNumber,
        ),
      );
    }
    if (!slide.perguntaComentario) {
      score -= 6;
      issues.push(
        buildIssue(
          "oportunidade_refino",
          "closing_no_prompt",
          "Slide final sem pergunta/comando pode reduzir ação e lembrança.",
          slide.slideNumber,
        ),
      );
    }
    if (!hasDoctorImage) {
      score -= 8;
      issues.push(
        buildIssue(
          "oportunidade_refino",
          "closing_no_doctor_presence",
          "Sem presença da doutora no fechamento, a assinatura visual perde força.",
          slide.slideNumber,
        ),
      );
    }
  }

  const finalScore = clampScore(score);
  return {
    slideNumber: slide.slideNumber,
    layout,
    score: finalScore,
    status: scoreStatus(finalScore),
    issues,
  };
}

export function avaliarVisualCarousel(
  slides: SlideData[],
  options?: { doctorImageUrl?: string | null },
): CarouselVisualScore {
  const issues: VisualIssue[] = [];
  if (!slides.length) {
    return {
      scoreGeral: 0,
      statusGeral: "critico",
      slideScores: [],
      issues: [buildIssue("erro_estrutural", "slides_empty", "Nenhum slide para avaliar.")],
    };
  }

  const slideScores = slides.map((slide) => avaliarSlideVisual(slide, options?.doctorImageUrl));
  issues.push(...slideScores.flatMap((s) => s.issues));

  const first = slides[0];
  const last = slides[slides.length - 1];
  if (first.travessiaLayout !== "capa") {
    issues.push(buildIssue("erro_estrutural", "first_not_cover", "Primeiro slide não é capa.", first.slideNumber));
  }
  if (last.travessiaLayout !== "final") {
    issues.push(buildIssue("erro_estrutural", "last_not_final", "Último slide não é final.", last.slideNumber));
  }

  const uniqueLayouts = new Set(slides.map((s) => s.travessiaLayout).filter(Boolean));
  if (uniqueLayouts.size <= 4) {
    issues.push(
      buildIssue(
        "warning_visual",
        "rhythm_monotony",
        "Pouca variação de layout entre slides; risco de monotonia visual.",
      ),
    );
  }

  const longBodySlides = slides.filter((s) => (s.body?.trim().length ?? 0) > 200).length;
  if (longBodySlides >= Math.ceil(slides.length * 0.45)) {
    issues.push(
      buildIssue(
        "warning_visual",
        "text_weight_unbalanced",
        "Muitos slides densos em texto; distribuição de peso visual está pesada.",
      ),
    );
  }

  const doctorImageMissing = !options?.doctorImageUrl;
  if (doctorImageMissing) {
    issues.push(
      buildIssue(
        "oportunidade_refino",
        "doctor_image_missing",
        "Sem foto da doutora no perfil. A assinatura premium pode ficar subaproveitada.",
      ),
    );
  }

  const average = slideScores.reduce((acc, s) => acc + s.score, 0) / slideScores.length;
  const structuralPenalty = issues.filter((i) => i.severity === "erro_estrutural").length * 6;
  const warningPenalty = issues.filter((i) => i.severity === "warning_visual").length * 2.5;
  const scoreGeral = clampScore(average - structuralPenalty - warningPenalty);

  return {
    scoreGeral,
    statusGeral: scoreStatus(scoreGeral),
    slideScores,
    issues,
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
