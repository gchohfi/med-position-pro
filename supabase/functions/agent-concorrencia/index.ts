import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";

const SYSTEM_PROMPT = `Você é um analista de inteligência competitiva para médicos no Instagram. A data de hoje é abril de 2026.

Você receberá dados de pesquisa REAL coletados via Perplexity sobre os concorrentes informados. Use esses dados como base factual. Identifique padrões, diferenciais, lacunas exploráveis e oportunidades de posicionamento. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
## 1. Panorama Competitivo
Visão geral da especialidade no Instagram em abril 2026.

## 2. Análise Individual dos Concorrentes
Para cada concorrente: posicionamento, forças, fraquezas, estratégia de conteúdo.

## 3. Padrões de Conteúdo do Nicho
O que todos estão fazendo (formatos, temas, frequência, tom).

## 4. Lacunas Exploráveis
O que ninguém está fazendo bem — oportunidades abertas.

## 5. Oportunidades de Diferenciação
Como o médico pode se posicionar de forma única.

## 6. Estratégias Recomendadas
3 a 5 ações concretas para se destacar no cenário competitivo atual.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const { profile, concorrentes, autoDiscover } = await req.json();

    const especialidade = profile.especialidade ?? "Medicina geral";

    // ── AUTO-DISCOVER MODE ────────────────────────────────────────────────────
    if (autoDiscover && (!concorrentes || concorrentes.length === 0)) {
      if (!perplexityKey) {
        return new Response(
          JSON.stringify({ error: "PERPLEXITY_API_KEY não configurada" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const discoveryQuery = `Quais são os principais médicos de ${especialidade} com grande presença no Instagram no Brasil em 2026? Liste os handles (@usuario) dos perfis mais influentes e seguidos. Inclua pelo menos 5 perfis reais e ativos.`;

      const discoveryResult = await callPerplexityText(
        perplexityKey,
        [
          {
            role: "system",
            content: "Você é um assistente de pesquisa especializado em marketing médico digital. Liste apenas handles reais do Instagram no formato @usuario.",
          },
          {
            role: "user",
            content: discoveryQuery,
          },
        ],
        "sonar",
        { search_recency_filter: "month" },
      );

      // Extract @handles from the Perplexity response
      const handleRegex = /@[\w.]+/g;
      const rawHandles = discoveryResult.match(handleRegex) ?? [];

      // Deduplicate and take up to 8 handles
      const handles = [...new Set(rawHandles)].slice(0, 8);

      return new Response(
        JSON.stringify({ discovered: true, handles, raw: discoveryResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── NORMAL ANALYSIS MODE ──────────────────────────────────────────────────
    const concorrentesList: string[] = Array.isArray(concorrentes)
      ? concorrentes
      : (concorrentes ?? "").split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);

    // Step 1: Research each competitor with Perplexity
    let perplexityContext = "";
    if (perplexityKey && concorrentesList.length > 0) {
      try {
        const competitorQuery = `Pesquise o conteúdo e estratégia do Instagram dos seguintes médicos/perfis de ${especialidade}: ${concorrentesList.join(", ")}. Para cada um, descreva: tipo de conteúdo publicado, frequência, engajamento estimado, temas abordados, estilo de comunicação e diferenciais percebidos. Data: abril 2026.`;

        perplexityContext = await callPerplexityText(
          perplexityKey,
          [
            {
              role: "system",
              content: "Você é um analista de redes sociais especializado em marketing médico. Pesquise e descreva os perfis solicitados de forma objetiva.",
            },
            {
              role: "user",
              content: competitorQuery,
            },
          ],
          "sonar",
          { search_recency_filter: "month" },
        );
      } catch (e) {
        console.log("[Perplexity] falhou, prosseguindo sem dados em tempo real:", e);
      }
    }

    // Step 2: Build enriched prompt for Claude
    const userPrompt = `Perfil do médico:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${especialidade}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

Concorrentes para análise:
${concorrentesList.join("\n")}

${perplexityContext ? `--- DADOS DE PESQUISA ATUAL (Perplexity, abril 2026) ---\n${perplexityContext}\n--- FIM DOS DADOS DE PESQUISA ---\n\n` : ""}Realize uma análise competitiva completa usando os dados de pesquisa acima como base factual, identificando como o médico pode se diferenciar neste cenário.`;

    // Step 3: Stream Claude analysis
    const res = await callClaudeStream(anthropicKey, SYSTEM_PROMPT, userPrompt);
    const stream = buildAnthropicStream(res);

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
