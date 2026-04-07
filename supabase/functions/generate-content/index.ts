import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini, errorResponse } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    // --- Auth validation ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing auth", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { tipo, objetivo, tese, percepcao } = await req.json();

    if (!tipo || !objetivo || !tese || !percepcao) {
      return errorResponse("Todos os campos estratégicos são obrigatórios.", 400);
    }

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
    const geminiRes = await callGemini("unused", {
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
