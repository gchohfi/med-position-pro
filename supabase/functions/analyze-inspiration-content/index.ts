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
      max_tokens: 8192,
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
    const { handles, especialidade, objetivo } = body;

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      throw new Error("Campo 'handles' é obrigatório (array de handles)");
    }

    // Research each handle via Perplexity
    const researchResults: { handle: string; research: string }[] = [];

    for (const handle of handles) {
      const query = `Analyze the Instagram content strategy of ${handle} (medical/health professional in ${especialidade ?? "medicine"}). What are their most engaging post topics? What formats do they use (carrossel, reels, stories)? What hooks/headlines work best? What's their visual style? What content gaps exist? Provide specific post examples if possible. ${objetivo ? `Focus on: ${objetivo}` : ""}`;

      const research = await callPerplexity(perplexityKey, query);
      researchResults.push({ handle, research });
    }

    const allResearch = researchResults
      .map((r) => `### ${r.handle}\n${r.research}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert in medical Instagram content strategy. Your task is to create a structured analysis of medical Instagram profiles. Always respond with valid JSON only, no markdown or extra text.`;

    const userPrompt = `Based on the following research about medical Instagram profiles, create a structured analysis in this exact JSON format:

{
  "analises": [
    {
      "handle": "@example",
      "estrategia_resumo": "Brief summary of their content strategy",
      "topicos_mais_engajados": ["topic1", "topic2"],
      "formatos_eficazes": ["carrossel 7-10 slides", "reels < 30s"],
      "hooks_eficazes": ["Você sabia que...", "O erro mais comum..."],
      "estilo_visual": "Description of visual style",
      "gaps_conteudo": ["Doesn't cover X", "Little content about Y"],
      "ideias_inspiradas": [
        {
          "titulo": "Content idea title",
          "formato": "carrossel",
          "tese": "Main thesis for this content piece",
          "por_que_funciona": "Why this idea would work"
        }
      ]
    }
  ],
  "oportunidades_cruzadas": ["Cross-opportunity 1", "Cross-opportunity 2"],
  "tendencias_formato": "Description of format trends across all analyzed profiles"
}

Rules:
- Generate at least 3 content ideas per profile in "ideias_inspiradas"
- "formato" must be one of: "carrossel", "reels", "static", "stories"
- Write all text in Brazilian Portuguese
- Be specific with hooks and topics, not generic
- Each "tese" should be a complete thesis that could be directly used to create content

Research data:
${allResearch}`;

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
