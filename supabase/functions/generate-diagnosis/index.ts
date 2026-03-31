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


const DIAGNOSIS_TOOL = {
  type: "function" as const,
  function: {
    name: "save_diagnosis",
    description: "Save the strategic diagnosis analysis for a medical professional",
    parameters: {
      type: "object",
      properties: {
        posicionamento_atual: {
          type: "string",
          description: "2-3 paragraphs about current perceived positioning, consultive language",
        },
        forcas: {
          type: "array",
          items: { type: "string" },
          description: "Up to 5 profile strengths as bullet points",
        },
        lacunas: {
          type: "array",
          items: { type: "string" },
          description: "Strategic gaps — where authority is lost",
        },
        incoerencias: {
          type: "array",
          items: { type: "string" },
          description: "Misalignments between tone, audience, and content",
        },
        oportunidades: {
          type: "array",
          items: { type: "string" },
          description: "Growth opportunities and differentiation possibilities",
        },
        maturidade: {
          type: "string",
          enum: ["iniciante", "estruturando", "estrategico", "avancado"],
          description: "Digital maturity level",
        },
        arquetipo_principal: {
          type: "string",
          enum: [
            "Médica Editorial Premium",
            "Médica Humanizada",
            "Médica Técnica/Científica",
            "Médica Aspiracional",
            "Médica de Conversão Local",
          ],
        },
        arquetipo_secundario: {
          type: "string",
          enum: [
            "Médica Editorial Premium",
            "Médica Humanizada",
            "Médica Técnica/Científica",
            "Médica Aspiracional",
            "Médica de Conversão Local",
          ],
        },
        direcao_recomendada: {
          type: "object",
          properties: {
            atual: { type: "string", description: "Current state summary" },
            ideal: { type: "string", description: "Ideal state recommendation" },
            gap: { type: "string", description: "What needs to change" },
          },
          required: ["atual", "ideal", "gap"],
        },
      },
      required: [
        "posicionamento_atual",
        "forcas",
        "lacunas",
        "incoerencias",
        "oportunidades",
        "maturidade",
        "arquetipo_principal",
        "arquetipo_secundario",
        "direcao_recomendada",
      ],
      additionalProperties: false,
    },
  },
};

const STRATEGY_TOOL = {
  type: "function" as const,
  function: {
    name: "save_strategy",
    description: "Save the editorial strategy for a medical professional",
    parameters: {
      type: "object",
      properties: {
        macro_objetivo: { type: "string", description: "Clear main objective phrase" },
        pilares_editoriais: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              descricao: { type: "string" },
              tipo_conteudo: { type: "string" },
            },
            required: ["nome", "descricao", "tipo_conteudo"],
          },
          description: "3-5 editorial pillars",
        },
        tom_recomendado: { type: "string", description: "Recommended tone with explanation" },
        nivel_sofisticacao: {
          type: "string",
          enum: ["basico", "intermediario", "premium"],
        },
        formatos_prioritarios: {
          type: "array",
          items: { type: "string" },
          description: "Priority content formats (carrossel, reels, etc.)",
        },
        diferenciacao: { type: "string", description: "What makes this profile unique" },
      },
      required: [
        "macro_objetivo",
        "pilares_editoriais",
        "tom_recomendado",
        "nivel_sofisticacao",
        "formatos_prioritarios",
        "diferenciacao",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { positioning, specialty, action } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    // Validate auth BEFORE calling Gemini to avoid wasting API credits
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const systemPrompt = `Você é um estrategista sênior de posicionamento digital médico no Instagram.
Analise os dados de posicionamento do profissional e gere uma análise ${action === "diagnostico" ? "diagnóstica" : "estratégica"} profunda.

Regras:
- Linguagem consultiva, profissional, em português brasileiro
- Seja específico e personalizado baseado nos dados fornecidos
- Evite generalidades — cada insight deve ser acionável
- Tom editorial premium, como um relatório de consultoria de alto nível
- Considere o contexto médico brasileiro e Instagram como plataforma`;

    const userPrompt = `Especialidade: ${specialty || "Não informada"}
Arquétipo selecionado: ${positioning?.archetype || "Não definido"}
Tom de voz: ${positioning?.tone || "Não definido"}
Pilares editoriais: ${positioning?.pillars?.join(", ") || "Não definidos"}
Público-alvo: ${positioning?.target_audience || "Não definido"}
Objetivos: ${positioning?.goals || "Não definidos"}

${action === "diagnostico"
  ? "Gere um diagnóstico estratégico completo do posicionamento deste profissional."
  : "Gere um direcionamento estratégico editorial completo para este profissional."}`;

    const tool = action === "diagnostico" ? DIAGNOSIS_TOOL : STRATEGY_TOOL;
    const toolName = action === "diagnostico" ? "save_diagnosis" : "save_strategy";

    const response = await callGemini(GEMINI_API_KEY, {
messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
      });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    const field = action === "diagnostico" ? "diagnosis" : "estrategia";

    // Upsert
    const { data: existing } = await supabase
      .from("diagnosis_outputs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("diagnosis_outputs")
        .update({ [field]: result })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("diagnosis_outputs")
        .insert({ user_id: user.id, [field]: result });
    }

    return new Response(JSON.stringify({ [field]: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagnosis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
