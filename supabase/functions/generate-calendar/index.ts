import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CALENDAR_TOOL = {
  type: "function" as const,
  function: {
    name: "save_calendar",
    description: "Save a 30-day strategic editorial calendar for a medical professional",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "12-16 calendar items distributed strategically over 30 days",
          items: {
            type: "object",
            properties: {
              day_offset: { type: "number", description: "Day offset from today (0-29)" },
              title: { type: "string", description: "Content title, editorial and strategic" },
              content_type: {
                type: "string",
                enum: ["educativo", "manifesto", "hibrido", "conexao", "conversao"],
              },
              thesis: { type: "string", description: "Central thesis of the content piece" },
              strategic_objective: { type: "string", description: "Why this content exists strategically" },
              visual_direction: { type: "string", description: "Visual/format direction: carrossel, reels, post único, stories" },
              series_suggestion: { type: "string", description: "Suggested series name this could belong to, or empty" },
            },
            required: ["day_offset", "title", "content_type", "thesis", "strategic_objective", "visual_direction"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { positioning, specialty, series } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");

    const seriesContext = series?.length
      ? `\nSéries ativas do perfil:\n${series.map((s: any) => `- ${s.name} (${s.frequency}) — ${s.strategic_role}`).join("\n")}\nDistribua conteúdos dessas séries no calendário.`
      : "";

    const systemPrompt = `Você é um estrategista editorial sênior para posicionamento médico no Instagram.
Crie um calendário editorial estratégico de 30 dias para este profissional.

Regras:
- 12 a 16 peças de conteúdo distribuídas estrategicamente (não todos os dias)
- Distribua tipos variados: educativo, manifesto, híbrido, conexão, conversão
- Cada peça deve ter tese clara e objetivo estratégico
- Considere o ritmo ideal: 3-4 conteúdos por semana
- Alterne formatos visuais: carrossel, reels, post único, stories
- A distribuição deve reforçar posicionamento, não apenas frequência
- Linguagem consultiva em português brasileiro
- Se há séries ativas, distribua conteúdos dessas séries no calendário
${seriesContext}`;

    const userPrompt = `Especialidade: ${specialty || "Não informada"}
Arquétipo: ${positioning?.archetype || "Não definido"}
Tom de voz: ${positioning?.tone || "Não definido"}
Pilares editoriais: ${positioning?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}

Gere um calendário editorial estratégico de 30 dias.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [CALENDAR_TOOL],
        tool_choice: { type: "function", function: { name: "save_calendar" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Clear existing calendar items for this user
    await supabase.from("calendar_items").delete().eq("user_id", user.id);

    // Insert new items
    const today = new Date();
    const items = result.items.map((item: any) => {
      const date = new Date(today);
      date.setDate(date.getDate() + item.day_offset);
      return {
        user_id: user.id,
        date: date.toISOString().split("T")[0],
        title: item.title,
        content_type: item.content_type,
        thesis: item.thesis,
        strategic_objective: item.strategic_objective,
        visual_direction: item.visual_direction,
        status: "planejado",
      };
    });

    const { error: insertError } = await supabase.from("calendar_items").insert(items);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save calendar items");
    }

    return new Response(JSON.stringify({ items: result.items, saved: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-calendar error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
