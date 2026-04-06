import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";

/**
 * discover-inspiration — Discovery ONLY (suggests candidates)
 *
 * Input:  { especialidade, subespecialidade?, pilares? }
 * Output: { candidates: [{ handle, confidence, source, display_name?, reason? }] }
 *
 * This function does NOT verify profiles. It does NOT analyze content.
 * It returns candidate handles with a confidence level so the frontend
 * can present them for user review before verification.
 */

interface Candidate {
  handle: string;
  confidence: "high" | "medium" | "low";
  source: string;
  display_name?: string;
  reason?: string;
  country?: string;
  specialty?: string;
  followers_estimate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const body = await req.json();
    const { especialidade, subespecialidade, pilares } = body;

    if (!especialidade) throw new Error("Campo 'especialidade' é obrigatório");

    const subEsp = subespecialidade ? ` (${subespecialidade})` : "";
    const pilaresStr = pilares && Array.isArray(pilares) && pilares.length > 0
      ? pilares.join(", ")
      : "";

    // Targeted Perplexity searches — specific queries, not generic
    const queries = [
      `Quais são os @handles reais de médicos brasileiros de ${especialidade}${subEsp} no Instagram que produzem conteúdo educativo? Preciso dos handles EXATOS com @ que existem no Instagram. Foque em perfis com mais de 10k seguidores que postam regularmente.${pilaresStr ? ` Temas relevantes: ${pilaresStr}` : ""}`,
      `Best international ${especialidade} doctors on Instagram 2024 2025. List their real Instagram @handles. Focus on physicians who create educational content, carousels, reels about ${especialidade}${subEsp}. Only list handles you are confident actually exist.`,
      `site:instagram.com "${especialidade}" médico médica doutor doutora Brasil conteúdo educativo. Liste os @handles encontrados.${pilaresStr ? ` Foco em: ${pilaresStr}` : ""}`,
    ];

    const searchResults = await Promise.all(
      queries.map((q) =>
        callPerplexityText(perplexityKey, [{ role: "user", content: q }])
      ),
    );

    const combinedResearch = searchResults
      .map((r, i) => `### Busca ${i + 1}\n${r}`)
      .join("\n\n---\n\n");

    // Ask Claude to extract ONLY candidate handles — no analysis, no verification claims
    const systemPrompt = `Você é um especialista em marketing médico no Instagram. Sua tarefa é extrair CANDIDATOS a perfis reais do Instagram mencionados na pesquisa. NUNCA invente handles. Se não encontrar handles explícitos, retorne lista vazia. Responda APENAS com JSON válido.`;

    const userPrompt = `Analise os resultados de pesquisa abaixo e extraia CANDIDATOS a perfis de Instagram.

REGRAS CRÍTICAS:
- APENAS inclua handles que foram EXPLICITAMENTE mencionados com @ na pesquisa
- NUNCA invente ou adivinhe handles
- NÃO afirme que perfis são verificados — eles são apenas CANDIDATOS
- Atribua um nível de confiança: "high" se o handle apareceu em múltiplas buscas com contexto claro, "medium" se apareceu uma vez com contexto, "low" se foi mencionado vagamente
- É melhor retornar 3 candidatos reais do que 10 duvidosos

Formato de resposta:
{
  "candidates": [
    {
      "handle": "@handle_exato",
      "confidence": "high",
      "source": "Descricao breve de onde veio",
      "display_name": "Nome se mencionado",
      "reason": "Por que é relevante para ${especialidade}",
      "country": "BR",
      "specialty": "${especialidade}",
      "followers_estimate": "numero se mencionado ou null"
    }
  ]
}

Pesquisa:
${combinedResearch}`;

    const structured = await callClaude(anthropicKey, systemPrompt, userPrompt) as {
      candidates?: Candidate[];
    };

    const candidates = (structured.candidates ?? []).map((c) => ({
      ...c,
      handle: c.handle.startsWith("@") ? c.handle : `@${c.handle}`,
    }));

    return new Response(
      JSON.stringify({ candidates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
