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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const body = await req.json();
    const { format, content, strategic_input } = body;

    if (!format || !content) {
      return new Response(
        JSON.stringify({ error: "format and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validFormats = ["carrossel", "reels", "legenda"];
    if (!validFormats.includes(format)) {
      return new Response(
        JSON.stringify({ error: `Invalid format. Use: ${validFormats.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get positioning for tone context
    const { data: positioning } = await supabase
      .from("positioning")
      .select("archetype, tone")
      .eq("user_id", user.id)
      .maybeSingle();

    const contentText = Object.entries(content)
      .map(([k, v]) => `${k}:\n${v}`)
      .join("\n\n");

    const prompts: Record<string, string> = {
      carrossel: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o conteúdo estratégico abaixo em um CARROSSEL de Instagram com 7-10 slides.

CONTEXTO ESTRATÉGICO:
- Arquétipo: ${positioning?.archetype || "não definido"}
- Tom: ${positioning?.tone || "não definido"}
- Tipo: ${strategic_input?.tipo || "estratégico"}
- Tese: ${strategic_input?.tese || ""}
- Objetivo: ${strategic_input?.objetivo || ""}

CONTEÚDO BASE:
${contentText}

Gere um JSON com:
{
  "slides": [
    {
      "slide_number": 1,
      "type": "capa|conteudo|fechamento",
      "headline": "Título principal do slide (máx 8 palavras)",
      "body": "Texto do slide (máx 30 palavras)",
      "visual_direction": "Direção visual sugerida para o design",
      "speaker_notes": "Nota para quem vai gravar ou criar o visual"
    }
  ],
  "caption": "Legenda sugerida para o post do carrossel (com CTA)",
  "hashtags": ["hashtag1", "hashtag2"]
}

REGRAS:
- Slide 1: capa com hook forte
- Slides 2-8: conteúdo progressivo
- Último slide: fechamento com CTA
- Headlines curtas e impactantes
- Body conciso e direto
- Visual direction deve ser prática
- Tom: ${positioning?.tone || "consultivo e premium"}
- PT-BR`,

      reels: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o conteúdo estratégico abaixo em um ROTEIRO DE REELS (30-60 segundos).

CONTEXTO ESTRATÉGICO:
- Arquétipo: ${positioning?.archetype || "não definido"}
- Tom: ${positioning?.tone || "não definido"}
- Tese: ${strategic_input?.tese || ""}
- Objetivo: ${strategic_input?.objetivo || ""}

CONTEÚDO BASE:
${contentText}

Gere um JSON com:
{
  "duration_estimate": "30-45s",
  "hook": {
    "text": "Frase de abertura (primeiros 3 segundos)",
    "visual_cue": "O que mostrar na tela"
  },
  "sections": [
    {
      "section": "desenvolvimento|virada|prova|fechamento",
      "text": "O que falar neste trecho",
      "duration": "5-10s",
      "visual_cue": "Direção visual ou corte sugerido",
      "on_screen_text": "Texto overlay opcional"
    }
  ],
  "cta": {
    "text": "Call to action final",
    "visual_cue": "Direção visual do CTA"
  },
  "caption": "Legenda para o post do Reels",
  "hashtags": ["hashtag1", "hashtag2"],
  "audio_suggestion": "Sugestão de áudio/música de fundo"
}

REGRAS:
- Hook nos primeiros 3 segundos
- Máximo 60 segundos total
- Linguagem falada, natural
- Cortes sugeridos a cada 5-10s
- Tom: ${positioning?.tone || "consultivo e premium"}
- PT-BR`,

      legenda: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o conteúdo estratégico abaixo em uma LEGENDA DE INSTAGRAM completa.

CONTEXTO ESTRATÉGICO:
- Arquétipo: ${positioning?.archetype || "não definido"}
- Tom: ${positioning?.tone || "não definido"}
- Tese: ${strategic_input?.tese || ""}
- Objetivo: ${strategic_input?.objetivo || ""}

CONTEÚDO BASE:
${contentText}

Gere um JSON com:
{
  "hook": "Primeira linha da legenda (hook forte que aparece antes do 'ver mais')",
  "body": "Corpo da legenda (3-5 parágrafos curtos, quebrados em linhas)",
  "cta": "Call to action final",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "emoji_strategy": "Como usar emojis nesta legenda"
}

REGRAS:
- Hook forte na primeira linha (aparece no feed)
- Parágrafos curtos e escaneáveis
- CTA claro e específico
- 5-15 hashtags estratégicas
- Tom: ${positioning?.tone || "consultivo e premium"}
- PT-BR`,
    };

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const aiRes = await callGemini(GEMINI_API_KEY, {
messages: [{ role: "user", content: prompts[format] }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI error: ${aiRes.status} ${errText}`);
    }

    const aiData = await aiRes.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) throw new Error("Empty AI response");

    const result = JSON.parse(aiContent);

    return new Response(
      JSON.stringify({ format, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
