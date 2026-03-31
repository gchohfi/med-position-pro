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
    // --- Auth validation (Bug #3 fix) ---
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

    const { tipo, objetivo, tese, percepcao } = await req.json();

    if (!tipo || !objetivo || !tese || !percepcao) {
      return errorResponse("Todos os campos estratégicos são obrigatórios.", 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const systemPrompt = `Você é um estrategista de conteúdo para médicas que desejam se posicionar com autoridade no Instagram.

Seu papel é gerar conteúdo estratégico estruturado em exatamente 6 blocos, nesta ordem:

1. **Gancho** — A frase de abertura que captura atenção imediata. Deve ser provocativa, intrigante ou desafiadora.

2. **Quebra de percepção** — Um insight que desafia o senso comum ou a crença popular sobre o tema. Algo que faça o leitor parar e reconsiderar.

3. **Explicação / visão** — Desenvolvimento da tese central com clareza e profundidade. Aqui você educa e posiciona.

4. **Método / lógica** — O raciocínio estruturado ou framework que sustenta a tese. Pode ser passos, pilares ou uma lógica sequencial.

5. **Manifesto** — Uma declaração forte de posicionamento. É onde a médica se posiciona com convicção e autenticidade.

6. **Fechamento** — CTA estratégico ou reflexão final que conecta o conteúdo ao objetivo definido.

REGRAS:
- Escreva em português brasileiro
- Tom consultivo, inteligente, sem hype
- Cada bloco deve ter o título exato seguido de dois pontos e o conteúdo
- Não use emojis
- Não use linguagem genérica de marketing
- Adapte ao tipo de conteúdo solicitado
- Use dados, tendências e referências reais quando possível para fundamentar o conteúdo`;

    const userPrompt = `Tipo de conteúdo: ${tipo}
Objetivo: ${objetivo}
Tese central: ${tese}
Percepção desejada: ${percepcao}

Pesquise tendências e dados reais relevantes sobre o tema para fundamentar o conteúdo.
Gere o conteúdo estratégico seguindo a estrutura de 6 blocos.`;

    // Try Perplexity first (web-grounded research)
    if (PERPLEXITY_API_KEY) {
      try {
        const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            stream: true,
          }),
        });
        if (pplxRes.ok) {
          console.log("generate-content: using Perplexity (web-grounded)");
          return new Response(pplxRes.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
        console.log("Perplexity failed:", pplxRes.status, "- falling back to Gemini");
      } catch (e) {
        console.log("Perplexity error, falling back to Gemini:", e);
      }
    }

    // Primary: Gemini with streaming + retry
    console.log("generate-content: using Gemini");
    const geminiRes = await callGemini(GEMINI_API_KEY, {
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return errorResponse("AI generation failed", 500);
    }

    return new Response(geminiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
  }
});
