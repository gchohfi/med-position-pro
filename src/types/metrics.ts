export interface PostMetrics {
  id: string;
  post_url?: string;
  data_publicacao: string;
  tipo: "carrossel" | "reels" | "imagem" | "stories";
  alcance: number;
  impressoes: number;
  curtidas: number;
  comentarios: number;
  salvamentos: number;
  compartilhamentos: number;
  visitas_perfil?: number;
  cliques_link?: number;
  novos_seguidores?: number;
  taxa_engajamento?: number;
  notas?: string;
}

export interface MetricsSummary {
  total_posts: number;
  media_alcance: number;
  media_engajamento: number;
  melhor_tipo: string;
  melhor_dia: string;
  tendencia: "crescimento" | "estavel" | "queda";
  periodo: string;
}
