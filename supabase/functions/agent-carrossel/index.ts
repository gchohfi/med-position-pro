import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { safeJsonParse } from "../_shared/json-utils.ts";

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

6b. "timeline" — Jornada ou protocolo em etapas. Campos:
   - timeline_titulo: título acima das etapas, MAX 6 PALAVRAS (ex: "O protocolo em 4 passos")
   - timeline_subtitulo: contexto ou promessa, MAX 20 PALAVRAS (opcional)
   - timeline_steps: array de 3 a 5 objetos, cada um com:
     - numero: "01", "02", "03", "04", "05"
     - titulo: nome da etapa, MAX 4 PALAVRAS
     - descricao: detalhe da etapa, MAX 12 PALAVRAS (opcional)
     - destaque: true apenas no step mais importante (máx 1 por slide)
   USE este layout quando o conteúdo tiver uma sequência lógica de etapas:
   diagnóstico → tratamento, antes → durante → depois, protocolo com passos.

7. "final" — Último slide SEMPRE. Campos:
   - conclusion: frase de fechamento, MAX 10 PALAVRAS
   - pergunta_comentario: pergunta para gerar comentários
`;

const REGRAS_TOM = `
## REGRAS DE TOM (obrigatório)
### Inspirado em perfis de referência (@clinicacintiamartins 1.2M, @dra.daniaidar 384k, @rithacapelato_dermato 361k, @marinacristofani 396k, @dermatoingrid 27.8k)

- NUNCA use travessão longo (—). Use ponto final ou vírgula.
- Frases curtas e diretas. Parágrafos de no máximo 2 linhas.
- Use dados específicos, nunca genéricos ("73% dos pacientes" em vez de "a maioria").

### VOZ E TOM
- Escreva como a médica FALA no consultório, não como artigo científico.
- Tom acessível e acolhedor. Linguagem coloquial, como se estivesse conversando com a paciente.
- Hooks provocativos no estilo @clinicacintiamartins: "Tomei X e AGORA?", "Você está fazendo ERRADO", "Ninguém te conta isso sobre..."
- A headline da capa deve ser uma PROVOCAÇÃO ou PERGUNTA que gere curiosidade imediata.
- Use perguntas retóricas para criar conexão: "Já passou por isso?", "Sabe aquele momento que..."
- Tom de autoridade com proximidade: a médica é expert mas fala de igual para igual.

### ESTILO DE ESCRITA
- Prefira linguagem ativa. "O colágeno regenera" em vez de "A regeneração do colágeno é promovida".
- Textos ultra-concisos. Se pode dizer em 3 palavras, não use 10.
- Big_text e headlines devem ter IMPACTO VISUAL — frases curtas que funcionam como manchete.
- Use *asteriscos* para enfatizar palavras-chave que devem ter cor de destaque.
- PROIBIDO palavras de IA: "crucial", "vale ressaltar", "é importante destacar", "nesse sentido", "outrossim", "de fato", "sem dúvida".

### ENGAJAMENTO
- Pergunta do slide final deve ser ESPECÍFICA e pessoal (não genérica).
- Ex bom: "Qual dessas dicas você já faz? Me conta nos comentários"
- Ex ruim: "Gostou? Comente abaixo"
- A legenda deve ter personalidade — como se a médica estivesse desabafando ou compartilhando algo pessoal.
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

/* ───────────────────────────────────────────
   Benchmark Presets — Creative Direction
   ─────────────────────────────────────────── */

interface PresetBehavior {
  editorialTone: string;
  hookStyle: string;
  ctaStyle: string;
  narrativeStyle: string;
  headlineMaxWords: number;
  bodyDensity: string;
  recommendedLayouts: string[];
  avoidLayouts: string[];
  forbiddenPatterns: string[];
  turningFrequency: string;
  statEmphasis: string;
}

interface BenchmarkPresetDef {
  label: string;
  tagline: string;
  description: string;
  behavior: PresetBehavior;
  preferredVisualStyle: string;
}

