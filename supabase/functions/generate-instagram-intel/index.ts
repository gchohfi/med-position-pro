import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Tool schema for structured AI output — Instagram Intelligence Report
 */
const INSTAGRAM_INTEL_TOOL = {
  type: "function" as const,
  function: {
    name: "save_instagram_intel",
    description:
      "Save a comprehensive Instagram intelligence analysis for a medical professional",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "2-3 paragraph premium editorial summary of the Instagram landscape analysis, covering the user's own performance and competitor patterns",
        },
        trends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Trend headline" },
              description: {
                type: "string",
                description: "What this trend is about and why it matters",
              },
              format_type: {
                type: "string",
                enum: [
                  "carrossel",
                  "reels",
                  "stories",
                  "post_unico",
                  "collab",
                  "misto",
                ],
                description: "Primary content format associated with this trend",
              },
              relevance: {
                type: "string",
                enum: ["alta", "media", "baixa"],
                description: "How relevant to the professional's positioning",
              },
              examples: {
                type: "string",
                description:
                  "Concrete examples from analyzed profiles that illustrate this trend",
              },
            },
            required: [
              "title",
              "description",
              "format_type",
              "relevance",
              "examples",
            ],
          },
          description: "4-6 Instagram trends detected in the medical niche",
        },
        competitor_insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              username: {
                type: "string",
                description: "Instagram handle of the competitor",
              },
              strengths: {
                type: "string",
                description:
                  "What this profile does well — content, layout, engagement tactics",
              },
              weaknesses: {
                type: "string",
                description: "Where this profile falls short or is generic",
              },
              signature_pattern: {
                type: "string",
                description:
                  "The distinctive visual/editorial pattern that defines this profile",
              },
              what_to_absorb: {
                type: "string",
                description:
                  "Specific elements worth adapting (not copying) for the user's brand",
              },
              what_to_avoid: {
                type: "string",
                description:
                  "Patterns to consciously avoid to maintain differentiation",
              },
            },
            required: [
              "username",
              "strengths",
              "weaknesses",
              "signature_pattern",
              "what_to_absorb",
              "what_to_avoid",
            ],
          },
          description: "Analysis of each tracked competitor profile",
        },
        performance_analysis: {
          type: "object",
          properties: {
            overall_assessment: {
              type: "string",
              description:
                "General assessment of the user's own Instagram performance",
            },
            top_performing_formats: {
              type: "string",
              description:
                "Which content formats are generating the most engagement",
            },
            underperforming_areas: {
              type: "string",
              description: "Areas where content is not resonating",
            },
            engagement_patterns: {
              type: "string",
              description:
                "Patterns in what drives engagement (timing, topics, formats)",
            },
            growth_opportunities: {
              type: "string",
              description:
                "Specific opportunities to grow based on current performance data",
            },
          },
          required: [
            "overall_assessment",
            "top_performing_formats",
            "underperforming_areas",
            "engagement_patterns",
            "growth_opportunities",
          ],
          description:
            "Analysis of the user's own Instagram performance (if data available)",
        },
        visual_suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              suggestion_type: {
                type: "string",
                enum: ["layout", "paleta", "tipografia", "formato", "estilo_foto"],
                description: "Category of the visual suggestion",
              },
              title: { type: "string", description: "Suggestion headline" },
              description: {
                type: "string",
                description:
                  "Detailed description of the visual suggestion, respecting the user's current brand identity",
              },
              inspiration_source: {
                type: "string",
                description:
                  "Which competitor or trend inspired this suggestion",
              },
              adaptation_note: {
                type: "string",
                description:
                  "How to adapt this to the user's existing visual identity without losing brand consistency",
              },
            },
            required: [
              "suggestion_type",
              "title",
              "description",
              "inspiration_source",
              "adaptation_note",
            ],
          },
          description:
            "3-5 visual/layout suggestions adapted to the user's brand identity",
        },
        content_patterns: {
          type: "object",
          properties: {
            what_works: {
              type: "string",
              description:
                "Content patterns that consistently perform well in this niche",
            },
            what_fails: {
              type: "string",
              description:
                "Content patterns that consistently underperform or feel generic",
            },
            emerging_formats: {
              type: "string",
              description:
                "New content formats gaining traction that the user should consider",
            },
            optimal_frequency: {
              type: "string",
              description:
                "Recommended posting frequency based on competitor analysis",
            },
            best_hooks: {
              type: "string",
              description:
                "Types of hooks and opening patterns that capture attention in this niche",
            },
          },
          required: [
            "what_works",
            "what_fails",
            "emerging_formats",
            "optimal_frequency",
            "best_hooks",
          ],
          description: "Content pattern analysis across the tracked profiles",
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Recommendation title" },
              insight: {
                type: "string",
                description: "What was detected from the analysis",
              },
              action: {
                type: "string",
                description: "Specific actionable step to take",
              },
              priority: {
                type: "string",
                enum: ["alta", "media", "baixa"],
                description: "Priority level",
              },
              module: {
                type: "string",
                enum: [
                  "estrategia",
                  "series",
                  "calendario",
                  "producao",
                  "radar",
                ],
                description: "Which MEDSHIFT module to act on",
              },
            },
            required: ["title", "insight", "action", "priority", "module"],
          },
          description: "3-5 actionable strategic recommendations",
        },
      },
      required: [
        "summary",
        "trends",
        "competitor_insights",
        "performance_analysis",
        "visual_suggestions",
        "content_patterns",
        "recommendations",
      ],
    },
  },
};

