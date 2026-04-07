import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";

const SYSTEM_PROMPT = `Você é um analista de métricas de Instagram para médicos. Analise os dados de performance fornecidos e identifique padrões, melhores horários, tipos de conteúdo mais eficazes e recomendações de otimização. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
1. Resumo geral de performance (alcance, engajamento, crescimento)
2. Análise por formato (carrosséis vs reels vs stories vs posts)
3. Melhores horários e dias para publicação
4. Temas e assuntos com melhor performance
5. Taxa de engajamento e comparação com benchmarks da especialidade
6. Análise de crescimento de seguidores
7. Recomendações de otimização priorizadas
8. Projeções e metas sugeridas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const { profile, metrics } = await req.json();

    const userPrompt = `Analise as métricas de Instagram do seguinte perfil médico:

Perfil:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

Dados de performance:
${JSON.stringify(metrics ?? [], null, 2)}

Forneça uma análise completa de performance com recomendações práticas de otimização.`;

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
