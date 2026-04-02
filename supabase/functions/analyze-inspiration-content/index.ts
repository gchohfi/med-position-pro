import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

/**
 * analyze-inspiration-content — Analysis ONLY (on verified profiles)
 *
 * Input:  { handles: string[], especialidade, objetivo? }
 * Output: { analises: [...], oportunidades_cruzadas: [...], tendencias_formato: "..." }
 *
 * This function ONLY accepts handles that the frontend has already verified.
 * It uses Perplexity for web research and Claude for structuring.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const body = await req.json();
    const { handles, especialidade, objetivo } = body;

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      throw new Error("Campo 'handles' é obrigatório (array de handles verificados)");
    }

    // Step 1: Research each handle via Perplexity (parallel)
    const researchResults = await Promise.all(
      handles.map(async (handle: string) => {
        const cleanHandle = handle.replace(/^@/, "");
        const query = `Analise a estratégia de conteúdo do perfil @${cleanHandle} no Instagram (profissional de ${especialidade ?? "saúde"}). Quais são os tópicos mais engajados? Quais formatos usa (carrossel, reels, stories)? Quais hooks/títulos funcionam melhor? Qual o estilo visual? Que gaps de conteúdo existem? Dê exemplos específicos de posts se possível.${objetivo ? ` Foco: ${objetivo}` : ""}`;

        const research = await callPerplexityText(perplexityKey, [
          { role: "user", content: query },
        ]);
        return { handle, research };
      }),
    );

    const allResearch = researchResults
      .map((r) => `### ${r.handle}\n${r.research}`)
      .join("\n\n---\n\n");

    // Step 2: Structure with Claude
    const systemPrompt = `Você é um especialista em estratégia de conteúdo médico no Instagram. Sua tarefa é criar uma análise estruturada dos perfis pesquisados e gerar ideias de conteúdo inspiradas. Responda APENAS com JSON válido, sem markdown ou texto extra.`;

    const userPrompt = `Com base na pesquisa abaixo sobre perfis médicos no Instagram, crie uma análise estruturada neste formato JSON exato:

{
  "analises": [
    {
      "handle": "@exemplo",
      "estrategia_resumo": "Resumo breve da estratégia de conteúdo",
      "topicos_mais_engajados": ["topico1", "topico2"],
      "formatos_eficazes": ["carrossel 7-10 slides", "reels < 30s"],
      "hooks_eficazes": ["Você sabia que...", "O erro mais comum..."],
      "estilo_visual": "Descrição do estilo visual",
      "gaps_conteudo": ["Não cobre X", "Pouco conteúdo sobre Y"],
      "ideias_inspiradas": [
        {
          "titulo": "Título da ideia de conteúdo",
          "formato": "carrossel",
          "tese": "Tese principal para este conteúdo",
          "por_que_funciona": "Por que essa ideia funcionaria"
        }
      ]
    }
  ],
  "oportunidades_cruzadas": ["Oportunidade cruzada 1", "Oportunidade cruzada 2"],
  "tendencias_formato": "Descrição das tendências de formato entre todos os perfis analisados"
}

Regras:
- Gere ao menos 3 ideias de conteúdo por perfil em "ideias_inspiradas"
- "formato" deve ser um de: "carrossel", "reels", "static", "stories"
- Escreva TODO o texto em português brasileiro
- Seja específico com hooks e tópicos, não genérico
- Cada "tese" deve ser uma tese completa que possa ser usada diretamente para criar conteúdo
- Foque em ideias ACIONÁVEIS que o médico pode produzir imediatamente

Dados da pesquisa:
${allResearch}`;

    const structured = await callClaude(anthropicKey, systemPrompt, userPrompt);

    return new Response(JSON.stringify(structured), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
