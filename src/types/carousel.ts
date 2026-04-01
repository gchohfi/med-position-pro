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
