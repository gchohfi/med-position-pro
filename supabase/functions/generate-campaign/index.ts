import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { safeJsonParse } from "../_shared/json-utils.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";

const CAMPAIGN_MODES: Record<string, string> = {
  manifesto_editorial:
    "Campanha do tipo manifesto editorial: posicione o médico como voz de autoridade com opinião forte e fundamentada sobre um tema relevante da especialidade.",
  clinico_autoral:
    "Campanha clínico-autoral: transforme conhecimento clínico em narrativa acessível e autoral, conectando ciência com a experiência do médico.",
  metodo_proprietario:
    "Campanha de método proprietário: apresente a abordagem única do médico como um sistema ou framework diferenciado.",
  narrativa_pessoal:
    "Campanha de narrativa pessoal: use a história pessoal e trajetória do médico para criar conexão emocional e autoridade.",
  autoridade_prova:
    "Campanha de autoridade com prova: demonstre competência através de dados, casos (anonimizados) e evidências concretas.",
};

const SLIDE_ROLES = [
  "gancho",
  "desconstrucao",
  "revelacao",
  "metodo",
  "prova",
  "ampliacao",
  "identidade",
  "cta",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    // Validate JWT and get authenticated user — prevents IDOR
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;
    const authenticatedUserId = auth.user.id;

    const { brief } = await req.json();
    if (!brief) {
      throw new Error("Missing required field: brief");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use authenticated user ID from JWT — never trust client-supplied user_id
    const user_id = authenticatedUserId;

    // Fetch user context in parallel
    const [positioningRes, diagnosisRes, memoryRes, contentRes] =
      await Promise.all([
        supabase
          .from("positioning")
          .select("*")
          .eq("user_id", user_id)
          .maybeSingle(),
        supabase
          .from("diagnosis_outputs")
          .select("output_json")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("living_memory")
          .select("memory_json")
          .eq("user_id", user_id)
          .maybeSingle(),
        supabase
          .from("content_outputs")
          .select("campaign_brief_json, slide_plan_json, campaign_status")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const positioning = positioningRes.data ?? {};
    const diagnosis = diagnosisRes.data?.output_json ?? {};
    const memory = memoryRes.data?.memory_json ?? {};
    const recentContent = contentRes.data ?? [];

    const campaignType = brief.tipo ?? "manifesto_editorial";
    const modeInstruction =
      CAMPAIGN_MODES[campaignType] ?? CAMPAIGN_MODES.manifesto_editorial;

    const systemPrompt = `Você é um diretor criativo de campanhas médicas para Instagram, especializado em carrosséis de alto impacto.

Sua missão: criar um plano de slides (slide_plan) para um carrossel médico profissional.

${modeInstruction}

REGRAS CFM (Resolução 2.336/2023):
- Nunca prometer resultados específicos
- Nunca usar antes/depois
- Nunca exibir preços comerciais
- Manter ética médica em todo o conteúdo
- Informações devem ser educativas e baseadas em evidências

PAPÉIS DE SLIDE DISPONÍVEIS: ${SLIDE_ROLES.join(", ")}

Cada slide deve ter: numero, papel, titulo, corpo, nota_visual, cta (opcional).

Retorne APENAS JSON válido com a estrutura:
{
  "slide_plan": [
    {
      "numero": 1,
      "papel": "gancho",
      "titulo": "...",
      "corpo": "...",
      "nota_visual": "...",
      "cta": "..."
    }
  ],
  "titulo_campanha": "...",
  "tese_central": "...",
  "tom": "...",
  "objetivo": "..."
}`;

    const userPrompt = `BRIEF DA CAMPANHA:
${JSON.stringify(brief, null, 2)}

POSICIONAMENTO DO MÉDICO:
${JSON.stringify(positioning, null, 2)}

DIAGNÓSTICO RECENTE:
${JSON.stringify(diagnosis, null, 2)}

MEMÓRIA VIVA:
${JSON.stringify(memory, null, 2)}

CONTEÚDOS RECENTES (últimos 5):
${JSON.stringify(recentContent, null, 2)}

Gere o plano de slides completo para esta campanha, respeitando o tipo "${campaignType}" e o posicionamento do médico. Garanta que o carrossel tenha entre 7 e 10 slides com progressão narrativa clara.`;

    const res = await callGemini(apiKey, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Gemini");

    const result = safeJsonParse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
