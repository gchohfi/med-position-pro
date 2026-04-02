import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";

const RADAR_TOOL = {
  type: "function" as const,
  function: {
    name: "save_radar",
    description: "Save market radar analysis for a medical professional's segment",
    parameters: {
      type: "object",
      properties: {
        segment_summary: {
          type: "string",
          description: "2-3 paragraph premium editorial summary of what is happening in this medical segment's content landscape right now, enriched with real market data",
        },
        signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Signal headline" },
              description: { type: "string", description: "What was detected from real market research" },
              source_context: { type: "string", description: "Where this insight comes from (trend, news, competitor pattern)" },
              relevance: { type: "string", enum: ["alta", "media", "baixa"], description: "How relevant to the professional's positioning" },
            },
            required: ["title", "description", "source_context", "relevance"],
          },
          description: "3-6 real market signals detected via web research",
        },
        saturation: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "What is being repeated" },
              why_it_matters: { type: "string", description: "Why this weakens differentiation" },
              recommendation: { type: "string", description: "What to do instead" },
            },
            required: ["pattern", "why_it_matters", "recommendation"],
          },
          description: "3-5 saturation patterns detected in this segment",
        },
        opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              territory: { type: "string", description: "Underexplored editorial territory" },
              why_it_matters: { type: "string", description: "Why this is an opportunity now" },
              recommendation: { type: "string", description: "How to explore this territory" },
            },
            required: ["territory", "why_it_matters", "recommendation"],
          },
          description: "3-5 underexplored opportunities for differentiation",
        },
        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Alert headline" },
              description: { type: "string", description: "What was detected and why it matters" },
              urgency: { type: "string", enum: ["alta", "media", "baixa"], description: "How urgent this is" },
            },
            required: ["title", "description", "urgency"],
          },
          description: "2-4 strategic alerts about market movements",
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Recommendation title" },
              insight: { type: "string", description: "What is happening in the market" },
              action: { type: "string", description: "What MEDSHIFT recommends" },
              module: { type: "string", enum: ["estrategia", "series", "calendario", "producao"], description: "Which MEDSHIFT module to act on" },
            },
            required: ["title", "insight", "action", "module"],
          },
          description: "2-4 actionable strategic recommendations",
        },
      },
      required: ["segment_summary", "signals", "saturation", "opportunities", "alerts", "recommendations"],
    },
  },
};