const BENCHMARK_PRESETS: Record<string, BenchmarkPresetDef> = {
  impacto_viral: {
    label: "Impacto Viral",
    tagline: "Gancho forte. Quebra de crença. Máximo engajamento.",
    description: "Conteúdo que provoca, gera debate e maximiza salvamentos e comentários.",
    behavior: {
      editorialTone: "Tom direto e provocativo. Frases curtas que criam tensão. Cada slide deve provocar uma reação. Linguagem de consultório informal, como se a médica estivesse revelando algo que poucos sabem. Usar dados que surpreendem. Hooks no estilo: 'Você está fazendo ERRADO', 'Tomei X e AGORA?', 'Ninguém te conta isso'.",
      hookStyle: "Provocativo e confrontador. A capa DEVE criar tensão imediata. Headline max 5 palavras.",
      ctaStyle: "CTA confrontador que desafia o leitor. Ex: 'Você vai continuar fazendo errado?'",
      narrativeStyle: "Ritmo alto: gancho provocativo → dado surpreendente → virada de perspectiva → revelação → CTA confrontador. Alternar tensão forte com respiros mínimos.",
      headlineMaxWords: 5,
      bodyDensity: "Ultra conciso, máximo 30 palavras por slide.",
      recommendedLayouts: ["capa", "turning", "stat", "tonly", "final"],
      avoidLayouts: ["timeline"],
      forbiddenPatterns: ["Headlines genéricas", "Tom neutro ou acadêmico", "Frases longas na capa", "CTA genérico"],
      turningFrequency: "Usar 2-3 slides de virada (turning)",
      statEmphasis: "Pelo menos 1-2 slides stat com dados de impacto",
    },
    preferredVisualStyle: "travessia",
  },
  autoridade_premium: {
    label: "Autoridade Premium",
    tagline: "Sofisticação médica. Percepção de alto valor.",
    description: "Construir autoridade e marca pessoal forte. Capa manifesto, tipografia elegante.",
    behavior: {
      editorialTone: "Tom de autoridade sofisticada. A médica fala como quem domina o assunto. Menos coloquial, mais posicionamento. Frases assertivas. Termos técnicos com elegância. Sensação de editorial médico premium.",
      hookStyle: "Sofisticado e assertivo. A capa transmite autoridade e elegância. Headline max 6 palavras.",
      ctaStyle: "CTA sóbrio e elegante. Ex: 'Se identificou? Salve para sua próxima consulta.'",
      narrativeStyle: "Ritmo controlado: manifesto → contexto profundo → evidência sólida → opinião de autoridade → recomendação refinada → assinatura. Menos viradas bruscas, mais construção de percepção.",
      headlineMaxWords: 6,
      bodyDensity: "Conciso, máximo 40 palavras por slide.",
      recommendedLayouts: ["capa", "tonly", "stat", "timg", "turning", "final"],
      avoidLayouts: [],
      forbiddenPatterns: ["Tom excessivamente coloquial", "Hooks sensacionalistas", "Perguntas de engajamento genéricas"],
      turningFrequency: "Usar 1-2 slides de virada",
      statEmphasis: "Pelo menos 1 slide stat com dado contextualizado",
    },
    preferredVisualStyle: "editorial_black_gold",
  },
  educacao_sofisticada: {
    label: "Educação Sofisticada",
    tagline: "Didática elegante. Conteúdo útil e salvável.",
    description: "Conteúdo educativo de alto nível com clareza, acessibilidade e elegância visual.",
    behavior: {
      editorialTone: "Tom didático e acolhedor. A médica ensina com clareza e gentileza. Explicações acessíveis sem simplificar demais. Cada slide deve ter uma pepita de conhecimento prático. Sensação de consultório premium e organizado.",
      hookStyle: "Didático e claro. A capa promete conhecimento valioso. Headline max 8 palavras.",
      ctaStyle: "CTA gentil e convidativo. Ex: 'Qual dessas dicas você já faz? Me conta nos comentários.'",
      narrativeStyle: "Ritmo suave e progressivo: contexto → explicação clara → dado de suporte → dica prática → resumo → convite. Mais slides explicativos e light. Menos viradas bruscas.",
      headlineMaxWords: 8,
      bodyDensity: "Moderado, máximo 50 palavras por slide.",
      recommendedLayouts: ["capa", "timg", "tonly", "light", "stat", "timeline", "final"],
      avoidLayouts: [],
      forbiddenPatterns: ["Hooks agressivos", "Tom de confronto", "Linguagem que gera ansiedade", "Dados sem contexto"],
      turningFrequency: "Usar no máximo 1 slide de virada",
      statEmphasis: "1 slide stat com dado contextualizado",
    },
    preferredVisualStyle: "ivory_sage",
  },
  consultorio_humano: {
    label: "Consultório Humano",
    tagline: "Proximidade real. Conteúdo que abraça.",
    description: "Conteúdo profundamente humano e empático. Conexão genuína com pacientes.",
    behavior: {
      editorialTone: "Tom conversacional e íntimo. A médica fala como se estivesse sentada com a paciente tomando café. Vulnerabilidade calculada: bastidores, dúvidas de pacientes, situações reais. Usa 'eu', 'você', 'a gente'. Menos dados, mais histórias e acolhimento.",
      hookStyle: "Acolhedor e identificável. A capa cria conexão emocional. Headline max 7 palavras.",
      ctaStyle: "CTA íntimo e pessoal. Ex: 'Me conta: você já passou por isso? Quero te ouvir nos comentários.'",
      narrativeStyle: "Ritmo orgânico: identificação → empatia → contexto pessoal → orientação gentil → convite íntimo. Hooks menos agressivos, mais identificáveis. Soar como conselho de amiga médica.",
      headlineMaxWords: 7,
      bodyDensity: "Moderado, máximo 50 palavras por slide.",
      recommendedLayouts: ["capa", "tonly", "timg", "light", "turning", "final"],
      avoidLayouts: ["timeline"],
      forbiddenPatterns: ["Tom frio ou distante", "Linguagem excessivamente técnica", "Hooks que geram medo", "CTA imperativo ou comercial"],
      turningFrequency: "Usar 1-2 slides de virada",
      statEmphasis: "Stat opcional, priorizar narrativa humana",
    },
    preferredVisualStyle: "ivory_sage",
  },
};

