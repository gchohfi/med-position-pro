import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

const SYSTEM_PROMPT = `Você é um especialista em tendências de conteúdo médico no Instagram. A data de hoje é abril de 2026.

Você receberá dados de pesquisa REAL e ATUAL coletados agora via Perplexity sobre tendências de conteúdo médico no Instagram. Use esses dados como base factual para estruturar sua análise. Combine esses insights atuais com seu conhecimento sobre melhores práticas de content marketing médico.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
## 1. Tendências Gerais (Abril 2026)
Formatos, estilos e abordagens em alta agora.

## 2. Tendências da Especialidade
Específicas para a especialidade médica do usuário.

## 3. Formatos em Alta
Carrosséis, Reels, Stories, Lives, Collabs — qual está performando melhor e por quê.

## 4. Temas Emergentes e Pautas Quentes
Assuntos que estão gerando engajamento agora.

## 5. Oportunidades Sazonais
Campanhas de saúde, datas comemorativas e eventos relevantes para abril/maio 2026.

## 6. Recomendações Acionáveis
3 a 5 ideias de conteúdo trend-driven para as próximas semanas, prontas para implementar.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const { profile } = await req.json();

    const especialidade = profile.especialidade ?? "Medicina geral";

    let perplexityContext = "";
    if (perplexityKey) {
      try {
        const perplexityQuery = `Tendências de conteúdo médico para ${especialidade} no Instagram em abril de 2026. Quais são os formatos mais engajados? Quais temas estão em alta? Quais campanhas de saúde estão acontecendo agora? Quais estratégias de criadores médicos estão funcionando melhor?`;

        perplexityContext = await callPerplexityText(
          perplexityKey,
          [
            {
              role: "system",
              content: "Você é um assistente de pesquisa. Forneça dados atuais e precisos sobre tendências de conteúdo médico no Instagram.",
            },
            {
              role: "user",
              content: perplexityQuery,
            },
          ],
          "sonar",
          { search_recency_filter: "month" },
        );
      } catch (e) {
        console.log("[Perplexity] falhou, prosseguindo sem dados em tempo real:", e);
      }
    }

    const userPrompt = `Especialidade médica para análise de tendências: ${especialidade}

Contexto adicional do perfil:
Nome: ${profile.nome ?? "Não informado"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

${perplexityContext ? `--- DADOS DE PESQUISA ATUAL (Perplexity, abril 2026) ---\n${perplexityContext}\n--- FIM DOS DADOS DE PESQUISA ---\n\n` : ""}Usando os dados de pesquisa acima como base factual, identifique as principais tendências de conteúdo para esta especialidade no Instagram. Foque em oportunidades práticas e acionáveis para abril de 2026.`;

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
