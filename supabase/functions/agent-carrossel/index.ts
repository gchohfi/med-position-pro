import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um criador de carrosséis médicos para Instagram. Gere um roteiro completo de carrossel com slides estruturados. Cada slide deve ter: numero, papel (gancho/desconstrucao/revelacao/metodo/prova/ampliacao/identidade/cta), titulo, corpo, nota_visual. Inclua também: titulo_carrossel, tese_central, legenda, hashtags, cta_final, tom, objetivo. Retorne APENAS JSON válido sem markdown. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não use antes/depois
- Não exiba preços comerciais
- Mantenha ética médica em todo o conteúdo
- Foque em conteúdo educativo e informativo

O JSON deve seguir esta estrutura exata:
{
  "titulo_carrossel": "...",
  "tese_central": "...",
  "tom": "...",
  "objetivo": "...",
  "slides": [
    {
      "numero": 1,
      "papel": "gancho",
      "titulo": "...",
      "corpo": "...",
      "nota_visual": "..."
    }
  ],
  "legenda": "...",
  "hashtags": ["...", "..."],
  "cta_final": "..."
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile, tese, objetivo } = await req.json();

    const userPrompt = `Crie um roteiro completo de carrossel para o seguinte médico:

Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}

Tese central do carrossel: ${tese ?? "Não informada"}
Objetivo do carrossel: ${objetivo ?? "Educar e engajar"}

Gere um carrossel com 7-10 slides seguindo a progressão narrativa: gancho > desconstrucao > revelacao > metodo > prova > ampliacao > identidade > cta.

Retorne APENAS o JSON válido, sem markdown ou texto adicional.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        stream: false,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("Empty response from Claude");
    }

    // Parse the JSON from Claude's response
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from potential markdown wrapping
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse JSON from Claude response");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