function buildPresetPrompt(presetId?: string): string {
  if (!presetId || !(presetId in BENCHMARK_PRESETS)) return "";
  const p = BENCHMARK_PRESETS[presetId];
  const b = p.behavior;
  return `
## DIREÇÃO CRIATIVA ATIVA: ${p.label.toUpperCase()}
${p.description}

### TOM EDITORIAL (OBRIGATÓRIO — siga rigorosamente)
${b.editorialTone}

### ESTILO DO HOOK
${b.hookStyle}

### RITMO NARRATIVO
${b.narrativeStyle}

### ESTILO DO CTA FINAL
${b.ctaStyle}

### REGRAS DE DENSIDADE
- Headline máximo: ${b.headlineMaxWords} palavras (RIGOROSO)
- Corpo: ${b.bodyDensity}
- Viradas (turning): ${b.turningFrequency}
- Dados (stat): ${b.statEmphasis}

### LAYOUTS RECOMENDADOS
Priorizar: ${b.recommendedLayouts.join(", ")}
${b.avoidLayouts.length > 0 ? `Evitar: ${b.avoidLayouts.join(", ")}` : ""}

### PROIBIÇÕES DESTA DIREÇÃO
${b.forbiddenPatterns.map((p: string) => `- ${p}`).join("\n")}

### VISUAL RECOMENDADO
preferredVisualStyle: "${p.preferredVisualStyle}"
Use este valor no campo preferredVisualStyle do JSON de resposta.
`;
}

/* ───────────────────────────────────────────
   Base system prompt
   ─────────────────────────────────────────── */

const BASE_SYSTEM = `Você é o roteirista da TravessIA, sistema de carrosséis médicos para Instagram.

${LAYOUTS_DOC}

${REGRAS_TOM}

${REGRAS_CFM}

## ESTRUTURA DO ROTEIRO
- Slide 1: SEMPRE layout "capa"
- Slides intermediários: combine livremente "timg", "tonly", "stat", "turning", "light", "timeline"
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
  "cta_final": "Frase de call-to-action para a legenda (ex: Salve este post e compartilhe com quem precisa)",
  "preferredVisualStyle": "editorial_black_gold ou ivory_sage ou travessia"
}
`;

/* ───────────────────────────────────────────
   Validation
   ─────────────────────────────────────────── */

