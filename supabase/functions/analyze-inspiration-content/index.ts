import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";
import { sanitizeInput, sanitizeArray } from "../_shared/sanitize.ts";

/**
 * analyze-inspiration-content — Analyzes inspiration profiles for content ideas
 *
 * Input:  { handles: string[], especialidade?: string, objetivo?: string }
 * Output: {
 *   analises: ProfileAnalysis[],
 *   oportunidades_cruzadas: string[],
 *   tendencias_formato: string
 * }
 *
 * Uses Perplexity to research each handle's content strategy, then Claude
 * to structure the analysis. Falls back to heuristic analysis if API keys
 * are missing.
 */

interface ProfileAnalysis {
  handle: string;
  estrategia_resumo: string;
  topicos_mais_engajados: string[];
  formatos_eficazes: string[];
  hooks_eficazes: string[];
  estilo_visual: string;
  gaps_conteudo: string[];
  ideias_inspiradas: Array<{
    titulo: string;
    formato: string;
    tese: string;
    por_que_funciona: string;
  }>;
}

interface AnalysisResult {
  analises: ProfileAnalysis[];
  oportunidades_cruzadas: string[];
  tendencias_formato: string;
}

function buildFallbackAnalysis(handles: string[], especialidade: string): AnalysisResult {
  const analises: ProfileAnalysis[] = handles.map((handle) => ({
    handle,
    estrategia_resumo: `Perfil ${handle} atua na area de ${especialidade || "saude"}. Analise completa requer configuracao das chaves de API (ANTHROPIC_API_KEY ou PERPLEXITY_API_KEY).`,
    topicos_mais_engajados: ["Dicas praticas", "Mitos e verdades", "Bastidores do consultorio"],
    formatos_eficazes: ["Carrossel educativo", "Reels curtos", "Stories interativos"],
    hooks_eficazes: ["Voce sabia que...?", "O erro mais comum e...", "3 sinais de que..."],
    estilo_visual: "Nao foi possivel analisar sem API configurada",
    gaps_conteudo: ["Conteudo com dados cientificos", "Comparativos antes/depois", "Colaboracoes com outros profissionais"],
    ideias_inspiradas: [
      {
        titulo: `Mitos sobre ${especialidade || "saude"} que ${handle} quebraria`,
        formato: "carrossel",
        tese: `Existem mitos comuns sobre ${especialidade || "saude"} que precisam ser desmistificados`,
        por_que_funciona: "Conteudo de mitos gera alto engajamento por despertar curiosidade e corrigir crencas",
      },
    ],
  }));

  return {
    analises,
    oportunidades_cruzadas: [
      "Todos os perfis investem em conteudo educativo — oportunidade de se diferenciar com formato narrativo",
      "Poucos usam dados cientificos nos carrosseis — nicho de autoridade disponivel",
    ],
    tendencias_formato: "Carrosseis educativos com 7-10 slides e Reels curtos (15-30s) sao os formatos dominantes entre os perfis analisados.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const handles = sanitizeArray(body.handles, 10, 100).filter(Boolean);
    const especialidade = sanitizeInput(body.especialidade, 200);
    const objetivo = sanitizeInput(body.objetivo, 500);

    if (handles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Informe ao menos um handle para analisar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    // If no AI keys configured, return heuristic fallback
    if (!ANTHROPIC_API_KEY) {
      const fallback = buildFallbackAnalysis(handles, especialidade);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Research each handle via Perplexity (if available)
    let researchContext = "";
    if (PERPLEXITY_API_KEY) {
      try {
        const query = `Analise o conteudo dos seguintes perfis de Instagram medico: ${handles.join(", ")}. Para cada perfil, descreva: estrategia de conteudo, topicos mais engajados, formatos preferidos (carrossel, reels, stories), estilo visual, e hooks/ganchos mais eficazes. Especialidade: ${especialidade || "medicina"}.`;

        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "Voce e um analista de conteudo medico no Instagram. Responda com dados factuais sobre os perfis solicitados." },
              { role: "user", content: query },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          researchContext = data?.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.warn("Perplexity research failed, continuing with Claude only:", err);
      }
    }

    // Step 2: Structure analysis via Claude
    const systemPrompt = `Voce e um estrategista de conteudo para medicos no Instagram.
Analise os perfis de inspiracao e retorne APENAS um JSON valido no formato:
{
  "analises": [
    {
      "handle": "@usuario",
      "estrategia_resumo": "Resumo da estrategia de conteudo do perfil",
      "topicos_mais_engajados": ["topico1", "topico2"],
      "formatos_eficazes": ["Carrossel", "Reels"],
      "hooks_eficazes": ["Voce sabia...", "O erro mais comum..."],
      "estilo_visual": "Descricao do estilo visual",
      "gaps_conteudo": ["Oportunidade nao explorada 1"],
      "ideias_inspiradas": [
        {
          "titulo": "Titulo da ideia",
          "formato": "carrossel",
          "tese": "Tese central da ideia",
          "por_que_funciona": "Razao pela qual funciona"
        }
      ]
    }
  ],
  "oportunidades_cruzadas": ["Oportunidade identificada entre todos os perfis"],
  "tendencias_formato": "Resumo das tendencias de formato entre os perfis analisados"
}

Regras:
- Gere 2-3 ideias_inspiradas por perfil
- As ideias devem ser adaptaveis para a especialidade do usuario
- oportunidades_cruzadas: insights que cruzam todos os perfis analisados (3-5 itens)
- tendencias_formato: paragrafo curto sobre tendencias de formato observadas
- Retorne APENAS o JSON, sem markdown ou texto adicional`;

    const userPrompt = `Perfis para analisar: ${handles.join(", ")}
Especialidade do usuario: ${especialidade || "medicina"}
Objetivo: ${objetivo || "extrair ideias de conteudo para carrossel e reels"}
${researchContext ? `\nPesquisa sobre os perfis:\n${researchContext}` : ""}

Analise cada perfil e gere ideias de conteudo inspiradas neles.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          { role: "user", content: userPrompt },
        ],
        system: systemPrompt,
      }),
    });

    if (!claudeRes.ok) {
      console.error("Claude API error:", claudeRes.status, await claudeRes.text());
      // Fallback if Claude fails
      const fallback = buildFallbackAnalysis(handles, especialidade);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeData = await claudeRes.json();
    const content = claudeData?.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    let result: AnalysisResult;
    try {
      // Try direct parse first
      result = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown fences
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        console.error("Failed to parse Claude response:", content.slice(0, 500));
        result = buildFallbackAnalysis(handles, especialidade);
      }
    }

    // Validate shape
    if (!Array.isArray(result.analises)) {
      result = buildFallbackAnalysis(handles, especialidade);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-inspiration-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
