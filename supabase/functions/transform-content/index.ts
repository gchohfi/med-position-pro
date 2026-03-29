import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompts[format] }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
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
