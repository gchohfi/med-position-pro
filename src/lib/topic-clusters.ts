/**
 * Topic Clusters — Predefined thematic clusters per medical specialty.
 * Each cluster maps to benchmark presets, objectives, and visual styles.
 */

import type { BenchmarkPresetId } from "./benchmark-presets";

export interface ClusterDefinition {
  id: string;
  name: string;
  description: string;
  intent: "educar" | "autoridade" | "conexao" | "conversao" | "engajamento";
  defaultPriority: "alta" | "media" | "baixa";
  benchmarkAffinity: BenchmarkPresetId[];
  recommendedObjectives: string[];
  recommendedVisualStyles: string[];
  subtopics: string[];
  contraindications: string[];
  icon: string;
  color: string;
}

/** Universal clusters that apply to all specialties */
const UNIVERSAL_CLUSTERS: ClusterDefinition[] = [
  {
    id: "duvidas_frequentes",
    name: "Dúvidas Frequentes",
    description: "Responde às perguntas mais comuns dos pacientes com clareza e empatia",
    intent: "educar",
    defaultPriority: "alta",
    benchmarkAffinity: ["educacao_sofisticada", "consultorio_humano"],
    recommendedObjectives: ["educar", "salvar", "compartilhar"],
    recommendedVisualStyles: ["travessia", "editorial"],
    subtopics: ["Perguntas do consultório", "O que pacientes pesquisam no Google", "Mitos que ouço todo dia"],
    contraindications: ["Evitar tom condescendente", "Não simplificar demais"],
    icon: "❓",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "erros_comuns",
    name: "Erros Comuns",
    description: "Aborda equívocos e erros frequentes que pacientes cometem",
    intent: "autoridade",
    defaultPriority: "alta",
    benchmarkAffinity: ["impacto_viral", "autoridade_premium"],
    recommendedObjectives: ["salvar", "compartilhar", "educar"],
    recommendedVisualStyles: ["travessia", "impacto"],
    subtopics: ["Automedicação perigosa", "Diagnósticos de internet", "Tratamentos sem evidência"],
    contraindications: ["Não ser alarmista", "Não culpabilizar o paciente"],
    icon: "⚠️",
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "mitos_verdades",
    name: "Mitos e Verdades",
    description: "Quebra crenças populares com base em evidência científica",
    intent: "engajamento",
    defaultPriority: "alta",
    benchmarkAffinity: ["impacto_viral", "educacao_sofisticada"],
    recommendedObjectives: ["comentar", "compartilhar", "salvar"],
    recommendedVisualStyles: ["travessia", "impacto"],
    subtopics: ["Mito popular vs. evidência", "O que a ciência diz", "Verdade inconveniente"],
    contraindications: ["Não ser categórico sem referência", "Respeitar diversidade cultural"],
    icon: "🔍",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "decisoes_clinicas",
    name: "Decisões Clínicas",
    description: "Mostra o raciocínio por trás de condutas médicas para o paciente entender",
    intent: "autoridade",
    defaultPriority: "media",
    benchmarkAffinity: ["autoridade_premium", "educacao_sofisticada"],
    recommendedObjectives: ["educar", "salvar", "autoridade"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["Por que escolhi esse tratamento", "Como avalio cada caso", "O que considero antes de indicar"],
    contraindications: ["Não ser técnico demais", "Não expor casos reais sem consentimento"],
    icon: "⚖️",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    id: "rotina_prevencao",
    name: "Rotina e Prevenção",
    description: "Conteúdo sobre hábitos diários e prevenção para o público leigo",
    intent: "educar",
    defaultPriority: "media",
    benchmarkAffinity: ["consultorio_humano", "educacao_sofisticada"],
    recommendedObjectives: ["salvar", "compartilhar", "educar"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["Rotina ideal", "Checklist de prevenção", "Hábitos que protegem"],
    contraindications: ["Não ser genérico demais", "Sempre contextualizar"],
    icon: "🛡️",
    color: "bg-green-500/10 text-green-600",
  },
  {
    id: "bastidores",
    name: "Bastidores do Consultório",
    description: "Humaniza a marca mostrando o dia a dia e a realidade da prática médica",
    intent: "conexao",
    defaultPriority: "media",
    benchmarkAffinity: ["consultorio_humano"],
    recommendedObjectives: ["comentar", "compartilhar", "humanizar"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["Meu dia a dia", "O que não te contam", "Rotina real do consultório"],
    contraindications: ["Manter ética profissional", "Não expor pacientes"],
    icon: "🏥",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "comportamento_paciente",
    name: "Comportamento do Paciente",
    description: "Aborda padrões comportamentais e psicologia do paciente",
    intent: "engajamento",
    defaultPriority: "media",
    benchmarkAffinity: ["impacto_viral", "consultorio_humano"],
    recommendedObjectives: ["comentar", "compartilhar", "identificacao"],
    recommendedVisualStyles: ["travessia", "impacto"],
    subtopics: ["Por que pacientes desistem", "Medos mais comuns", "O que motiva adesão"],
    contraindications: ["Não generalizar", "Não ser paternalista"],
    icon: "🧠",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "protocolos",
    name: "Protocolos e Condutas",
    description: "Traduz protocolos médicos em linguagem acessível e relevante",
    intent: "autoridade",
    defaultPriority: "baixa",
    benchmarkAffinity: ["autoridade_premium", "educacao_sofisticada"],
    recommendedObjectives: ["educar", "salvar", "autoridade"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["Novo protocolo simplificado", "O que mudou na conduta", "Atualização científica"],
    contraindications: ["Não ser acadêmico demais", "Contextualizar para o leigo"],
    icon: "📋",
    color: "bg-slate-500/10 text-slate-600",
  },
  {
    id: "sintomas_ignorados",
    name: "Sintomas Ignorados",
    description: "Alerta para sinais que pacientes costumam negligenciar",
    intent: "autoridade",
    defaultPriority: "alta",
    benchmarkAffinity: ["impacto_viral", "autoridade_premium"],
    recommendedObjectives: ["salvar", "compartilhar", "educar"],
    recommendedVisualStyles: ["travessia", "impacto"],
    subtopics: ["Sinais de alerta", "Quando procurar ajuda", "O corpo está avisando"],
    contraindications: ["Não causar pânico", "Sempre orientar busca profissional"],
    icon: "🚨",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "qualidade_vida",
    name: "Qualidade de Vida",
    description: "Conteúdo sobre bem-estar, equilíbrio e melhora na qualidade de vida",
    intent: "conexao",
    defaultPriority: "media",
    benchmarkAffinity: ["consultorio_humano", "educacao_sofisticada"],
    recommendedObjectives: ["salvar", "compartilhar", "identificacao"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["Pequenas mudanças", "O impacto no dia a dia", "Viver melhor com"],
    contraindications: ["Não ser superficial", "Evitar clichês de wellness"],
    icon: "✨",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "transicao_tratamento",
    name: "Transição de Tratamento",
    description: "Orienta transições entre tratamentos, fases e expectativas",
    intent: "educar",
    defaultPriority: "baixa",
    benchmarkAffinity: ["autoridade_premium", "consultorio_humano"],
    recommendedObjectives: ["educar", "salvar", "conversao"],
    recommendedVisualStyles: ["editorial", "travessia"],
    subtopics: ["O que esperar no próximo passo", "Transição segura", "Depois do tratamento"],
    contraindications: ["Não criar falsas expectativas", "Ser transparente sobre riscos"],
    icon: "🔄",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    id: "conversao",
    name: "Conversão e Autoridade",
    description: "Conteúdo que posiciona o profissional como referência e gera agendamentos",
    intent: "conversao",
    defaultPriority: "baixa",
    benchmarkAffinity: ["autoridade_premium", "impacto_viral"],
    recommendedObjectives: ["conversao", "autoridade", "compartilhar"],
    recommendedVisualStyles: ["impacto", "editorial"],
    subtopics: ["Por que escolher este profissional", "Diferenciais do atendimento", "Resultados reais"],
    contraindications: ["Não ser vendedor", "Manter ética médica", "Sem antes/depois explícito"],
    icon: "🎯",
    color: "bg-rose-500/10 text-rose-600",
  },
];

/** Specialty-specific extra subtopics that enrich universal clusters */
const SPECIALTY_ENRICHMENTS: Record<string, Partial<Record<string, string[]>>> = {
  Dermatologia: {
    duvidas_frequentes: ["Protetor solar correto", "Cuidados com acne adulta", "Rotina de skincare"],
    erros_comuns: ["Esfoliar pele sensível", "Misturar ácidos sem orientação"],
    mitos_verdades: ["Chocolate causa acne?", "Pele oleosa não precisa hidratar?"],
    rotina_prevencao: ["Rotina anti-aging", "Proteção solar diária"],
  },
  Cardiologia: {
    sintomas_ignorados: ["Dor no peito atípica", "Cansaço desproporcional", "Palpitações frequentes"],
    erros_comuns: ["Parar medicação sem orientação", "Ignorar pressão alta"],
    rotina_prevencao: ["Check-up cardiovascular", "Exercício seguro"],
  },
  Pediatria: {
    duvidas_frequentes: ["Vacinas obrigatórias", "Introdução alimentar", "Sono do bebê"],
    comportamento_paciente: ["Medos da primeira consulta", "Como preparar a criança"],
    bastidores: ["Dia a dia do pediatra", "Casos que marcam"],
  },
  "Ginecologia e Obstetrícia": {
    duvidas_frequentes: ["Métodos contraceptivos", "Exames de rotina", "Sintomas na gravidez"],
    mitos_verdades: ["DIU causa infertilidade?", "Parto normal vs cesariana"],
    sintomas_ignorados: ["Sangramento irregular", "Cólica intensa"],
  },
  Endocrinologia: {
    duvidas_frequentes: ["Tireoide e ganho de peso", "Diabetes tipo 2 tem cura?"],
    erros_comuns: ["Dietas extremas", "Automedicação com hormônios"],
    protocolos: ["Novos critérios de diabetes", "Manejo de tireoide"],
  },
  "Cirurgia Plástica": {
    duvidas_frequentes: ["Expectativas realistas", "Recuperação pós-cirurgia"],
    erros_comuns: ["Escolher por preço", "Ignorar pré-operatório"],
    conversao: ["Diferenciais técnicos", "Abordagem personalizada"],
  },
  Psiquiatria: {
    mitos_verdades: ["Remédio vicia?", "Terapia é suficiente?"],
    comportamento_paciente: ["Resistência ao tratamento", "Estigma da medicação"],
    qualidade_vida: ["Saúde mental no dia a dia", "Higiene do sono"],
  },
  Nutrologia: {
    erros_comuns: ["Dietas da moda", "Suplementação sem necessidade"],
    mitos_verdades: ["Glúten faz mal?", "Jejum é para todos?"],
    rotina_prevencao: ["Alimentação preventiva", "Nutrientes essenciais"],
  },
};

export function getClustersForSpecialty(specialty: string): ClusterDefinition[] {
  const enrichments = SPECIALTY_ENRICHMENTS[specialty] || {};
  return UNIVERSAL_CLUSTERS.map((cluster) => {
    const extra = enrichments[cluster.id];
    if (!extra) return cluster;
    return {
      ...cluster,
      subtopics: [...cluster.subtopics, ...extra],
    };
  });
}

export function getClusterById(id: string): ClusterDefinition | undefined {
  return UNIVERSAL_CLUSTERS.find((c) => c.id === id);
}

export interface ClusterUsageStats {
  clusterId: string;
  usageCount: number;
  lastUsed: string | null;
  saturation: "subexplorado" | "equilibrado" | "saturado";
  potential: "alto" | "medio" | "baixo";
}

export function analyzeClusterUsage(
  clusters: ClusterDefinition[],
  usageCounts: Record<string, number>
): ClusterUsageStats[] {
  const totalUsage = Object.values(usageCounts).reduce((a, b) => a + b, 0);
  const avgUsage = totalUsage / Math.max(clusters.length, 1);

  return clusters.map((cluster) => {
    const count = usageCounts[cluster.id] || 0;
    let saturation: ClusterUsageStats["saturation"];
    if (count === 0) saturation = "subexplorado";
    else if (count > avgUsage * 1.8) saturation = "saturado";
    else saturation = "equilibrado";

    let potential: ClusterUsageStats["potential"];
    if (saturation === "subexplorado" && cluster.defaultPriority === "alta") potential = "alto";
    else if (saturation === "subexplorado") potential = "medio";
    else if (saturation === "saturado") potential = "baixo";
    else potential = "medio";

    return { clusterId: cluster.id, usageCount: count, lastUsed: null, saturation, potential };
  });
}

export { UNIVERSAL_CLUSTERS };
