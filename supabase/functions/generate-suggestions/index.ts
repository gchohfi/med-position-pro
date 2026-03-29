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
    if (memoryHighlights?.length) contextBlocks.push(`Destaques da memória viva: ${memoryHighlights.join("; ")}`);
    if (calendarContext) contextBlocks.push(`Contexto do calendário: ${calendarContext}`);
    if (radarSignals?.length) contextBlocks.push(`Sinais de mercado: ${radarSignals.join("; ")}`);

    const avoidBlock = avoidTheses.length > 0
      ? `\n\nEVITE ABSOLUTAMENTE repetir teses similares a estas recentes:\n${avoidTheses.map((t: string, i: number) => `${i + 1}. "${t}"`).join("\n")}\n\nEVITE percepções similares a estas:\n${avoidPerceptions.map((p: string, i: number) => `${i + 1}. "${p}"`).join("\n")}`
      : "";

    const systemPrompt = `Você é um estrategista editorial sênior para médicas de alto posicionamento no Instagram.

Seu papel é PROPOR direções fortes, nunca impor. Você gera opções distintas e estrategicamente diferenciadas.

Contexto da profissional:
${contextBlocks.length > 0 ? contextBlocks.map(c => `- ${c}`).join("\n") : "- Contexto limitado — baseie-se no tipo de conteúdo e objetivo."}

Tipo de conteúdo: ${tipo}
Objetivo: ${objetivo}

Gere exatamente 3 opções de TESE CENTRAL, cada uma com um ângulo distinto:
- Opção A (educativa): mais didática, que ensina algo específico
- Opção B (estratégica): mais posicionadora, que reivindica um território
- Opção C (manifesto): mais opinativa, que defende uma visão forte

E exatamente 3 opções de PERCEPÇÃO DESEJADA, cada uma com um tom distinto:
- Opção A (autoridade): foco em competência e domínio técnico
- Opção B (humana): foco em proximidade e acessibilidade
- Opção C (premium): foco em sofisticação e exclusividade

Regras:
- Cada tese deve ser uma afirmação clara e posicionadora. Máximo 2 frases.
- Cada percepção deve ser concisa. Máximo 1 frase.
- As opções devem ser GENUINAMENTE diferentes entre si, não variações da mesma ideia.
- Evite frases genéricas como "referência na área", "autoridade no assunto", "profissional diferenciada".
- Seja específica ao nicho médico e ao tipo de conteúdo.
- Nunca use clichês ou fórmulas prontas.
- A tese define o posicionamento editorial da peça.
- A percepção define o efeito desejado na audiência.${avoidBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere 3 opções de tese e 3 opções de percepção para um conteúdo ${tipo} sobre: ${objetivo}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_options",
              description: "Return 3 thesis options and 3 perception options for the content piece.",
              parameters: {
                type: "object",
                properties: {
                  teses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string", enum: ["educativa", "estratégica", "manifesto"] },
                        label: { type: "string", description: "Short label like 'Educativa', 'Estratégica', 'Manifesto'" },
                        text: { type: "string", description: "The thesis statement, max 2 sentences" },
                      },
                      required: ["angle", "label", "text"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                  percepcoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string", enum: ["autoridade", "humana", "premium"] },
                        label: { type: "string", description: "Short label like 'Autoridade', 'Humana', 'Premium'" },
                        text: { type: "string", description: "The perception statement, max 1 sentence" },
                      },
                      required: ["angle", "label", "text"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["teses", "percepcoes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_options" } },
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }),
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

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const fallback = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(fallback), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);

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
