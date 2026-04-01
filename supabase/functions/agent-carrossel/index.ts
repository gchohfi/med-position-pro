import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ───────────────────────────────────────────
   TravessIA — 7 Layout System
   ─────────────────────────────────────────── */

const LAYOUTS_DOC = `
## LAYOUTS DISPONÍVEIS (use EXATAMENTE estes nomes)

1. "capa" — Slide 1 SEMPRE. Campos:
   - eyebrow: texto curto acima do título (ex: "Dermatologia | Dra. Ana")
   - headline: título de impacto, MAX 6 PALAVRAS
   - img_query: busca para imagem de fundo (em inglês, descritivo)

2. "timg" — Texto + imagem lado a lado. Campos:
   - mini_titulo: rótulo curto
   - texto: explicação, MAX 50 PALAVRAS
   - img_query: busca para imagem complementar

3. "tonly" — Somente texto. Campos:
   - zone_label: rótulo da seção (ex: "Mito", "Verdade", "O que poucos sabem")
   - big_text: frase de destaque, MAX 8 PALAVRAS
   - texto: desenvolvimento, MAX 60 PALAVRAS

4. "stat" — Número de impacto. Campos:
   - stat_number: o número (ex: "73%", "3x", "1 em 4")
   - stat_unit: unidade ou contexto curto (ex: "dos pacientes", "mais eficaz")
   - texto: explicação do dado, MAX 30 PALAVRAS
   - e_dai: frase coloquial de reação, MAX 20 PALAVRAS (ex: "É... os números não mentem")

5. "turning" — Virada de perspectiva. Campos:
   - turn_text: frase de virada, MAX 8 PALAVRAS (ex: "Mas e se eu te contar que...")
   - opinion: opinião ou insight do médico, MAX 40 PALAVRAS

6. "light" — Slide leve (fundo branco). Campos:
   - mini_titulo: rótulo curto
   - texto: conteúdo leve/dica prática, MAX 50 PALAVRAS
   - img_query: (opcional) busca para imagem

7. "final" — Último slide SEMPRE. Campos:
   - conclusion: frase de fechamento, MAX 10 PALAVRAS
   - pergunta_comentario: pergunta para gerar comentários
`;

const REGRAS_TOM = `
## REGRAS DE TOM (obrigatório)
- NUNCA use travessão longo (—). Use ponto final ou vírgula.
- Frases curtas e diretas. Parágrafos de no máximo 2 linhas.
- Use dados específicos, nunca genéricos ("73% dos pacientes" em vez de "a maioria").
- Voz humana: escreva como o médico fala no consultório, não como artigo científico.
- PROIBIDO palavras de IA: "crucial", "vale ressaltar", "é importante destacar", "nesse sentido", "outrossim".
- Prefira linguagem ativa. "O colágeno regenera" em vez de "A regeneração do colágeno é promovida".
`;

const REGRAS_CFM = `
## COMPLIANCE — Resolução CFM 2.336/2023
- NÃO prometa resultados específicos de tratamentos
- NÃO use fotos de antes/depois
- NÃO exiba preços ou condições comerciais
- NÃO faça autopromoção sensacionalista
- Conteúdo DEVE ser educativo e informativo
- Mantenha ética médica em todo o conteúdo
- Cite fontes científicas quando usar dados estatísticos
`;

