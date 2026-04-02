import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";

const SYSTEM_PROMPT = `Você é um analista de inteligência competitiva para médicos no Instagram. Analise os concorrentes informados no contexto da especialidade do médico. Identifique padrões, diferenciais, lacunas exploráveis e oportunidades de posicionamento. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
1. Panorama competitivo da especialidade no Instagram
2. Análise individual de cada concorrente (posicionamento, forças, fraquezas)
3. Padrões de conteúdo identificados no nicho
4. Lacunas exploráveis (o que ninguém está fazendo)
5. Oportunidades de diferenciação para o médico
6. Estratégias recomendadas para se destacar`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile, concorrentes } = await req.json();

    const userPrompt = `Perfil do médico:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

Concorrentes para análise:
${JSON.stringify(concorrentes ?? [], null, 2)}

Realize uma análise competitiva completa, identificando como o médico pode se diferenciar neste cenário.`;

    const res = await callClaudeStream(apiKey, SYSTEM_PROMPT, userPrompt);
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
