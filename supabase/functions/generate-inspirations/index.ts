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


const TOOL = {
  type: "function" as const,
  function: {
    name: "suggest_inspirations",
    description: "Generate curated strategic inspiration references for a medical professional",
    parameters: {
      type: "object",
      properties: {
        layout_references: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              segment: { type: "string" },
              suggestion_reason: { type: "string" },
              what_to_absorb: { type: "string" },
              what_to_avoid: { type: "string" },
              adherence_level: { type: "string", enum: ["alta", "moderada", "experimental"] },
              strategic_pattern: { type: "string" },
            },
            required: ["title", "segment", "suggestion_reason", "what_to_absorb", "what_to_avoid", "adherence_level"],
          },
          description: "3-5 layout/visual direction references",
        },
        content_references: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              segment: { type: "string" },
              suggestion_reason: { type: "string" },
              what_to_absorb: { type: "string" },
              what_to_avoid: { type: "string" },
              adherence_level: { type: "string", enum: ["alta", "moderada", "experimental"] },
              strategic_pattern: { type: "string" },
            },
            required: ["title", "segment", "suggestion_reason", "what_to_absorb", "what_to_avoid", "adherence_level"],
          },
          description: "3-5 content strategy references",
        },
        golden_case_starters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              segment: { type: "string" },
              suggestion_reason: { type: "string" },
              what_to_absorb: { type: "string" },
              what_to_avoid: { type: "string" },
              adherence_level: { type: "string", enum: ["alta", "moderada", "experimental"] },
              strategic_pattern: { type: "string" },
            },
            required: ["title", "segment", "suggestion_reason", "what_to_absorb", "what_to_avoid", "adherence_level"],
          },
          description: "2-3 golden case starter references",
        },
      },
      required: ["layout_references", "content_references", "golden_case_starters"],
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

    const [posRes, profileRes, diagRes, contentRes, existingRefs] = await Promise.all([
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("specialty, full_name").eq("id", user.id).single(),
      supabase.from("diagnosis_outputs").select("diagnosis, estrategia").eq("user_id", user.id).maybeSingle(),
      supabase.from("content_outputs").select("content_type, golden_case").eq("user_id", user.id),
      supabase.from("inspiration_references").select("title, feedback").eq("user_id", user.id),
    ]);

    const hasGoldenCases = (contentRes.data || []).some((c: any) => c.golden_case);
    const rejectedTitles = (existingRefs.data || [])
      .filter((r: any) => r.feedback === "rejeitar" || r.feedback === "nao_relevante")
      .map((r: any) => r.title);

    const systemPrompt = `Você é um curador estratégico de posicionamento médico digital premium.
Gere referências de inspiração CURADAS e ESTRATÉGICAS para esta profissional.

Regras:
- Referências devem ser direções estratégicas, NÃO exemplos para copiar
- Separe layout (estética/visual) de conteúdo (narrativa/editorial)
- Cada referência deve ter justificativa estratégica clara
- Linguagem consultiva, editorial premium, português brasileiro
- Referências devem vir do mesmo segmento médico ou adjacente estratégico
- Golden case starters: apenas se a profissional ainda não tem golden cases próprios
- Evite generalidades — seja específico ao segmento e ao posicionamento
- NÃO sugira referências já rejeitadas: ${rejectedTitles.join(", ") || "nenhuma"}`;

    const userPrompt = `Especialidade: ${profileRes.data?.specialty || "Não informada"}
Arquétipo: ${posRes.data?.archetype || "Não definido"}
Tom: ${posRes.data?.tone || "Não definido"}
Pilares: ${posRes.data?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${posRes.data?.target_audience || "Não definido"}
Objetivos: ${posRes.data?.goals || "Não definidos"}
Tem golden cases próprios: ${hasGoldenCases ? "Sim" : "Não"}
Diagnóstico feito: ${diagRes.data?.diagnosis ? "Sim" : "Não"}

Gere referências de inspiração curadas para esta profissional.`;

    const response = await callGemini(GEMINI_API_KEY, {
messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "suggest_inspirations" } },
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

    // Save all references to DB
    const toInsert: any[] = [];
    for (const ref of result.layout_references || []) {
      toInsert.push({ user_id: user.id, category: "layout", ...ref });
    }
    for (const ref of result.content_references || []) {
      toInsert.push({ user_id: user.id, category: "conteudo", ...ref });
    }
    if (!hasGoldenCases) {
      for (const ref of result.golden_case_starters || []) {
        toInsert.push({ user_id: user.id, category: "golden_case_starter", ...ref });
      }
    }

    if (toInsert.length > 0) {
      await supabase.from("inspiration_references").insert(toInsert);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-inspirations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
