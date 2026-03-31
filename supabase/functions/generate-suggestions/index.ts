import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth validation (Bug #5 fix) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing auth", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);
    // --- End auth validation ---

    const {
      tipo, objetivo, archetype, pillar, tone, targetAudience, goals, specialty,
      recentTheses, recentPerceptions, activeSeries, memoryHighlights, calendarContext, radarSignals,
    } = await req.json();

    if (!tipo || !objetivo) {
      return errorResponse("Tipo e objetivo são obrigatórios.", 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const avoidTheses = (recentTheses || []).slice(0, 5);
    const avoidPerceptions = (recentPerceptions || []).slice(0, 5);

    const ctx: string[] = [];
    if (archetype) ctx.push(`Arquétipo: ${archetype}`);
    if (pillar) ctx.push(`Pilar: ${pillar}`);
    if (tone) ctx.push(`Tom: ${tone}`);
    if (targetAudience) ctx.push(`Público: ${targetAudience}`);
    if (goals) ctx.push(`Objetivo macro: ${goals}`);
    if (specialty) ctx.push(`Especialidade: ${specialty}`);
    if (activeSeries?.length) ctx.push(`Séries ativas: ${activeSeries.join(", ")}`);
    if (memoryHighlights?.length) ctx.push(`Memória: ${memoryHighlights.join("; ")}`);
    if (calendarContext) ctx.push(`Calendário: ${calendarContext}`);
    if (radarSignals?.length) ctx.push(`Mercado: ${radarSignals.join("; ")}`);

    const avoidBlock = avoidTheses.length > 0
      ? `\nEVITE repetir:\nTeses: ${avoidTheses.map((t: string) => `"${t}"`).join("; ")}\nPercepções: ${avoidPerceptions.map((p: string) => `"${p}"`).join("; ")}`
      : "";

    const prompt = `Tarefa: gerar opções estratégicas para conteúdo médico no Instagram.

Contexto: ${ctx.length > 0 ? ctx.join(" | ") : "Limitado."}
Tipo: ${tipo} | Objetivo: ${objetivo}${avoidBlock}

Retorne um JSON com duas arrays: "teses" (3 itens) e "percepcoes" (3 itens).

Cada item de "teses" deve ter: angle, label, text
- Item 1: angle="educativa", label="Educativa", text = tese didática (max 2 frases)
- Item 2: angle="estratégica", label="Estratégica", text = tese posicionadora (max 2 frases)
- Item 3: angle="manifesto", label="Manifesto", text = tese opinativa forte (max 2 frases)

Cada item de "percepcoes" deve ter: angle, label, text
- Item 1: angle="autoridade", label="Autoridade", text = percepção técnica (max 1 frase)
- Item 2: angle="humana", label="Humana", text = percepção próxima (max 1 frase)
- Item 3: angle="premium", label="Premium", text = percepção sofisticada (max 1 frase)

As opções devem ser genuinamente diferentes entre si. Sem clichês genéricos. Específicas ao nicho.`;

    const response = await callGemini(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: "You generate structured JSON with arrays. Always include the full teses and percepcoes arrays with exactly 3 items each as instructed. Respond in Portuguese (Brazil)." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let result: any;
    try {
      // Strip markdown code fences if present
      let cleaned = typeof content === "string" ? content.trim() : "";
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      result = typeof content === "object" ? content : JSON.parse(cleaned);
    } catch {
      const jsonMatch = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response — could not extract JSON");
      result = JSON.parse(jsonMatch[0]);
    }
    if (!result.teses?.length || !result.percepcoes?.length) throw new Error("Incomplete response");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err?.message || err, JSON.stringify(err));
    return errorResponse("Erro ao gerar sugestões.", 500);
  }
});
