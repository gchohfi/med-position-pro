/**
 * Single source of truth for all application routes.
 * Every URL used in the app must be defined here.
 */

export const ROUTES = {
  // Auth & onboarding
  index: "/",
  auth: "/auth",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",

  // Core
  dashboard: "/dashboard",
  setup: "/setup",

  // Diagnóstico & Análise
  diagnostico: "/diagnostico",
  analisePerfil: "/analise-perfil",
  concorrencia: "/concorrencia",
  radarInstagram: "/radar-instagram",
  inspiracao: "/inspiracao",

  // Estratégia & Conteúdo
  tendencias: "/tendencias",
  radarMercado: "/radar-mercado",
  estrategiaIa: "/estrategia-ia",
  carrossel: "/carrossel",
  producao: "/producao",
  calendario: "/calendario",
  series: "/series",

  // Performance & Gestão
  metricas: "/metricas",
  evolucao: "/evolucao",
  biblioteca: "/biblioteca",
  memoriaViva: "/memoria-viva",
  atualizacoes: "/atualizacoes",
  supervisor: "/supervisor",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
