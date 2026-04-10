import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

/**
 * analyze-inspiration-content — Analyzes verified inspiration profiles
 *
 * Input:  { handles: string[], especialidade: string, objetivo?: string }
 * Output: AnalysisResult { analises, oportunidades_cruzadas, tendencias_formato }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const body = await req.json();
    const { handles, especialidade, objetivo } = body;

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      throw new Error("Campo 'handles' é obrigatório (array de handles)");
    }

    // Step 1: Research each profile via Perplexity
    const researchPromises = handles.map(async (rawHandle: string) => {
      const handle = rawHandle.replace(/^@/, "");
      const query = `Analise o perfil @${handle} no Instagram. Quais são os principais temas de conteúdo, formatos mais usados (carrossel, reels, stories), estilo visual, hooks de abertura mais eficazes, e quais posts parecem ter mais engajamento? Foque em conteúdo médico/saúde educativo.`;
      try {
        const text = await callPerplexityText(perplexityKey, [
          { role: "user", content: query },
        ], "sonar-pro");
        return { handle: rawHandle, research: text };
      } catch {
        return { handle: rawHandle, research: "Não foi possível pesquisar este perfil." };
      }
    });

    const researchResults = await Promise.all(researchPromises);

    // Step 2: Send combined research to Claude for structured analysis
    const combinedResearch = researchResults
      .map((r) => `### @${r.handle}\n${r.research}`)
      .join("\n\n---\n\n");

    const systemPrompt = `Você é um analista de conteúdo médico no Instagram. Analise os dados de pesquisa e retorne uma análise estruturada. Responda APENAS com JSON válido.`;

    const userPrompt = `Analise os perfis de inspiração abaixo e retorne o resultado no formato JSON especificado.

Especialidade do usuário: ${especialidade || "Medicina"}
Objetivo: ${objetivo || "Extrair ideias de conteúdo"}

## PESQUISA DOS PERFIS
${combinedResearch}

## FORMATO DE RESPOSTA (obrigatório)
{
  "analises": [
    {
      "handle": "@handle_do_perfil",
      "estrategia_resumo": "Resumo da estratégia de conteúdo do perfil em 1-2 frases",
      "topicos_mais_engajados": ["tópico1", "tópico2", "tópico3"],
      "formatos_eficazes": ["carrossel", "reels"],
      "hooks_eficazes": ["Exemplo de hook 1", "Exemplo de hook 2"],
      "estilo_visual": "Descrição do estilo visual predominante",
      "gaps_conteudo": ["Gap 1 que o perfil não explora", "Gap 2"],
      "ideias_inspiradas": [
        {
          "titulo": "Título da ideia de conteúdo",
          "formato": "carrossel",
          "tese": "Tese central da ideia",
          "por_que_funciona": "Por que esta ideia tende a engajar"
        }
      ]
    }
  ],
  "oportunidades_cruzadas": [
    "Oportunidade identificada comparando os perfis analisados"
  ],
  "tendencias_formato": "Resumo das tendências de formato observadas entre os perfis"
}

REGRAS:
- Um objeto em "analises" para cada perfil pesquisado
- 3-5 ideias_inspiradas por perfil
- 2-5 oportunidades_cruzadas (compare os perfis entre si)
- Formatos de ideias: "carrossel", "reels", "stories", "post_unico"
- Se não tiver dados suficientes de um perfil, inclua-o mesmo assim com o que tiver
- Tudo em PT-BR`;

    const result = await callClaude("", systemPrompt, userPrompt);

    // Validate the result has the expected shape
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    if (!parsed.analises || !Array.isArray(parsed.analises)) {
      throw new Error("Resposta da IA em formato inesperado");
    }

    // Ensure arrays have defaults
    for (const analise of parsed.analises) {
      analise.topicos_mais_engajados = analise.topicos_mais_engajados || [];
      analise.formatos_eficazes = analise.formatos_eficazes || [];
      analise.hooks_eficazes = analise.hooks_eficazes || [];
      analise.gaps_conteudo = analise.gaps_conteudo || [];
      analise.ideias_inspiradas = analise.ideias_inspiradas || [];
    }
    parsed.oportunidades_cruzadas = parsed.oportunidades_cruzadas || [];
    parsed.tendencias_formato = parsed.tendencias_formato || "";

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
