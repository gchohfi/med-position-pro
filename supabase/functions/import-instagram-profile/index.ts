import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const CLAUDE_SYSTEM_PROMPT = `Você é um assistente que estrutura dados de perfis médicos do Instagram. A partir das informações fornecidas, extraia e organize os dados no formato JSON especificado. Se não encontrar informação para um campo, use string vazia. Para especialidade, use EXATAMENTE um destes valores: ${ESPECIALIDADES.join(", ")}. Inclua "instagram" na lista de plataformas.

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

function extractJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error("Não foi possível extrair JSON da resposta");
    }
  }
}

async function callPerplexity(
  apiKey: string,
  handle: string,
): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `Analise o perfil do Instagram ${handle}. Qual o nome completo, especialidade médica, biografia, público-alvo aparente, tom de comunicação, pilares de conteúdo e diferenciais?`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(
  apiKey: string,
  profileInfo: string,
  handle: string,
): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      stream: false,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Aqui estão as informações coletadas sobre o perfil do Instagram ${handle}:\n\n${profileInfo}\n\nEstruture esses dados no formato JSON especificado.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error("Resposta vazia do Claude");
  }

  return extractJSON(content);
}

async function callClaudeDirect(
  apiKey: string,
  handle: string,
): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      stream: false,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Com base no seu conhecimento, tente identificar informações sobre o perfil médico do Instagram ${handle}. Este é um médico brasileiro que usa o Instagram para divulgar conteúdo. Estruture o que conseguir encontrar no formato JSON especificado. Se não tiver informações suficientes, preencha o que for possível e use confidence baixo.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error("Resposta vazia do Claude");
  }

  return extractJSON(content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const body = await req.json();
    let handle = body.handle?.trim();
    if (!handle) throw new Error("Campo 'handle' é obrigatório");

    // Normalize handle
    if (!handle.startsWith("@")) {
      handle = `@${handle}`;
    }

    let result: Record<string, unknown>;

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (perplexityKey) {
      try {
        // Step 1: Research with Perplexity
        const profileInfo = await callPerplexity(perplexityKey, handle);

        // Step 2: Structure with Claude
        result = await callClaude(anthropicKey, profileInfo, handle);
      } catch (perplexityErr) {
        console.warn(
          "Perplexity failed, falling back to Claude only:",
          (perplexityErr as Error).message,
        );
        // Fallback: use Claude alone
        result = await callClaudeDirect(anthropicKey, handle);
      }
    } else {
      console.warn("PERPLEXITY_API_KEY not set, using Claude only");
      result = await callClaudeDirect(anthropicKey, handle);
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
