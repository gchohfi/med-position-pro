import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

/* ───────────────────────────────────────────
   Types
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
  const text = await callPerplexityText(
    apiKey,
    [
      {
        role: "system",
        content:
          "Você é um pesquisador de conteúdo médico para Instagram. Retorne resultados relevantes com título, link, resumo e fonte. Responda em português.",
      },
      { role: "user", content: query },
    ],
    "sonar",
    { max_tokens: 2048 },
  );

  const articles: PerplexityResult[] = [];
  const lines = text.split("\n").filter((l: string) => l.trim());

  let currentArticle: Partial<PerplexityResult> = {};
  for (const line of lines) {
    const trimmed = line.trim();
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
  if (currentArticle.titulo) {
    articles.push({
      titulo: currentArticle.titulo,
      link: currentArticle.link ?? "",
      resumo: currentArticle.resumo ?? "",
      fonte: currentArticle.fonte ?? "Perplexity",
    });
  }

  if (articles.length === 0) {
    articles.push({
      titulo: query,
      link: "",
      resumo: text.slice(0, 500),
      fonte: "Perplexity",
    });
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

  const systemPrompt = `Você é um curador de conteúdo médico para Instagram. Analise os artigos e ranqueie por:
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
Sugira 2-4 ideias de carrossel baseadas nos artigos.`;

  const userPrompt = `Especialidade: ${profile.especialidade ?? "Não informada"}
Pilares: ${Array.isArray(profile.pilares) ? profile.pilares.join(", ") : "Não informados"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}

ARTIGOS ENCONTRADOS:
${artigosText}`;

  return await callClaude(apiKey, systemPrompt, userPrompt, { maxTokens: 1500 }) as unknown as RankingResult;
}

/* ───────────────────────────────────────────
   Main handler
   ─────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

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

    const queries = [
      `tendências ${especialidade} Instagram 2026 conteúdo médico`,
      `conteúdo médico engajamento ${especialidade} redes sociais`,
    ];
    if (pilares) {
      queries.push(`${pilares} novidades pesquisa ${especialidade} 2026`);
    }

    const searchResults = await Promise.all(
      queries.map((q) => searchPerplexity(perplexityKey, q)),
    );

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
