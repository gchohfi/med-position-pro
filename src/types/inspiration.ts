/** Shared types for the Inspiration → Carousel pipeline */

export interface ContentIdea {
  titulo: string;
  formato: string;
  tese: string;
  por_que_funciona: string;
}

export interface ProfileAnalysis {
  handle: string;
  estrategia_resumo: string;
  topicos_mais_engajados: string[];
  formatos_eficazes: string[];
  hooks_eficazes: string[];
  estilo_visual: string;
  gaps_conteudo: string[];
  ideias_inspiradas: ContentIdea[];
}

export interface AnalysisResult {
  analises: ProfileAnalysis[];
  oportunidades_cruzadas: string[];
  tendencias_formato: string;
}

/** Enum values accepted by the Carrossel objective Select */
export type ObjetivoEnum = "educar" | "salvar" | "comentar" | "conversao";

/** Maps free-text objetivo from Inspiration to the closest enum value */
export function mapToObjetivoEnum(text: string): ObjetivoEnum {
  const lower = (text || "").toLowerCase();
  if (/salva|bookmark|save|salv/i.test(lower)) return "salvar";
  if (/coment|discuss|engaj|pergunt|conversa/i.test(lower)) return "comentar";
  if (/convers[ãa]o|converter|vend|agend|consult|captaç/i.test(lower)) return "conversao";
  return "educar";
}
