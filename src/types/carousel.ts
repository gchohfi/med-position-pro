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