const BASE_SYSTEM = `Você é o roteirista da TravessIA, sistema de carrosséis médicos para Instagram.

${LAYOUTS_DOC}

${REGRAS_TOM}

${REGRAS_CFM}

## ESTRUTURA DO ROTEIRO
- Slide 1: SEMPRE layout "capa"
- Slides intermediários: combine livremente "timg", "tonly", "stat", "turning", "light"
- Último slide: SEMPRE layout "final"
- Total: entre 7 e 10 slides
- Jornada narrativa: gancho > contexto > dado > virada > aprofundamento > prática > CTA

## FORMATO DE RESPOSTA
Retorne APENAS JSON válido (sem markdown, sem texto fora do JSON):
{
  "titulo_carrossel": "...",
  "tese": "...",
  "jornada": "gancho > contexto > dado > virada > aprofundamento > prática > CTA",
  "slides": [
    {
      "numero": 1,
      "layout": "capa",
      "eyebrow": "...",
      "headline": "...",
      "img_query": "..."
    }
  ],
  "legenda": "Legenda completa para o post do Instagram (2-3 parágrafos curtos)",
  "hashtags": ["hashtag1", "hashtag2", "...até 15 hashtags relevantes"],
  "cta_final": "Frase de call-to-action para a legenda (ex: Salve este post e compartilhe com quem precisa)"
}
`;

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */

function extractJSON(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code blocks
    const stripped = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    try {
      return JSON.parse(stripped);
    } catch {
      // Last resort: find first { ... } block
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error("Não foi possível extrair JSON da resposta do Claude");
    }
  }
}

function validateRoteiro(parsed: Record<string, unknown>): void {
  if (!parsed.titulo_carrossel) {
    throw new Error("Roteiro sem titulo_carrossel");
  }
  if (!Array.isArray(parsed.slides) || parsed.slides.length < 3) {
    throw new Error("Roteiro deve ter pelo menos 3 slides");
  }
  const slides = parsed.slides as Array<Record<string, unknown>>;
  if (slides[0]?.layout !== "capa") {
    throw new Error("Primeiro slide deve ser layout 'capa'");
  }
  if (slides[slides.length - 1]?.layout !== "final") {
    throw new Error("Último slide deve ser layout 'final'");
  }
  const validLayouts = ["capa", "timg", "tonly", "stat", "turning", "light", "final"];
  for (const slide of slides) {
    if (!validLayouts.includes(slide.layout as string)) {
      throw new Error(`Layout inválido: ${slide.layout}`);
    }
  }
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

  const parsed = extractJSON(content);
  validateRoteiro(parsed);
  return parsed;
}

/* ───────────────────────────────────────────
   Main handler
   ─────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const body = await req.json();
    const action = body.action ?? "generate";
    const skill = body.skill;

    // Build system prompt with optional skill injection
    let systemPrompt = "";
    if (skill) {
      systemPrompt += `## CARROSSEL_SKILL (estilo do cliente)\n${skill}\n\n`;
    }
    systemPrompt += BASE_SYSTEM;

    let userPrompt: string;

    if (action === "rewrite") {
      /* ── Rewrite mode ── */
      const { roteiro, feedback } = body;
      if (!roteiro) throw new Error("Campo 'roteiro' é obrigatório para rewrite");
      if (!feedback) throw new Error("Campo 'feedback' é obrigatório para rewrite");

      userPrompt = `Reescreva o roteiro abaixo incorporando o feedback do cliente.

## ROTEIRO ATUAL
${JSON.stringify(roteiro, null, 2)}

## FEEDBACK DO CLIENTE
${feedback}

Mantenha os layouts válidos do sistema TravessIA. Retorne APENAS o JSON completo do novo roteiro.`;
    } else {
      /* ── Generate mode ── */
      const { profile, tese, objetivo } = body;
      if (!profile) throw new Error("Campo 'profile' é obrigatório");

      userPrompt = `Crie um roteiro completo de carrossel para este médico:

Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Pilares de conteúdo: ${Array.isArray(profile.pilares) ? profile.pilares.join(", ") : (profile.pilares ?? "Não informados")}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}

Tese central: ${tese ?? "Não informada"}
Objetivo: ${objetivo ?? "Educar e engajar"}

Gere entre 7 e 10 slides usando os layouts do sistema TravessIA.
Retorne APENAS o JSON válido.`;
    }

    const parsed = await callClaude(apiKey, systemPrompt, userPrompt);

    return new Response(JSON.stringify(parsed), {
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
