import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { safeJsonParse } from "../_shared/json-utils.ts";

const FORMATS = [
  "stories",
  "reel",
  "legenda_alternativa",
  "post_unico",
  "thread",
  "versao_premium",
  "versao_humana",
  "versao_engajadora",
] as const;

type Format = (typeof FORMATS)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

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
    const { format, source_content, strategic_input, benchmark_preset, source_id } = body;

    if (!format || !source_content) {
      return new Response(
        JSON.stringify({ error: "format and source_content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!FORMATS.includes(format as Format)) {
      return new Response(
        JSON.stringify({ error: `Invalid format. Use: ${FORMATS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: positioning } = await supabase
      .from("positioning")
      .select("archetype, tone")
      .eq("user_id", user.id)
      .maybeSingle();

    const archetype = positioning?.archetype || "não definido";
    const tone = positioning?.tone || "consultivo e premium";
    const tese = strategic_input?.tese || "";
    const objetivo = strategic_input?.objetivo || "";
    const presetLabel = benchmark_preset || "não definido";

    const sourceText = typeof source_content === "string"
      ? source_content
      : JSON.stringify(source_content);

    const baseContext = `CONTEXTO ESTRATÉGICO:
- Arquétipo: ${archetype}
- Tom: ${tone}
- Benchmark preset: ${presetLabel}
- Tese original: ${tese}
- Objetivo: ${objetivo}

CONTEÚDO ORIGINAL (carrossel):
${sourceText}`;

    const prompts: Record<Format, string> = {
      stories: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o carrossel abaixo em uma SEQUÊNCIA DE STORIES (5-8 stories).

${baseContext}

Gere um JSON:
{
  "stories": [
    {
      "story_number": 1,
      "type": "texto|enquete|quiz|cta",
      "content": "Texto principal do story",
      "visual_cue": "Direção visual",
      "interaction": "Enquete/quiz se aplicável"
    }
  ],
  "strategy_note": "Como esta sequência complementa o carrossel original"
}

REGRAS:
- Story 1: hook que conecta com o carrossel
- Stories intermediários: conteúdo fragmentado e interativo
- Último story: CTA direto
- Use enquetes e quizzes quando possível
- Tom: ${tone}
- PT-BR`,

      reel: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o carrossel abaixo em um ROTEIRO DE REELS (30-60 segundos).

${baseContext}

Gere um JSON:
{
  "duration_estimate": "30-45s",
  "hook": { "text": "Frase de abertura (3s)", "visual_cue": "O que mostrar" },
  "sections": [
    {
      "section": "desenvolvimento|virada|prova|fechamento",
      "text": "O que falar",
      "duration": "5-10s",
      "visual_cue": "Direção visual",
      "on_screen_text": "Texto overlay"
    }
  ],
  "cta": { "text": "CTA final", "visual_cue": "Direção visual" },
  "caption": "Legenda do reels",
  "strategy_note": "Como este reels complementa o carrossel"
}

REGRAS: Hook em 3s. Máximo 60s. Linguagem falada. Tom: ${tone}. PT-BR`,

      legenda_alternativa: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Crie uma LEGENDA ALTERNATIVA para o carrossel abaixo, com ângulo diferente do original.

${baseContext}

Gere um JSON:
{
  "angle": "Qual ângulo diferente esta legenda explora",
  "hook": "Primeira linha (aparece no feed)",
  "body": "Corpo da legenda (3-5 parágrafos curtos)",
  "cta": "Call to action",
  "hashtags": ["hashtag1", "hashtag2"],
  "strategy_note": "Como esta legenda complementa o carrossel"
}

REGRAS: Hook forte. Ângulo diferente do original. Tom: ${tone}. PT-BR`,

      post_unico: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o carrossel abaixo em um POST ÚNICO de imagem estática com legenda.

${baseContext}

Gere um JSON:
{
  "headline": "Título principal para a imagem (máx 10 palavras)",
  "subheadline": "Subtítulo ou frase de apoio",
  "visual_direction": "Como deve ser o design da imagem",
  "caption": "Legenda completa do post",
  "hashtags": ["hashtag1", "hashtag2"],
  "strategy_note": "Como este post simplifica a mensagem do carrossel"
}

REGRAS: Condensar a essência. Uma imagem, uma mensagem. Tom: ${tone}. PT-BR`,

      thread: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Transforme o carrossel abaixo em uma THREAD CURTA (5-7 posts sequenciais).

${baseContext}

Gere um JSON:
{
  "thread_title": "Título da thread",
  "posts": [
    {
      "post_number": 1,
      "content": "Texto do post (máx 280 chars)",
      "emoji": "Emoji principal"
    }
  ],
  "strategy_note": "Como esta thread expande o carrossel"
}

REGRAS: Posts curtos e escaneáveis. Progressão lógica. Último post com CTA. Tom: ${tone}. PT-BR`,

      versao_premium: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Reescreva o carrossel abaixo em uma VERSÃO MAIS PREMIUM — mais sofisticada, com linguagem mais elevada e posicionamento de autoridade.

${baseContext}

Gere um JSON com a mesma estrutura do carrossel original, mas com:
{
  "slides": [
    {
      "numero": 1,
      "papel": "gancho|desconstrucao|revelacao|metodo|prova|ampliacao|identidade|cta",
      "titulo": "Título refinado",
      "corpo": "Texto mais premium",
      "nota_visual": "Direção visual premium"
    }
  ],
  "legenda": "Legenda premium",
  "strategy_note": "O que mudou e por quê"
}

REGRAS: Elevar sofisticação sem perder clareza. Mais autoridade. Tom premium e consultivo. PT-BR`,

      versao_humana: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Reescreva o carrossel abaixo em uma VERSÃO MAIS HUMANA — mais próxima, vulnerável, pessoal e conectada.

${baseContext}

Gere um JSON:
{
  "slides": [
    {
      "numero": 1,
      "papel": "gancho|desconstrucao|revelacao|metodo|prova|ampliacao|identidade|cta",
      "titulo": "Título humanizado",
      "corpo": "Texto mais pessoal e próximo",
      "nota_visual": "Direção visual mais calorosa"
    }
  ],
  "legenda": "Legenda humanizada",
  "strategy_note": "O que mudou e por quê"
}

REGRAS: Mais proximidade. Histórias pessoais. Menos técnico. Tom caloroso. PT-BR`,

      versao_engajadora: `Você é o MEDSHIFT, sistema premium de posicionamento para médicos.

Reescreva o carrossel abaixo em uma VERSÃO MAIS ENGAJADORA — com hooks mais fortes, mais provocação, mais interação.

${baseContext}

Gere um JSON:
{
  "slides": [
    {
      "numero": 1,
      "papel": "gancho|desconstrucao|revelacao|metodo|prova|ampliacao|identidade|cta",
      "titulo": "Título provocador",
      "corpo": "Texto com mais engajamento",
      "nota_visual": "Direção visual mais impactante"
    }
  ],
  "legenda": "Legenda engajadora com perguntas",
  "strategy_note": "O que mudou e por quê"
}

REGRAS: Hooks mais agressivos. Perguntas retóricas. Provocações. CTAs conversacionais. PT-BR`,
    };

    const aiRes = await callGemini("unused", {
      messages: [{ role: "user", content: prompts[format as Format] }],
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

    const result = safeJsonParse(aiContent);

    // Save as derived content
    if (source_id) {
      const { error: saveError } = await supabase.from("content_outputs").insert({
        user_id: user.id,
        content_type: format,
        title: `${format.replace(/_/g, " ")} — derivado`,
        strategic_input: strategic_input || {},
        generated_content: { ...result, original_format: "carrossel", transform_format: format },
        derived_from: source_id,
      });
      if (saveError) console.error("Error saving derived:", saveError.message);
    }

    return new Response(
      JSON.stringify({ format, result, saved: !!source_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
