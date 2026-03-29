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
    const { tipo, objetivo, archetype, pillar, previousTheses, previousPerceptions } = await req.json();

    if (!tipo || !objetivo) {
      return new Response(
        JSON.stringify({ error: "Tipo e objetivo são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const avoidTheses = (previousTheses || []).slice(0, 3);
    const avoidPerceptions = (previousPerceptions || []).slice(0, 3);

    const avoidBlock = avoidTheses.length > 0
      ? `\n\nEVITE repetir teses similares a estas recentes:\n${avoidTheses.map((t: string, i: number) => `${i + 1}. "${t}"`).join("\n")}\n\nEVITE percepções similares a estas:\n${avoidPerceptions.map((p: string, i: number) => `${i + 1}. "${p}"`).join("\n")}`
      : "";

    const systemPrompt = `Você é um estrategista de posicionamento para médicas no Instagram.

Gere exatamente UMA sugestão de tese central e UMA sugestão de percepção desejada.

Contexto:
- Tipo de conteúdo: ${tipo}
- Objetivo: ${objetivo}
${archetype ? `- Arquétipo: ${archetype}` : ""}
${pillar ? `- Pilar estratégico: ${pillar}` : ""}

Regras:
- A tese deve ser uma afirmação clara, provocativa e posicionadora. Máximo 2 frases.
- A percepção deve descrever como o público deve perceber a médica após o conteúdo. Máximo 1 frase.
- Evite frases genéricas como "referência na área" ou "autoridade no assunto".
- Seja específica ao nicho e ao tipo de conteúdo.
- Nunca use clichês ou fórmulas prontas.
- A tese define o posicionamento editorial da peça.
- A percepção define o efeito desejado na audiência.${avoidBlock}

Responda APENAS em JSON válido:
{"tese": "...", "percepcao": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere uma sugestão original de tese e percepção para um conteúdo ${tipo} sobre: ${objetivo}` },
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar sugestão." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