/**
 * Search Perplexity for real-time Instagram intelligence
 */
async function searchPerplexity(
  query: string,
  apiKey: string
): Promise<{ content: string; citations: string[] }> {
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
            content:
              "You are an Instagram strategy analyst for medical professionals in Brazil. Return insights in Portuguese (Brazil). Be specific about content patterns, engagement metrics, visual trends, and competitor strategies.",
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "week",
      }),
    });

    if (!response.ok) {
      console.error("Perplexity error:", response.status);
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Parse request body — may contain profile data collected from the frontend
    const body = await req.json().catch(() => ({}));
    const {
      own_profile_data,
      own_posts_data,
      competitor_profiles_data,
    } = body;

    // Gather user context from existing MEDSHIFT data
    const [posRes, profileRes, diagRes, trackedRes] = await Promise.all([
      supabase
        .from("positioning")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("specialty, full_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("diagnosis_outputs")
        .select("diagnosis, estrategia")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("instagram_tracked_profiles")
        .select("*")
        .eq("user_id", user.id),
    ]);

    const positioning = posRes.data;
    const profile = profileRes.data;
    const diagnosis = diagRes.data;
    const trackedProfiles = trackedRes.data || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const specialty = profile?.specialty || "medicina";
    const archetype = positioning?.archetype || "";
    const pillars = positioning?.pillars?.join(", ") || "";
    const tone = positioning?.tone || "";
    const competitorUsernames = trackedProfiles
      .filter((p: any) => p.profile_type === "competitor")
      .map((p: any) => p.username);

    // Run Perplexity searches for real-time Instagram intelligence
    let perplexityContext = "";
    let allCitations: string[] = [];

    if (PERPLEXITY_API_KEY) {
      console.log("Running Perplexity Instagram research for:", specialty);

      const searches = await Promise.all([
        searchPerplexity(
          `Quais são as tendências de conteúdo no Instagram para médicos de ${specialty} no Brasil em 2025? Quais formatos (carrossel, reels, stories) estão performando melhor? Que tipo de layout e design visual está em alta?`,
          PERPLEXITY_API_KEY
        ),
        searchPerplexity(
          `Análise de perfis de médicos de ${specialty} no Instagram Brasil: padrões de conteúdo que geram mais engajamento, frequência ideal de postagem, tipos de ganchos que funcionam, erros comuns que reduzem alcance`,
          PERPLEXITY_API_KEY
        ),
        ...(competitorUsernames.length > 0
          ? [
              searchPerplexity(
                `Análise dos perfis de Instagram: ${competitorUsernames.join(", ")}. Que tipo de conteúdo publicam? Qual o estilo visual? Quais padrões de engajamento? O que os diferencia no nicho de ${specialty}?`,
                PERPLEXITY_API_KEY
              ),
            ]
          : []),
      ]);

      for (const search of searches) {
        if (search.content) {
          perplexityContext += search.content + "\n\n---\n\n";
        }
        allCitations.push(...search.citations);
      }
      allCitations = [...new Set(allCitations)];
    }

    // Build context strings from frontend-provided Instagram data
    let ownProfileContext = "";
    if (own_profile_data) {
      ownProfileContext = `
DADOS DO PERFIL PRÓPRIO DO INSTAGRAM:
- Username: ${own_profile_data.username || "N/A"}
- Seguidores: ${own_profile_data.followers_count || "N/A"}
- Seguindo: ${own_profile_data.follows_count || "N/A"}
- Posts: ${own_profile_data.media_count || "N/A"}
- Bio: ${own_profile_data.biography || "N/A"}
`;
    }

    let ownPostsContext = "";
    if (own_posts_data && Array.isArray(own_posts_data) && own_posts_data.length > 0) {
      ownPostsContext = `
POSTS RECENTES DO PERFIL PRÓPRIO (${own_posts_data.length} posts):
${own_posts_data
  .map(
    (p: any, i: number) =>
      `${i + 1}. Tipo: ${p.media_type || "N/A"} | Likes: ${p.like_count || 0} | Comentários: ${p.comments_count || 0} | Legenda: ${(p.caption || "").substring(0, 120)}...`
  )
  .join("\n")}
`;
    }

    let competitorContext = "";
    if (
      competitor_profiles_data &&
      Array.isArray(competitor_profiles_data) &&
      competitor_profiles_data.length > 0
    ) {
      competitorContext = `
DADOS DOS PERFIS CONCORRENTES MONITORADOS:
${competitor_profiles_data
  .map(
    (c: any) =>
      `- @${c.username}: ${c.followers_count || "?"} seguidores | ${c.media_count || "?"} posts | Bio: ${(c.bio || "").substring(0, 100)}`
  )
  .join("\n")}
`;
    }

    const systemPrompt = `Você é o módulo de Inteligência do Instagram do MEDSHIFT — uma plataforma premium de posicionamento estratégico para médicos.

Sua função é analisar o ecossistema do Instagram dessa profissional médica: seu próprio perfil, os perfis de concorrentes/referências que ela monitora, e as tendências do nicho.

${perplexityContext ? `DADOS REAIS DE PESQUISA WEB (Instagram trends):
${perplexityContext}

Use estes dados reais para fundamentar sua análise.` : ""}

${ownProfileContext}
${ownPostsContext}
${competitorContext}

Regras:
- Linguagem consultiva, premium, editorial em português brasileiro
- NUNCA genérico — sempre contextualizado à especialidade, posicionamento e identidade visual da profissional
- Sugestões visuais devem RESPEITAR e ADAPTAR o padrão visual que a pessoa já usa, propondo evoluções (não mudanças radicais)
- Análise de concorrentes deve ser construtiva: o que absorver (adaptar) vs. o que evitar (para manter diferenciação)
- Foco em padrões que FUNCIONAM vs. padrões que NÃO FUNCIONAM no Instagram médico
- Recomendações devem ser acionáveis dentro do MEDSHIFT (estratégia, séries, calendário, produção, radar)
- Pense como uma consultora de Instagram de alto nível especializada em médicos

Use a ferramenta save_instagram_intel para estruturar a resposta.`;

    const userPrompt = `Especialidade: ${specialty}
Arquétipo: ${archetype || "Não definido"}
Tom de voz: ${tone || "Não definido"}
Pilares editoriais: ${pillars || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}
Perfis concorrentes monitorados: ${competitorUsernames.length > 0 ? competitorUsernames.map((u: string) => "@" + u).join(", ") : "Nenhum cadastrado"}
Diagnóstico existente: ${diagnosis ? "Sim" : "Não"}
Estratégia existente: ${diagnosis?.estrategia ? "Sim" : "Não"}

Gere uma análise completa de inteligência do Instagram para esta profissional, incluindo:
1. Tendências de conteúdo e formato no nicho
2. Análise detalhada de cada perfil concorrente monitorado
3. Avaliação de performance do perfil próprio (se dados disponíveis)
4. Sugestões visuais adaptadas à identidade visual existente
5. Padrões de conteúdo (o que funciona vs. o que não funciona)
6. Recomendações estratégicas acionáveis`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [INSTAGRAM_INTEL_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "save_instagram_intel" },
          },
          temperature: 0.7,
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const intel = JSON.parse(toolCall.function.arguments);

    // Store the analysis
    const { data: existing } = await supabase
      .from("instagram_analyses")
      .select("id")
      .eq("user_id", user.id)
      .eq("analysis_type", "full")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const analysisPayload = {
      user_id: user.id,
      analysis_type: "full" as const,
      summary: intel.summary,
      trends: intel.trends || [],
      competitor_insights: intel.competitor_insights || [],
      performance_analysis: intel.performance_analysis || {},
      visual_suggestions: intel.visual_suggestions || [],
      content_patterns: intel.content_patterns || {},
      recommendations: intel.recommendations || [],
      raw_data: {
        generated_at: new Date().toISOString(),
        perplexity_enabled: !!PERPLEXITY_API_KEY,
        citations: allCitations,
        profiles_analyzed: competitorUsernames,
        own_profile_included: !!own_profile_data,
      },
    };

    if (existing) {
      await supabase
        .from("instagram_analyses")
        .update(analysisPayload)
        .eq("id", existing.id);
    } else {
      await supabase.from("instagram_analyses").insert(analysisPayload);
    }

    return new Response(
      JSON.stringify({
        success: true,
        intel: { ...intel, citations: allCitations },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Instagram Intel error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
