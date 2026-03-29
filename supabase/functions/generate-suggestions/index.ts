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
      tipo,
      objetivo,
      archetype,
      pillar,
      tone,
      targetAudience,
      goals,
      specialty,
      recentTheses,
      recentPerceptions,
      activeSeries,
      memoryHighlights,
      calendarContext,
      radarSignals,
    } = await req.json();

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

    const avoidTheses = (recentTheses || []).slice(0, 5);
    const avoidPerceptions = (recentPerceptions || []).slice(0, 5);

    const contextBlocks: string[] = [];
    if (archetype) contextBlocks.push(`Arquétipo: ${archetype}`);
    if (pillar) contextBlocks.push(`Pilar estratégico ativo: ${pillar}`);
    if (tone) contextBlocks.push(`Tom de voz: ${tone}`);
    if (targetAudience) contextBlocks.push(`Público-alvo: ${targetAudience}`);
    if (goals) contextBlocks.push(`Objetivo macro: ${goals}`);
    if (specialty) contextBlocks.push(`Especialidade médica: ${specialty}`);
    if (activeSeries?.length) contextBlocks.push(`Séries ativas: ${activeSeries.join(", ")}`);
    if (memoryHighlights?.length) contextBlocks.push(`Destaques da memória: ${memoryHighlights.join("; ")}`);
    if (calendarContext) contextBlocks.push(`Calendário próximo: ${calendarContext}`);
    if (radarSignals?.length) contextBlocks.push(`Sinais de mercado: ${radarSignals.join("; ")}`);

    const avoidBlock = avoidTheses.length > 0
      ? `\n\nEVITE ABSOLUTAMENTE repetir teses similares a estas:\n${avoidTheses.map((t: string, i: number) => `${i + 1}. "${t}"`).join("\n")}\n\nEVITE percepções similares a estas:\n${avoidPerceptions.map((p: string, i: number) => `${i + 1}. "${p}"`).join("\n")}`
      : "";

    const systemPrompt = `Você é um estrategista editorial sênior para médicas de alto posicionamento no Instagram.

Contexto:
${contextBlocks.length > 0 ? contextBlocks.map(c => `- ${c}`).join("\n") : "- Contexto limitado — baseie-se no tipo e objetivo."}

Tipo de conteúdo: ${tipo}
Objetivo: ${objetivo}
${avoidBlock}

TAREFA: Gere EXATAMENTE 3 opções de tese central e 3 opções de percepção desejada.

TESES — 3 ângulos obrigatórios:
1. "educativa" (label: "Educativa") — didática, que ensina algo específico
2. "estratégica" (label: "Estratégica") — posicionadora, que reivindica território
3. "manifesto" (label: "Manifesto") — opinativa, que defende uma visão forte

PERCEPÇÕES — 3 tons obrigatórios:
1. "autoridade" (label: "Autoridade") — competência e domínio técnico
2. "humana" (label: "Humana") — proximidade e acessibilidade
3. "premium" (label: "Premium") — sofisticação e exclusividade

Regras:
- Tese: afirmação clara e posicionadora, máximo 2 frases
- Percepção: concisa, máximo 1 frase
- As 3 opções devem ser GENUINAMENTE diferentes, não variações da mesma ideia
- Sem clichês: "referência na área", "autoridade no assunto", "profissional diferenciada"
- Seja específica ao nicho médico

Responda APENAS com JSON válido no formato exato abaixo, sem texto adicional:
{"teses":[{"angle":"educativa","label":"Educativa","text":"..."},{"angle":"estratégica","label":"Estratégica","text":"..."},{"angle":"manifesto","label":"Manifesto","text":"..."}],"percepcoes":[{"angle":"autoridade","label":"Autoridade","text":"..."},{"angle":"humana","label":"Humana","text":"..."},{"angle":"premium","label":"Premium","text":"..."}]}`;

    const userPrompt = `Gere as 3 opções de tese central e as 3 opções de percepção desejada para um conteúdo "${tipo}" com objetivo: "${objetivo}".

IMPORTANTE: Sua resposta DEVE conter exatamente 3 teses (educativa, estratégica, manifesto) e 3 percepções (autoridade, humana, premium) no formato JSON especificado. Cada opção deve ser genuinamente diferente das outras.`;
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere as 3 opções de tese e 3 opções de percepção para: ${objetivo}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!result.teses?.length || !result.percepcoes?.length) {
      throw new Error("Incomplete AI response");
    }

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