function validateRoteiro(parsed: Record<string, unknown>): void {
  if (!parsed.titulo_carrossel) {
    throw new Error("Roteiro sem titulo_carrossel");
  }
  if (!Array.isArray(parsed.slides) || parsed.slides.length < 7 || parsed.slides.length > 10) {
    throw new Error("Roteiro deve ter entre 7 e 10 slides");
  }
  const slides = parsed.slides as Array<Record<string, unknown>>;
  if (slides[0]?.layout !== "capa") {
    throw new Error("Primeiro slide deve ser layout 'capa'");
  }
  if (slides[slides.length - 1]?.layout !== "final") {
    throw new Error("Último slide deve ser layout 'final'");
  }
  const validLayouts = ["capa", "timg", "tonly", "stat", "turning", "light", "timeline", "final"];
  for (const slide of slides) {
    if (!validLayouts.includes(slide.layout as string)) {
      throw new Error(`Layout inválido: ${slide.layout}`);
    }
  }
  const validStyles = ["travessia", "editorial_black_gold", "ivory_sage"];
  if (parsed.preferredVisualStyle && !validStyles.includes(parsed.preferredVisualStyle as string)) {
    parsed.preferredVisualStyle = "editorial_black_gold";
  }
  if (!parsed.preferredVisualStyle) {
    parsed.preferredVisualStyle = "editorial_black_gold";
  }
}

/* ───────────────────────────────────────────
   Main handler
   ─────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("apikey");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action ?? "generate";
    const skill = body.skill;
    const benchmarkPreset = body.benchmarkPreset;

    let systemPrompt = "";
    if (skill) {
      systemPrompt += `## CARROSSEL_SKILL (estilo do cliente)\n${JSON.stringify(skill, null, 2)}\n\n`;
    }
    systemPrompt += BASE_SYSTEM;

    // Inject benchmark preset as creative direction
    const presetBlock = buildPresetPrompt(benchmarkPreset);
    if (presetBlock) {
      systemPrompt += "\n" + presetBlock;
    }

    let userPrompt: string;

    if (action === "rewrite") {
      const { roteiro, feedback } = body;
      if (!roteiro) throw new Error("Campo 'roteiro' é obrigatório para rewrite");
      if (!feedback) throw new Error("Campo 'feedback' é obrigatório para rewrite");

      const roteiroContext = typeof roteiro === "object" && !Array.isArray(roteiro)
        ? roteiro
        : { slides: roteiro };

      userPrompt = `Reescreva o roteiro abaixo incorporando o feedback do cliente.

## ROTEIRO ATUAL (contexto completo)
${JSON.stringify(roteiroContext, null, 2)}

## FEEDBACK DO CLIENTE
${feedback}

Mantenha os layouts válidos do sistema TravessIA. Preserve titulo_carrossel, tese, jornada, legenda, hashtags e cta_final, ajustando conforme o feedback.${benchmarkPreset ? ` Mantenha a direção criativa "${BENCHMARK_PRESETS[benchmarkPreset]?.label || benchmarkPreset}" ao reescrever.` : ""} Retorne APENAS o JSON completo do novo roteiro.`;
    } else {
      const { profile, tese, objetivo, objetivoDetalhado } = body;
      if (!profile) throw new Error("Campo 'profile' é obrigatório");
      const especialidade = String(profile.especialidade ?? "");
      const nutrologiaHint = /nutrol/i.test(especialidade)
        ? `
Instruções extras para NUTROLOGIA:
- Escreva como uma nutróloga em consultório (didático, direto e sem sensacionalismo).
- Traga pelo menos 1 dado clínico em layout "stat" com contexto.
- Inclua 1 orientação prática de rotina alimentar/exames sem prescrever tratamento individual.
- Finalize com pergunta que convide o paciente a relatar sua dificuldade principal.`
        : "";

      const pilares = Array.isArray(profile.pilares) ? profile.pilares.join(", ") : (profile.pilares ?? "Não informados");

      userPrompt = `Crie um roteiro completo de carrossel para este médico:

Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Pilares de conteúdo: ${pilares}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}

Tese central: ${tese ?? "Não informada"}
Objetivo: ${objetivo ?? "Educar e engajar"}${objetivoDetalhado ? `\nContexto do objetivo: ${objetivoDetalhado}` : ""}
${benchmarkPreset ? `Direção criativa: ${BENCHMARK_PRESETS[benchmarkPreset]?.label || benchmarkPreset}` : ""}
${nutrologiaHint}

Gere entre 7 e 10 slides usando os layouts do sistema TravessIA.
Retorne APENAS o JSON válido.`;
    }

    const raw = await callClaude("", systemPrompt, userPrompt);
    const parsed = typeof raw === "string" ? safeJsonParse(raw) : safeJsonParse(raw);
    validateRoteiro(parsed);

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
