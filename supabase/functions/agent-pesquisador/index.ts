import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ───────────────────────────────────────────
   Perplexity search helper
   ─────────────────────────────────────────── */

interface PerplexityResult {
  titulo: string;
  link: string;
  resumo: string;
  fonte: string;
}

async function searchPerplexity(
  apiKey: string,
  query: string,
): Promise<PerplexityResult[]> {
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
          role: "system",
          content:
            "Você é um pesquisador de conteúdo médico para Instagram. Retorne resultados relevantes com título, link, resumo e fonte. Responda em português.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const citations: string[] = data.citations ?? [];

  // Parse results from Perplexity's response into structured items
  const articles: PerplexityResult[] = [];
  const lines = text.split("\n").filter((l: string) => l.trim());

  // Extract article-like blocks from the response
  let currentArticle: Partial<PerplexityResult> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    // Lines starting with numbers or bullets often denote new items
    if (/^(\d+[\.\)]\s|[-*]\s)/.test(trimmed)) {
      if (currentArticle.titulo && currentArticle.resumo) {
        articles.push({
          titulo: currentArticle.titulo,
          link: currentArticle.link ?? "",
          resumo: currentArticle.resumo,
          fonte: currentArticle.fonte ?? "Perplexity",
        });
      }
      const cleaned = trimmed.replace(/^(\d+[\.\)]\s|[-*]\s)/, "").trim();
      currentArticle = { titulo: cleaned, resumo: "" };
    } else if (currentArticle.titulo) {
      // URL detection
      const urlMatch = trimmed.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        currentArticle.link = urlMatch[0];
        currentArticle.fonte = new URL(urlMatch[0]).hostname;
      }
      currentArticle.resumo = currentArticle.resumo
        ? currentArticle.resumo + " " + trimmed
        : trimmed;
    }
  }
  // Push last article
  if (currentArticle.titulo) {
    articles.push({
      titulo: currentArticle.titulo,
      link: currentArticle.link ?? "",
      resumo: currentArticle.resumo ?? "",
      fonte: currentArticle.fonte ?? "Perplexity",
    });
  }

  // If parsing yielded nothing, wrap the whole response as one item
  if (articles.length === 0) {
    articles.push({
      titulo: query,
      link: citations[0] ?? "",
      resumo: text.slice(0, 500),
      fonte: citations[0] ? new URL(citations[0]).hostname : "Perplexity",
    });
  }

  // Attach any remaining citations
  for (let i = 0; i < articles.length && i < citations.length; i++) {
    if (!articles[i].link && citations[i]) {
      articles[i].link = citations[i];
      try {
        articles[i].fonte = new URL(citations[i]).hostname;
      } catch {
        // keep existing fonte
      }
    }
  }

  return articles;
}

/* ───────────────────────────────────────────
   Claude ranking helper
   ─────────────────────────────────────────── */

interface RankingResult {
  materia_principal: { indice: number; titulo: string; motivo: string };
  carrosseis: Array<{ indice: number; titulo: string; motivo: string }>;
}

async function rankWithClaude(
  apiKey: string,
  artigos: PerplexityResult[],
  profile: { especialidade?: string; pilares?: string[]; publico_alvo?: string },
): Promise<RankingResult> {
  const artigosText = artigos
    .map((a, i) => `[${i}] "${a.titulo}" — ${a.resumo?.slice(0, 200)}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      stream: false,
      system: `Você é um curador de conteúdo médico para Instagram. Analise os artigos e ranqueie por:
1. Relevância para a especialidade do médico
2. Potencial de engajamento no Instagram
3. Profundidade analítica (dados, estudos, tendências)

Retorne APENAS JSON:
{
  "materia_principal": { "indice": 0, "titulo": "...", "motivo": "..." },
  "carrosseis": [
    { "indice": 0, "titulo": "Sugestão de título para carrossel", "motivo": "..." }
  ]
}
Sugira 2-4 ideias de carrossel baseadas nos artigos.`,
      messages: [
        {
          role: "user",
          content: `Especialidade: ${profile.especialidade ?? "Não informada"}
Pilares: ${Array.isArray(profile.pilares) ? profile.pilares.join(", ") : "Não informados"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}

ARTIGOS ENCONTRADOS:
${artigosText}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

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
      if (match) return JSON.parse(match[0]);
      throw new Error("Não foi possível extrair ranking JSON");
    }
  }
}

/* ───────────────────────────────────────────
   Main handler
   ─────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile } = await req.json();
    if (!profile) throw new Error("Campo 'profile' é obrigatório");

    const especialidade = profile.especialidade ?? "medicina geral";
    const pilares = Array.isArray(profile.pilares)
      ? profile.pilares.join(", ")
      : (profile.pilares ?? "");

    // Build 2-3 search queries tailored to the specialty
    const queries = [
      `tendências ${especialidade} Instagram 2026 conteúdo médico`,
      `conteúdo médico engajamento ${especialidade} redes sociais`,
    ];
    if (pilares) {
      queries.push(`${pilares} novidades pesquisa ${especialidade} 2026`);
    }

    // Run Perplexity searches in parallel
    const searchResults = await Promise.all(
      queries.map((q) => searchPerplexity(perplexityKey, q)),
    );

    // Deduplicate articles by title similarity
    const allArticles: PerplexityResult[] = [];
    const seenTitles = new Set<string>();
    for (const results of searchResults) {
      for (const article of results) {
        const key = article.titulo.toLowerCase().slice(0, 40);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allArticles.push(article);
        }
      }
    }

    // Rank with Claude
    const ranking = await rankWithClaude(anthropicKey, allArticles, profile);

    return new Response(
      JSON.stringify({ artigos: allArticles, ranking }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