async function searchPerplexity(query: string, apiKey: string): Promise<{ content: string; citations: string[] }> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a market research assistant for medical professionals' digital positioning. Return insights in Portuguese (Brazil). Be specific about trends, competitors, and content patterns.",
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity error:", response.status, errText);
      return { content: "", citations: [] };
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      citations: data.citations || [],
    };
  } catch (err) {
    console.error("Perplexity search failed:", err);
    return { content: "", citations: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const [posRes, profileRes, diagRes, seriesRes, contentRes] = await Promise.all([
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("specialty, full_name").eq("id", user.id).single(),
      supabase.from("diagnosis_outputs").select("diagnosis, estrategia").eq("user_id", user.id).maybeSingle(),
      supabase.from("series").select("name, strategic_role, frequency").eq("user_id", user.id),
      supabase.from("content_outputs").select("content_type, strategic_input, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    const positioning = posRes.data;
    const profile = profileRes.data;
    const diagnosis = diagRes.data?.diagnosis;
    const estrategia = diagRes.data?.estrategia;
    const series = seriesRes.data || [];
    const recentContent = contentRes.data || [];

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const specialty = profile?.specialty || "medicina";
    const archetype = positioning?.archetype || "";
    const pillars = positioning?.pillars?.join(", ") || "";

    let perplexityContext = "";
    let allCitations: string[] = [];

    if (PERPLEXITY_API_KEY) {
      console.log("Running Perplexity market research for:", specialty);

      const searches = await Promise.all([
        searchPerplexity(
          `Quais são as principais tendências de marketing digital e conteúdo no Instagram para médicos de ${specialty} no Brasil em 2025? Quais formatos estão performando melhor?`,
          PERPLEXITY_API_KEY
        ),
        searchPerplexity(
          `Quais médicos de ${specialty} no Brasil têm os perfis mais influentes no Instagram? Que tipo de conteúdo eles publicam? Quais padrões de saturação e oportunidades existem?`,
          PERPLEXITY_API_KEY
        ),
        searchPerplexity(
          `Tendências recentes de posicionamento digital para médicos no Brasil: novas regulamentações do CFM sobre publicidade médica, mudanças no algoritmo do Instagram, formatos de conteúdo emergentes`,
          PERPLEXITY_API_KEY
        ),
      ]);

      for (const search of searches) {
        if (search.content) {
          perplexityContext += search.content + "\n\n---\n\n";
        }
        allCitations.push(...search.citations);
      }

      allCitations = [...new Set(allCitations)];
      console.log(`Perplexity returned ${allCitations.length} unique citations`);
    } else {
      console.log("PERPLEXITY_API_KEY not available, proceeding without web research");
    }

    const contentTypes = recentContent.map((c: any) => c.content_type).join(", ");
    const seriesNames = series.map((s: any) => `${s.name} (${s.strategic_role})`).join(", ");

    const systemPrompt = `Você é o módulo de inteligência de mercado do MEDSHIFT — uma plataforma premium de posicionamento estratégico para médicos.

Sua função é analisar o segmento de atuação dessa profissional e gerar uma leitura estratégica do mercado editorial médico ao redor dela.

${perplexityContext ? `DADOS REAIS DE MERCADO (pesquisa web atual):
${perplexityContext}

Use estes dados reais para fundamentar sua análise. Cite tendências, concorrentes e padrões específicos encontrados na pesquisa.` : ""}

Regras:
- Linguagem consultiva, premium, editorial em português brasileiro
- Nunca genérico — sempre contextualizado à especialidade e posicionamento
- Foco em padrões de saturação (o que todos estão fazendo igual) e oportunidades (territórios pouco explorados)
- Os sinais de mercado devem refletir dados REAIS da pesquisa web quando disponíveis
- Recomendações devem ser acionáveis dentro do MEDSHIFT (estratégia, séries, calendário, produção)
- Evite tom alarmista ou superficial
- Pense como uma consultora editorial de alto nível

Use a ferramenta save_radar para estruturar a resposta.`;

    const userPrompt = `Especialidade: ${specialty}
Arquétipo: ${archetype || "Não definido"}
Tom de voz: ${positioning?.tone || "Não definido"}
Pilares editoriais: ${pillars || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}
Séries ativas: ${seriesNames || "Nenhuma"}
Tipos de conteúdo recentes: ${contentTypes || "Nenhum"}
Diagnóstico existente: ${diagnosis ? "Sim" : "Não"}
Estratégia existente: ${estrategia ? "Sim" : "Não"}

Gere uma leitura estratégica completa do mercado editorial médico para esta profissional, incluindo sinais reais de mercado, padrões de saturação, oportunidades de diferenciação, alertas estratégicos e recomendações acionáveis.`;

    const aiRes = await callGemini(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [RADAR_TOOL],
      tool_choice: { type: "function", function: { name: "save_radar" } },
      temperature: 0.7,
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const radar = JSON.parse(toolCall.function.arguments);

    const signalsData = {
      generated_at: new Date().toISOString(),
      perplexity_enabled: !!PERPLEXITY_API_KEY,
      citations: allCitations,
      market_signals: radar.signals || [],
    };

    const { data: existing } = await supabase
      .from("market_radar")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("market_radar")
        .update({
          segment_summary: radar.segment_summary,
          saturation: radar.saturation,
          opportunities: radar.opportunities,
          alerts: radar.alerts,
          recommendations: radar.recommendations,
          signals: signalsData,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("market_radar").insert({
        user_id: user.id,
        segment_summary: radar.segment_summary,
        saturation: radar.saturation,
        opportunities: radar.opportunities,
        alerts: radar.alerts,
        recommendations: radar.recommendations,
        signals: signalsData,
      });
    }

    return new Response(JSON.stringify({ success: true, radar: { ...radar, citations: allCitations } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Radar error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
