import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, objetivo, tese, percepcao } = await req.json();

    if (!tipo || !objetivo || !tese || !percepcao) {
      return new Response(
        JSON.stringify({ error: "Todos os campos estratégicos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

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

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
