import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

const ESPECIALIDADES = [
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Oftalmologia",
  "Nutrologia",
  "Endocrinologia",
  "Cirurgia Plástica",
  "Psiquiatria",
  "Medicina Estética",
  "Outra",
] as const;

const SYSTEM_PROMPT = `Você é um assistente que estrutura dados de perfis médicos do Instagram. A partir das informações fornecidas, extraia e organize os dados no formato JSON especificado. Se não encontrar informação para um campo, use string vazia. Para especialidade, use EXATAMENTE um destes valores: ${ESPECIALIDADES.join(", ")}. Inclua "instagram" na lista de plataformas.

Retorne APENAS JSON válido (sem markdown, sem texto fora do JSON) com esta estrutura:
{
  "nome": "string — nome completo do médico",
  "especialidade": "string — uma das especialidades listadas acima",
  "subespecialidade": "string — subespecialidade se identificada",
  "crm": "",
  "cidade": "string — cidade se identificada",
  "estado": "string — sigla do estado (2 letras) se identificado",
  "plataformas": ["instagram"],
  "publico_alvo": "string — público-alvo aparente. OBRIGATÓRIO: descreva faixa etária, gênero predominante e principal motivação/necessidade. Ex: 'Mulheres 30-55 anos que buscam rejuvenescimento facial natural e harmonização sem exagero'",
  "tom_de_voz": "string — tom de comunicação identificado (educativo, manifesto, hibrido ou conversao)",
  "diferenciais": ["string — diferenciais e pilares de conteúdo identificados"],
  "objetivos": [],
  "bio_instagram": "string — biografia do Instagram se encontrada",
  "confidence": 0.0
}

O campo "confidence" deve ser um número entre 0 e 1 indicando quanta informação foi encontrada. 1.0 = todos os campos preenchidos, 0.0 = nenhum campo encontrado.`;

async function callLovableAI(systemPrompt: string, userMessage: string): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  console.log("[AI] Sending request to Lovable AI gateway...");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[AI] Gateway error:", res.status, text);
    if (res.status === 429) throw new Error("Rate limit exceeded, tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA insuficientes.");
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  console.log("[AI] Raw response length:", content.length);

  // Strip markdown fences if present
  const cleaned = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("[AI] Failed to parse response:", cleaned.substring(0, 500));
    throw new Error("AI retornou resposta inválida");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const body = await req.json();
    let handle = body.handle?.trim();
    if (!handle) throw new Error("Campo 'handle' é obrigatório");

    if (!handle.startsWith("@")) {
      handle = `@${handle}`;
    }

    console.log("[Import] Starting import for handle:", handle);

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    let result: Record<string, unknown>;

    if (perplexityKey) {
      try {
        console.log("[Import] Using Perplexity to fetch profile data...");
        const profileInfo = await callPerplexityText(
          perplexityKey,
          [
            {
              role: "system",
              content: "Você é um pesquisador especializado em perfis de médicos brasileiros no Instagram. Forneça informações detalhadas e factuais sobre o perfil solicitado. Busque a bio do Instagram, nome completo, especialidade médica, cidade, estado, público-alvo aparente, tom de comunicação, pilares de conteúdo e diferenciais. Seja o mais específico possível."
            },
            {
              role: "user",
              content: `Pesquise informações sobre o médico(a) brasileiro(a) com o perfil de Instagram ${handle} (sem o @: ${handle.replace('@', '')}). 

Busque em TODAS as fontes disponíveis: Google, sites de clínicas, Doctoralia, portais médicos, LinkedIn, YouTube, TikTok, blogs, notícias. NÃO se limite apenas ao Instagram.

Procure por "${handle.replace('@', '')}" como nome de usuário em redes sociais e "${handle.replace('@', '').replace(/[._]/g, ' ')}" como possível nome.

Quero saber:
1. Nome completo do médico(a)
2. Bio/descrição do Instagram (se encontrar)
3. Especialidade médica (dermatologia, cirurgia plástica, etc.)
4. Subespecialidade
5. Cidade e estado onde atende
6. CRM se disponível
7. Público-alvo aparente (MUITO IMPORTANTE: descreva gênero, faixa etária e principal motivação/necessidade do público. Ex: "Mulheres 30-55 anos buscando rejuvenescimento natural")
8. Tom de comunicação (educativo, manifesto, híbrido, conversão)
9. Pilares/temas de conteúdo
10. Diferenciais

Forneça TODAS as informações que encontrar, mesmo que parciais.`,
            },
          ],
          "sonar-pro",
        );

        console.log("[Import] Perplexity response length:", profileInfo.length);
        console.log("[Import] Perplexity response preview:", profileInfo.substring(0, 300));

        result = await callLovableAI(
          SYSTEM_PROMPT,
          `Aqui estão as informações coletadas sobre o perfil do Instagram ${handle}:\n\n${profileInfo}\n\nEstruture esses dados no formato JSON especificado. Use TODAS as informações disponíveis para preencher os campos.`,
        );

        console.log("[Import] Final result confidence:", result.confidence);
      } catch (perplexityErr) {
        console.warn("[Import] Perplexity failed:", (perplexityErr as Error).message);
        result = await callLovableAI(
          SYSTEM_PROMPT,
          `Com base no seu conhecimento, tente identificar informações sobre o perfil médico do Instagram ${handle}. Este é um médico brasileiro que usa o Instagram para divulgar conteúdo. Estruture o que conseguir encontrar no formato JSON especificado. Se não tiver informações suficientes, preencha o que for possível e use confidence baixo.`,
        );
      }
    } else {
      console.warn("[Import] PERPLEXITY_API_KEY not set, using AI only");
      result = await callLovableAI(
        SYSTEM_PROMPT,
        `Com base no seu conhecimento, tente identificar informações sobre o perfil médico do Instagram ${handle}. Este é um médico brasileiro que usa o Instagram para divulgar conteúdo. Estruture o que conseguir encontrar no formato JSON especificado. Se não tiver informações suficientes, preencha o que for possível e use confidence baixo.`,
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Import] Error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
