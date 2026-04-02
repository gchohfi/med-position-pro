import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini, errorResponse } from "../_shared/gemini.ts";
import { extractJSON } from "../_shared/json.ts";

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

    const {
      tipo, objetivo, archetype, pillar, tone, targetAudience, goals, specialty,
      recentTheses, recentPerceptions, activeSeries, memoryHighlights, calendarContext, radarSignals,
    } = await req.json();

    if (!tipo || !objetivo) {
      return errorResponse("Tipo e objetivo são obrigatórios.", 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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

    const response = await callGemini(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: "You generate structured JSON with arrays. Always include the full teses and percepcoes arrays with exactly 3 items each as instructed. Respond in Portuguese (Brazil)." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const result = typeof content === "object" ? content : extractJSON(content);
    if (!result.teses?.length || !(result as any).percepcoes?.length) throw new Error("Incomplete response");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", (err as Error)?.message || err);
    return errorResponse("Erro ao gerar sugestões.", 500);
  }
});
