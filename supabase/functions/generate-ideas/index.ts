import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

/**
 * generate-ideas — Multi-purpose idea generation
 *
 * Input:  { mode, especialidade, subespecialidade?, publico_alvo?, tom_de_voz?, pilares? }
 * mode: "inspiracao" | "radar" | "benchmark"
 */

const SYSTEM_PROMPTS: Record<string, string> = {
  inspiracao: `Você é um estrategista de conteúdo médico para Instagram, especialista em carrosséis educativos.

Gere ideias criativas e provocativas de carrossel baseadas em tendências reais.
- Títulos PROVOCATIVOS: "Você está fazendo ERRADO", "5 verdades que ninguém te conta sobre..."
- Teses afirmativas que gerem curiosidade
- Varie formatos: mitos vs verdades, passo a passo, dados impactantes, comparativos, erros comuns
- Respeite CFM 2.336/2023: sem promessas de resultado, sem antes/depois
Responda APENAS com JSON válido.`,

  radar: `Você é um analista de inteligência competitiva para médicos no Instagram.

Analise o cenário competitivo da especialidade informada:
- Identifique tipos de conteúdo que concorrentes estão fazendo com sucesso
- Aponte lacunas de conteúdo (temas que ninguém aborda bem)
- Sugira diferenciais estratégicos
- Analise formatos que estão performando melhor (carrossel, reels, stories)
Responda APENAS com JSON válido.`,

  benchmark: `Você é um analista estratégico de benchmarks de conteúdo médico para Instagram.

Sua tarefa: criar perfis detalhados de referências internacionais FICTÍCIAS mas realistas,
baseados em padrões reais de perfis médicos de sucesso no Instagram.

Para cada referência, analise:
- Posicionamento percebido e sensação de marca
- Estilo editorial e visual dominante
- Tipo de hook e CTA
- Forças e fraquezas estratégicas
- Como adaptar para outra médica brasileira

Responda APENAS com JSON válido.`,
};

const PERPLEXITY_QUERIES: Record<string, (esp: string) => string[]> = {
  inspiracao: (esp) => [
    `Trending Instagram carousel topics for ${esp} doctors April 2026. What health topics are going viral? What patient questions are trending?`,
    `Temas mais engajados no Instagram médico de ${esp} em abril 2026. Campanhas de saúde, mitos populares, tendências.`,
  ],
  radar: (esp) => [
    `Top performing ${esp} doctors on Instagram 2026. What content strategies are they using? What formats get most engagement?`,
    `Perfis médicos de ${esp} mais bem-sucedidos no Instagram Brasil 2026. Estratégias, formatos, frequência de postagem.`,
  ],
  benchmark: (esp) => [
    `International medical content trends for ${esp} on social media 2026. Best practices from US, Europe, Asia doctors on Instagram and TikTok.`,
    `Innovative medical education content formats used by top ${esp} influencers globally 2026. What's working in US, UK, Germany, Korea?`,
  ],
};

const USER_PROMPTS: Record<string, (ctx: any) => string> = {
  inspiracao: (ctx) => `Gere 8 ideias de carrossel para:
Especialidade: ${ctx.especialidade}${ctx.sub}
Público-alvo: ${ctx.publico_alvo}
Tom: ${ctx.tom_de_voz}
${ctx.pilaresStr ? `Pilares: ${ctx.pilaresStr}` : ""}
${ctx.perplexityContext ? `\n## TENDÊNCIAS REAIS\n${ctx.perplexityContext}\n` : ""}

Formato:
{
  "ideias": [
    {
      "titulo": "Título chamativo",
      "tese": "Afirmação provocativa central",
      "objetivo": "O que espera alcançar",
      "formato": "mitos_verdades | passo_a_passo | dados_impacto | comparativo | erros_comuns",
      "por_que": "Por que funciona agora",
      "urgencia": "alta | media | baixa"
    }
  ]
}`,

  radar: (ctx) => `Analise o cenário competitivo para:
Especialidade: ${ctx.especialidade}${ctx.sub}
Público-alvo: ${ctx.publico_alvo}
${ctx.perplexityContext ? `\n## DADOS DE MERCADO\n${ctx.perplexityContext}\n` : ""}

Formato:
{
  "panorama": "Resumo do cenário competitivo em 2-3 frases",
  "concorrentes_referencia": [
    {
      "tipo_perfil": "Descrição do tipo de concorrente",
      "estrategia": "O que estão fazendo bem",
      "ponto_fraco": "Onde falham ou deixam lacuna"
    }
  ],
  "lacunas": [
    {
      "tema": "Tema não explorado",
      "oportunidade": "Como aproveitar",
      "potencial": "alto | medio"
    }
  ],
  "diferenciais_sugeridos": [
    {
      "diferencial": "O que fazer diferente",
      "como_aplicar": "Ação prática",
      "impacto_esperado": "Resultado esperado"
    }
  ]
}`,

  benchmark: (ctx) => `Pesquise benchmarks internacionais para:
Especialidade: ${ctx.especialidade}${ctx.sub}
${ctx.perplexityContext ? `\n## TENDÊNCIAS INTERNACIONAIS\n${ctx.perplexityContext}\n` : ""}

Formato:
{
  "tendencias_globais": [
    {
      "tendencia": "Nome/descrição da tendência",
      "origem": "País/região de origem",
      "exemplo": "Exemplo concreto de aplicação",
      "adaptacao_brasil": "Como adaptar para médica brasileira"
    }
  ],
  "formatos_inovadores": [
    {
      "formato": "Nome do formato",
      "descricao": "Como funciona",
      "por_que_funciona": "Motivo do sucesso",
      "ideia_carrossel": "Sugestão de carrossel usando este formato"
    }
  ],
  "insights": [
    {
      "insight": "Observação estratégica",
      "acao": "O que a médica pode fazer a partir disso"
    }
  ]
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const body = await req.json();
    const { mode, especialidade, subespecialidade, publico_alvo, tom_de_voz, pilares } = body;

    if (!mode || !SYSTEM_PROMPTS[mode]) {
      throw new Error("Campo 'mode' obrigatório: inspiracao | radar | benchmark");
    }
    if (!especialidade) throw new Error("Campo 'especialidade' é obrigatório");

    const sub = subespecialidade ? ` (${subespecialidade})` : "";
    const pilaresStr = Array.isArray(pilares) && pilares.length > 0 ? pilares.join(", ") : "";

    // Perplexity enrichment
    let perplexityContext = "";
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (perplexityKey) {
      try {
        const queries = PERPLEXITY_QUERIES[mode](especialidade + sub);
        const results = await Promise.all(
          queries.map((q) =>
            callPerplexityText(perplexityKey, [{ role: "user", content: q }], "sonar")
              .catch(() => "")
          ),
        );
        perplexityContext = results.filter(Boolean).join("\n\n---\n\n");
      } catch { /* continue without */ }
    }

    const ctx = {
      especialidade,
      sub,
      publico_alvo: publico_alvo ?? "Pacientes em geral",
      tom_de_voz: tom_de_voz ?? "Educativo e acolhedor",
      pilaresStr,
      perplexityContext,
    };

    const result = await callClaude("", SYSTEM_PROMPTS[mode], USER_PROMPTS[mode](ctx));

    return new Response(JSON.stringify({ mode, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = (err as Error).message?.includes("Rate limit") ? 429
      : (err as Error).message?.includes("Credits") ? 402
      : 500;
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
