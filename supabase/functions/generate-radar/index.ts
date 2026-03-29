import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
          description: "2-3 paragraph premium editorial summary of what is happening in this medical segment's content landscape right now",
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
      required: ["segment_summary", "saturation", "opportunities", "alerts", "recommendations"],
    },
  },
};

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Gather all user context
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contentTypes = recentContent.map((c: any) => c.content_type).join(", ");
    const seriesNames = series.map((s: any) => `${s.name} (${s.strategic_role})`).join(", ");

    const systemPrompt = `Você é o módulo de inteligência de mercado do MEDSHIFT — uma plataforma premium de posicionamento estratégico para médicos.

Sua função é analisar o segmento de atuação dessa profissional e gerar uma leitura estratégica do mercado editorial médico ao redor dela.

Regras:
- Linguagem consultiva, premium, editorial em português brasileiro
- Nunca genérico — sempre contextualizado à especialidade e posicionamento
- Foco em padrões de saturação (o que todos estão fazendo igual) e oportunidades (territórios pouco explorados)
- Recomendações devem ser acionáveis dentro do MEDSHIFT (estratégia, séries, calendário, produção)
- Evite tom alarmista ou superficial
- Pense como uma consultora editorial de alto nível

Use a ferramenta save_radar para estruturar a resposta.`;

    const userPrompt = `Especialidade: ${profile?.specialty || "Não informada"}
Arquétipo: ${positioning?.archetype || "Não definido"}
Tom de voz: ${positioning?.tone || "Não definido"}
Pilares editoriais: ${positioning?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}
Séries ativas: ${seriesNames || "Nenhuma"}
Tipos de conteúdo recentes: ${contentTypes || "Nenhum"}
Diagnóstico existente: ${diagnosis ? "Sim" : "Não"}
Estratégia existente: ${estrategia ? "Sim" : "Não"}

Gere uma leitura estratégica completa do mercado editorial médico para esta profissional, incluindo padrões de saturação, oportunidades de diferenciação, alertas estratégicos e recomendações acionáveis.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [RADAR_TOOL],
        tool_choice: { type: "function", function: { name: "save_radar" } },
        temperature: 0.7,
      }),
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

    // Upsert radar data
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
          signals: { generated_at: new Date().toISOString() },
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
        signals: { generated_at: new Date().toISOString() },
      });
    }

    return new Response(JSON.stringify({ success: true, radar }), {
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
