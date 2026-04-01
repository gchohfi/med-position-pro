import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

async function callPerplexity(apiKey: string, query: string): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: query }],
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
  systemPrompt: string,
  userPrompt: string,
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
      max_tokens: 4096,
      stream: false,
      system: systemPrompt,
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

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const body = await req.json();
    const { especialidade, subespecialidade, pilares, pais } = body;

    if (!especialidade) throw new Error("Campo 'especialidade' é obrigatório");

    const subEsp = subespecialidade ? ` (${subespecialidade})` : "";
    const pilaresStr = Array.isArray(pilares) ? pilares.join(", ") : (pilares ?? "");

    const searchQuery = `Top medical Instagram accounts in ${especialidade}${subEsp}. Include both Brazilian (@dra, @dr) and international accounts. For each, provide: handle, name, country, follower estimate, content style, why they stand out. Focus on doctors known for educational content, strong visual identity, and high engagement. Include at least 5 Brazilian and 5 international profiles.${pilaresStr ? ` Content pillars of interest: ${pilaresStr}.` : ""}`;

    const perplexityResult = await callPerplexity(perplexityKey, searchQuery);

    const systemPrompt = `You are an expert in medical social media marketing. Your task is to structure research about top medical Instagram profiles into a clean JSON format. Always respond with valid JSON only, no markdown or extra text.`;

    const userPrompt = `Based on the following research about top medical Instagram profiles in ${especialidade}${subEsp}, structure the data into this exact JSON format:

{
  "profiles": [
    {
      "handle": "@example",
      "nome": "Dr. Example",
      "pais": "BR",
      "especialidade": "${especialidade}",
      "seguidores_estimado": "150K",
      "estilo_conteudo": "Description of content style",
      "por_que_inspirar": "Why this profile is inspiring",
      "pilares_conteudo": ["pillar1", "pillar2"],
      "formatos_destaque": ["carrossel", "reels educativos"],
      "nivel_referencia": "alto"
    }
  ],
  "insights_gerais": "Summary of trends found across profiles"
}

Rules:
- "pais" must be "BR" for Brazilian profiles or the 2-letter country code for international ones (US, UK, etc.)
- "nivel_referencia" must be "alto", "medio", or "emergente"
- Include at least 5 Brazilian and 5 international profiles if available
- If the research doesn't have enough data for a field, make a reasonable inference based on the specialty

Research data:
${perplexityResult}`;

    const structured = await callClaude(anthropicKey, systemPrompt, userPrompt);

    return new Response(JSON.stringify(structured), {
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
