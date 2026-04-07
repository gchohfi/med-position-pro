import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

const ESPECIALIDADES = [
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Oftalmologia",
  "Nutrologia",
  "Endocrinologia",
  "Cirurgia Plástica",
  "Psiquiatria",
  "Medicina Estética",
  "Outra",
] as const;

const SYSTEM_PROMPT = `Você é um assistente que estrutura dados de perfis médicos do Instagram. A partir das informações fornecidas, extraia e organize os dados no formato JSON especificado. Se não encontrar informação para um campo, use string vazia. Para especialidade, use EXATAMENTE um destes valores: ${ESPECIALIDADES.join(", ")}. Inclua "instagram" na lista de plataformas.

Retorne APENAS JSON válido (sem markdown, sem texto fora do JSON) com esta estrutura:
{
  "nome": "string — nome completo do médico",
  "especialidade": "string — uma das especialidades listadas acima",
  "subespecialidade": "string — subespecialidade se identificada",
  "crm": "",
  "cidade": "string — cidade se identificada",
  "estado": "string — sigla do estado (2 letras) se identificado",
  "plataformas": ["instagram"],
  "publico_alvo": "string — público-alvo aparente",
  "tom_de_voz": "string — tom de comunicação identificado",
  "diferenciais": ["string — diferenciais identificados"],
  "objetivos": [],
  "bio_instagram": "string — biografia do Instagram se encontrada",
  "confidence": 0.0
}

O campo "confidence" deve ser um número entre 0 e 1 indicando quanta informação foi encontrada. 1.0 = todos os campos preenchidos, 0.0 = nenhum campo encontrado.`;

async function callLovableAI(systemPrompt: string, userMessage: string): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("AI gateway error:", res.status, text);
    if (res.status === 429) throw new Error("Rate limit exceeded, tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA insuficientes.");
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  // Strip markdown fences if present
  const cleaned = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response:", cleaned);
    throw new Error("AI retornou resposta inválida");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const body = await req.json();
    let handle = body.handle?.trim();
    if (!handle) throw new Error("Campo 'handle' é obrigatório");

    if (!handle.startsWith("@")) {
      handle = `@${handle}`;
    }

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    let result: Record<string, unknown>;

    if (perplexityKey) {
      try {
        const profileInfo = await callPerplexityText(
          perplexityKey,
          [
            {
              role: "user",
              content: `Analise o perfil do Instagram ${handle}. Qual o nome completo, especialidade médica, biografia, público-alvo aparente, tom de comunicação, pilares de conteúdo e diferenciais?`,
            },
          ],
        );

        result = await callLovableAI(
          SYSTEM_PROMPT,
          `Aqui estão as informações coletadas sobre o perfil do Instagram ${handle}:\n\n${profileInfo}\n\nEstruture esses dados no formato JSON especificado.`,
        );
      } catch (perplexityErr) {
        console.warn("Perplexity failed, falling back to AI only:", (perplexityErr as Error).message);
        result = await callLovableAI(
          SYSTEM_PROMPT,
          `Com base no seu conhecimento, tente identificar informações sobre o perfil médico do Instagram ${handle}. Este é um médico brasileiro que usa o Instagram para divulgar conteúdo. Estruture o que conseguir encontrar no formato JSON especificado. Se não tiver informações suficientes, preencha o que for possível e use confidence baixo.`,
        );
      }
    } else {
      console.warn("PERPLEXITY_API_KEY not set, using AI only");
      result = await callLovableAI(
        SYSTEM_PROMPT,
        `Com base no seu conhecimento, tente identificar informações sobre o perfil médico do Instagram ${handle}. Este é um médico brasileiro que usa o Instagram para divulgar conteúdo. Estruture o que conseguir encontrar no formato JSON especificado. Se não tiver informações suficientes, preencha o que for possível e use confidence baixo.`,
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
