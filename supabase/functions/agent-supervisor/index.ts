import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";

const SYSTEM_PROMPT = `Você é o supervisor do squad de IA médica para Instagram. Sintetize as análises disponíveis e forneça um panorama estratégico integrado com prioridades de ação. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Como supervisor, você deve:
1. Integrar as análises de todos os agentes (perfil, concorrência, tendências, estratégia, métricas)
2. Identificar convergências e divergências entre as análises
3. Priorizar ações com base no impacto esperado
4. Criar um plano de ação consolidado com timeline
5. Destacar quick wins (ações de alto impacto e baixo esforço)
6. Apontar riscos e pontos de atenção
7. Definir próximos passos concretos`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const { profile, analyses } = await req.json();

    const analysisSections: string[] = [];
    if (analyses?.perfil) analysisSections.push(`ANÁLISE DE PERFIL:\n${analyses.perfil}`);
    if (analyses?.concorrencia) analysisSections.push(`ANÁLISE DE CONCORRÊNCIA:\n${analyses.concorrencia}`);
    if (analyses?.tendencias) analysisSections.push(`ANÁLISE DE TENDÊNCIAS:\n${analyses.tendencias}`);
    if (analyses?.estrategia) analysisSections.push(`PLANO ESTRATÉGICO:\n${analyses.estrategia}`);
    if (analyses?.metricas) analysisSections.push(`ANÁLISE DE MÉTRICAS:\n${analyses.metricas}`);

    const userPrompt = `Perfil do médico:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

ANÁLISES DISPONÍVEIS DO SQUAD:
${analysisSections.length > 0 ? analysisSections.join("\n\n---\n\n") : "Nenhuma análise disponível ainda."}

Sintetize todas as análises acima em um panorama estratégico integrado. Priorize as ações mais importantes e crie um plano de ação consolidado.`;

    const res = await callClaudeStream("", SYSTEM_PROMPT, userPrompt);
    const stream = buildAnthropicStream(res);

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
