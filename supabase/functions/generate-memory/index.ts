import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

// ── Inline shared helpers ──
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

async function callGemini(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[Gemini] retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
    const res = await fetch(GEMINI_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gemini-2.5-flash", ...body }),
    });
    if (res.ok) return res;
    if (res.status === 429 && attempt < MAX_RETRIES) {
      lastError = await res.text();
      console.log(`[Gemini] 429 (attempt ${attempt + 1}): ${lastError.slice(0, 120)}`);
      continue;
    }
    return res;
  }
  throw new Error(`Gemini failed after ${MAX_RETRIES} retries: ${lastError}`);
}

async function callGeminiStream(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  return callGemini(apiKey, { stream: true, ...body });
}

async function callPerplexity(apiKey: string, body: Record<string, unknown>): Promise<Response | null> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "sonar", ...body }),
    });
    if (res.ok) return res;
    console.log(`[Perplexity] error: ${res.status}`);
    return null;
  } catch (e) {
    console.log(`[Perplexity] exception: ${e}`);
    return null;
  }
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function streamResponse(body: ReadableStream | null) {
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}


const MEMORY_TOOL = {
  type: "function" as const,
  function: {
    name: "save_memory",
    description: "Save living memory and evolution snapshot for a medical professional's brand",
    parameters: {
      type: "object",
      properties: {
        living_memory: {
          type: "object",
          properties: {
            positioning_anchor: { type: "string", description: "Core positioning statement" },
            tone_description: { type: "string", description: "Validated tone description" },
            signature_phrases: { type: "array", items: { type: "string" }, description: "5-8 validated brand phrases" },
            rejected_phrases: { type: "array", items: { type: "string" }, description: "3-5 phrases to avoid" },
            strong_territories: { type: "array", items: { type: "string" }, description: "3-5 owned territories" },
            territories_to_explore: { type: "array", items: { type: "string" }, description: "2-4 unexplored territories" },
            saturated_territories: { type: "array", items: { type: "string" }, description: "1-3 overused territories" },
            visual_patterns: { type: "array", items: { type: "string" }, description: "2-4 recurring visual cues" },
            strategic_risks: { type: "array", items: { type: "string" }, description: "2-4 strategic risks" },
            golden_patterns: { type: "array", items: { type: "string" }, description: "2-3 reusable content formulas" },
          },
          required: ["positioning_anchor", "tone_description", "signature_phrases", "rejected_phrases", "strong_territories", "territories_to_explore", "saturated_territories", "strategic_risks"],
        },
        evolution_snapshot: {
          type: "object",
          properties: {
            positioning_clarity: { type: "string", enum: ["baixa", "em construção", "clara", "consolidada"] },
            archetype_consolidation: { type: "string", enum: ["instável", "emergindo", "definido", "consolidado"] },
            editorial_consistency: { type: "string", enum: ["inconsistente", "melhorando", "consistente", "exemplar"] },
            content_mix_balance: { type: "string", enum: ["desequilibrado", "melhorando", "equilibrado", "estratégico"] },
            authorship_maturity: { type: "string", enum: ["iniciante", "em desenvolvimento", "autoral", "referência"] },
            strongest_content_types: { type: "array", items: { type: "string" } },
            neglected_territories: { type: "array", items: { type: "string" } },
            perceived_changes: { type: "string", description: "Summary of perceived positioning changes" },
            next_strategic_move: { type: "string", description: "Recommended next strategic action" },
            cycle_summary: { type: "string", description: "Summary of the current strategic cycle" },
          },
          required: ["positioning_clarity", "archetype_consolidation", "editorial_consistency", "content_mix_balance", "authorship_maturity", "strongest_content_types", "neglected_territories", "next_strategic_move", "cycle_summary"],
        },
      },
      required: ["living_memory", "evolution_snapshot"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Gather all user data for analysis
    const [posRes, profileRes, diagRes, contentRes, seriesRes] = await Promise.all([
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("specialty, full_name").eq("id", user.id).single(),
      supabase.from("diagnosis_outputs").select("diagnosis, estrategia").eq("user_id", user.id).maybeSingle(),
      supabase.from("content_outputs").select("content_type, strategic_input, generated_content, golden_case, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("series").select("name, strategic_role, frequency, status").eq("user_id", user.id),
    ]);

    const contentSummary = (contentRes.data || []).map((c: any) => ({
      type: c.content_type,
      input: c.strategic_input,
      golden: c.golden_case,
      date: c.created_at,
    }));

    const systemPrompt = `Você é um estrategista sênior de posicionamento médico digital.
Analise todo o histórico deste profissional e gere:
1. Uma "memória viva" da marca — o que o sistema aprendeu sobre identidade, tom, frases, territórios
2. Um snapshot de evolução — como o posicionamento está progredindo

Regras:
- Linguagem consultiva, editorial premium, português brasileiro
- Seja específico e personalizado — não generalidades
- Frases validadas devem soar naturais e autorais
- Territórios devem ser concretos e relevantes à especialidade
- Riscos devem ser acionáveis
- A evolução deve refletir o estágio real baseado no volume e qualidade do conteúdo`;

    const userPrompt = `Especialidade: ${profileRes.data?.specialty || "Não informada"}
Arquétipo: ${posRes.data?.archetype || "Não definido"}
Tom: ${posRes.data?.tone || "Não definido"}
Pilares: ${posRes.data?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${posRes.data?.target_audience || "Não definido"}
Objetivos: ${posRes.data?.goals || "Não definidos"}
Séries ativas: ${(seriesRes.data || []).map((s: any) => s.name).join(", ") || "Nenhuma"}
Total de conteúdos gerados: ${contentSummary.length}
Casos de ouro: ${contentSummary.filter((c: any) => c.golden).length}
Mix de conteúdo: ${JSON.stringify(contentSummary.reduce((acc: any, c: any) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}))}

Diagnóstico existente: ${diagRes.data?.diagnosis ? "Sim" : "Não"}
Estratégia existente: ${diagRes.data?.estrategia ? "Sim" : "Não"}

Gere a memória viva e o snapshot de evolução deste profissional.`;

    const response = await callGemini(GEMINI_API_KEY, {
messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [MEMORY_TOOL],
        tool_choice: { type: "function", function: { name: "save_memory" } },
      });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call");

    const result = JSON.parse(toolCall.function.arguments);

    // Upsert living memory
    const { data: existingMem } = await supabase.from("living_memory").select("id").eq("user_id", user.id).maybeSingle();
    if (existingMem) {
      await supabase.from("living_memory").update({ memory: result.living_memory }).eq("user_id", user.id);
    } else {
      await supabase.from("living_memory").insert({ user_id: user.id, memory: result.living_memory });
    }

    // Insert new evolution snapshot
    const { data: lastSnapshot } = await supabase
      .from("positioning_snapshots")
      .select("cycle_number")
      .eq("user_id", user.id)
      .order("cycle_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextCycle = (lastSnapshot?.cycle_number || 0) + 1;

    await supabase.from("positioning_snapshots").insert({
      user_id: user.id,
      cycle_number: nextCycle,
      snapshot: result.evolution_snapshot,
      recommendation: result.evolution_snapshot.next_strategic_move,
    });

    return new Response(JSON.stringify({ living_memory: result.living_memory, evolution: result.evolution_snapshot, cycle: nextCycle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-memory error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
