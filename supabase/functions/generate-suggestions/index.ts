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
    const {
      tipo, objetivo, archetype, pillar, tone, targetAudience, goals, specialty,
      recentTheses, recentPerceptions, activeSeries, memoryHighlights, calendarContext, radarSignals,
    } = await req.json();

    if (!tipo || !objetivo) {
      return new Response(
        JSON.stringify({ error: "Tipo e objetivo são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: "You generate structured JSON with arrays. Always include the full teses and percepcoes arrays with exactly 3 items each as instructed. Respond in Portuguese (Brazil)." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.85,
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atingido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const result = JSON.parse(jsonMatch[0]);
    if (!result.teses?.length || !result.percepcoes?.length) throw new Error("Incomplete response");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar sugestões." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
