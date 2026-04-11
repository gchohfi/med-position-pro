import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini, errorResponse } from "../_shared/gemini.ts";

/* ── Benchmark presets for the AI prompt ─── */

const PRESET_DESCRIPTIONS = `
## BENCHMARK PRESETS DISPONÍVEIS (use EXATAMENTE estes IDs)
1. "impacto_viral" — Tom provocativo, gancho forte, retenção máxima, headlines curtas, CTA provocativo
2. "autoridade_premium" — Tom sofisticado, marca pessoal forte, visual editorial, CTA refinado
3. "educacao_sofisticada" — Tom didático, clareza com elegância, conteúdo salvável, CTA acolhedor
4. "consultorio_humano" — Tom acolhedor, empatia, linguagem consultiva, CTA íntimo
`;

const OBJETIVO_DESCRIPTIONS = `
## OBJETIVOS ESTRATÉGICOS (use EXATAMENTE estes IDs)
- "educar" — Conteúdo educativo, gerar salvamentos
- "salvar" — Conteúdo altamente salvável
- "comentar" — Provocar comentários e engajamento
- "conversao" — Conversão, agendamento, consulta
`;

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
              benchmark_preset: {
                type: "string",
                enum: ["impacto_viral", "autoridade_premium", "educacao_sofisticada", "consultorio_humano"],
                description: "Benchmark preset for this content piece",
              },
              objetivo: {
                type: "string",
                enum: ["educar", "salvar", "comentar", "conversao"],
                description: "Strategic objective type",
              },
              series_suggestion: { type: "string", description: "Suggested series name this could belong to, or empty" },
            },
            required: ["day_offset", "title", "content_type", "thesis", "strategic_objective", "visual_direction", "benchmark_preset", "objetivo"],
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
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const { positioning, specialty, series, usedTopics, usedPresets, memoryHints } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const seriesContext = series?.length
      ? `\nSéries ativas do perfil:\n${series.map((s: any) => `- ${s.name} (${s.frequency}) — ${s.strategic_role}`).join("\n")}\nDistribua conteúdos dessas séries no calendário.`
      : "";

    const usedTopicsContext = usedTopics?.length
      ? `\n\n## TEMAS JÁ UTILIZADOS (evite repetição excessiva)\n${usedTopics.slice(0, 20).map((t: string) => `- ${t}`).join("\n")}`
      : "";

    const usedPresetsContext = usedPresets?.length
      ? `\n\n## PRESETS MAIS USADOS (diversifique)\n${usedPresets.map((p: string) => `- ${p}`).join("\n")}`
      : "";

    const memoryContext = memoryHints
      ? `\n\n## MEMÓRIA ESTRATÉGICA DA MÉDICA\n${memoryHints}`
      : "";

    const systemPrompt = `Você é um estrategista editorial sênior para posicionamento médico no Instagram.
Crie um calendário editorial estratégico de 30 dias para este profissional.

${PRESET_DESCRIPTIONS}

${OBJETIVO_DESCRIPTIONS}

Regras:
- 12 a 16 peças de conteúdo distribuídas estrategicamente (não todos os dias)
- Distribua tipos variados: educativo, manifesto, híbrido, conexão, conversão
- Cada peça deve ter tese clara e objetivo estratégico
- Considere o ritmo ideal: 3-4 conteúdos por semana
- Alterne formatos visuais: carrossel, reels, post único, stories
- A distribuição deve reforçar posicionamento, não apenas frequência
- Linguagem consultiva em português brasileiro
- Se há séries ativas, distribua conteúdos dessas séries no calendário

## REGRAS DE DIVERSIFICAÇÃO
- NÃO repita o mesmo benchmark_preset mais que 4 vezes em 30 dias
- NÃO use o mesmo objetivo mais que 5 vezes em 30 dias
- Alterne entre presets provocativos e acolhedores
- Intercale conteúdo de autoridade com conteúdo de conexão
- A sequência visual não pode ter 3 carrosséis seguidos sem variação
${seriesContext}${usedTopicsContext}${usedPresetsContext}${memoryContext}`;

    const userPrompt = `Especialidade: ${specialty || "Não informada"}
Arquétipo: ${positioning?.archetype || "Não definido"}
Tom de voz: ${positioning?.tone || "Não definido"}
Pilares editoriais: ${positioning?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}

Gere um calendário editorial estratégico de 30 dias com benchmark presets e objetivos definidos.`;

    const response = await callGemini("unused", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [CALENDAR_TOOL],
      tool_choice: { type: "function", function: { name: "save_calendar" } },
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

    await supabase.from("calendar_items").delete().eq("user_id", user.id);

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
        benchmark_preset: item.benchmark_preset || "autoridade_premium",
        objetivo: item.objetivo || "educar",
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
