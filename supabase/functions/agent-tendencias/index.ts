import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";

const SYSTEM_PROMPT = `Você é um especialista em tendências de conteúdo médico no Instagram. Identifique tendências atuais, formatos em alta, temas emergentes e oportunidades sazonais para a especialidade do médico. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
1. Tendências gerais de conteúdo médico no Instagram (formatos, estilos, abordagens)
2. Tendências específicas da especialidade
3. Formatos em alta (carrosséis, reels, stories, lives, collabs)
4. Temas emergentes e pautas quentes
5. Oportunidades sazonais (datas comemorativas, campanhas de saúde)
6. Recomendações de conteúdo trend-driven para as próximas semanas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile } = await req.json();

    const userPrompt = `Especialidade médica para análise de tendências: ${profile.especialidade ?? "Medicina geral"}

Contexto adicional do perfil:
Nome: ${profile.nome ?? "Não informado"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

Identifique as principais tendências de conteúdo para esta especialidade no Instagram, com foco em oportunidades práticas e acionáveis.`;

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
