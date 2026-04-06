import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";
import { sanitizeInput, sanitizeArray } from "../_shared/sanitize.ts";

/**
 * suggest-carousel-topics — Auto-generates carousel topic suggestions
 *
 * Input:  { especialidade, subespecialidade?, publico_alvo?, tom_de_voz?, pilares? }
 * Output: { sugestoes: [{ titulo, tese, objetivo, formato, por_que, urgencia }] }
 *
 * Flow:
 * 1. Perplexity searches for trending topics in the specialty
 * 2. Claude structures 8-10 actionable carousel ideas
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    const body = await req.json();
    const especialidade = sanitizeInput(body.especialidade, 200);
    const subespecialidade = sanitizeInput(body.subespecialidade, 200);
    const publico_alvo = sanitizeInput(body.publico_alvo, 300);
    const tom_de_voz = sanitizeInput(body.tom_de_voz, 200);
    const pilares = sanitizeArray(body.pilares);

    if (!especialidade) throw new Error("Campo 'especialidade' é obrigatório");

    const subEsp = subespecialidade ? ` (${subespecialidade})` : "";
    const pilaresStr = pilares.length > 0 ? pilares.join(", ") : "";

    // Step 1: Get real trending data from Perplexity
    let perplexityContext = "";
    if (perplexityKey) {
      try {
        const queries = [
          `Quais são os temas mais virais e engajados sobre ${especialidade}${subEsp} no Instagram médico em abril 2026? Liste tópicos específicos que estão gerando salvamentos, compartilhamentos e comentários. Inclua dados de campanhas de saúde em andamento.`,
          `Trending medical content topics for ${especialidade} on Instagram April 2026. What questions are patients asking most? What myths are being debunked? What seasonal health concerns are top of mind?`,
        ];

        const results = await Promise.all(
          queries.map((q) =>
            callPerplexityText(perplexityKey, [{ role: "user", content: q }], "sonar")
              .catch(() => "")
          ),
        );

        perplexityContext = results.filter(Boolean).join("\n\n---\n\n");
      } catch {
        // Continue without Perplexity
      }
    }

    // Step 2: Claude generates structured suggestions
    const systemPrompt = `Você é um estrategista de conteúdo médico para Instagram, especialista em carrosséis educativos de alto engajamento.

Suas referências de sucesso são perfis como @clinicacintiamartins (1.2M seguidores), @dra.daniaidar (384k), @rithacapelato_dermato (361k), @marinacristofani (396k) — perfis que combinam autoridade médica com linguagem acessível e hooks provocativos.

Sua tarefa é gerar sugestões de pautas PRONTAS PARA USAR na geração de carrosséis.

REGRAS:
- Títulos devem ser PROVOCATIVOS e chamativos, no estilo: "Você está passando protetor solar ERRADO", "Tomei X e AGORA?", "5 verdades que ninguém te conta sobre..."
- Cada tese deve ser uma AFIRMAÇÃO provocativa que gere curiosidade (não uma pergunta)
- Objetivos devem ser claros: educar, gerar salvamentos, provocar comentários
- Priorize temas atuais e sazonais quando houver dados
- Varie os formatos: mitos vs verdades, passo a passo, dados impactantes, comparativos, erros comuns
- Tom: acessível, coloquial, como se a médica estivesse conversando com a paciente
- Respeite CFM 2.336/2023: sem promessas de resultado, sem antes/depois

Responda APENAS com JSON válido.`;

    const userPrompt = `Gere 8 sugestões de carrossel para este perfil médico:

Especialidade: ${especialidade}${subEsp}
Público-alvo: ${publico_alvo ?? "Pacientes em geral"}
Tom de voz: ${tom_de_voz ?? "Educativo e acolhedor"}
${pilaresStr ? `Pilares de conteúdo: ${pilaresStr}` : ""}

${perplexityContext ? `## DADOS REAIS DE TENDÊNCIAS (use obrigatoriamente para inspirar as sugestões)\n${perplexityContext}\n` : ""}

Formato de resposta:
{
  "sugestoes": [
    {
      "titulo": "Título curto e chamativo do carrossel",
      "tese": "Afirmação provocativa ou educativa que será a tese central do carrossel",
      "objetivo": "Objetivo claro: Ex: Educar sobre proteção solar e gerar salvamentos",
      "formato": "mitos_verdades | passo_a_passo | dados_impacto | comparativo | erros_comuns | explicacao | dica_pratica | alerta",
      "por_que": "Por que este tema funciona agora (tendência, sazonalidade, dúvida frequente)",
      "urgencia": "alta | media | baixa"
    }
  ]
}

Gere exatamente 8 sugestões variadas.`;

    const result = await callClaude(anthropicKey, systemPrompt, userPrompt) as {
      sugestoes?: unknown[];
    };

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
