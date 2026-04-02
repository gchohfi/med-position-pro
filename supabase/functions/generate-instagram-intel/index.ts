import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const [posRes, profileRes, diagRes, trackedRes] = await Promise.all([
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("specialty, full_name").eq("id", user.id).single(),
      supabase.from("diagnosis_outputs").select("diagnosis, estrategia").eq("user_id", user.id).maybeSingle(),
      supabase.from("instagram_tracked_profiles").select("*").eq("user_id", user.id),
    ]);

    const positioning = posRes.data;
    const profile = profileRes.data;
    const diagnosis = diagRes.data;
    const trackedProfiles = trackedRes.data || [];

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const specialty = profile?.specialty || "medicina";
    const archetype = positioning?.archetype || "";
    const pillars = positioning?.pillars?.join(", ") || "";
    const tone = positioning?.tone || "";
    const competitors = trackedProfiles.filter((p: any) => p.profile_type === "competitor");
    const competitorUsernames = competitors.map((p: any) => p.username);

    // ── STEP 1: Market research via Perplexity ──
    let marketResearch = "";
    if (PERPLEXITY_API_KEY) {
      console.log("Running Perplexity research for:", specialty);

      const queries = [
        `Quais narrativas dominam o Instagram de médicos de ${specialty} no Brasil agora? Quais promessas são mais repetidas? Quais ângulos estão saturados? Quais espaços estão pouco ocupados? Foque em posicionamento e percepção, não métricas.`,
      ];

      if (competitorUsernames.length > 0) {
        queries.push(
          `Analise os perfis de Instagram: ${competitorUsernames.join(", ")}. Quais narrativas reforçam? Quais promessas repetem? Quais padrões visuais usam? O que os diferencia ou os torna genéricos no nicho de ${specialty}?`
        );
      }

      const systemMsg = "Você é um analista de posicionamento estratégico de marcas médicas no Instagram brasileiro. Foque em percepção, narrativa, saturação e diferenciação — NÃO em métricas de vaidade. Responda em Português do Brasil.";

      const results = await Promise.all(
        queries.map((q) =>
          callPerplexityText(
            PERPLEXITY_API_KEY,
            [{ role: "system", content: systemMsg }, { role: "user", content: q }],
            "sonar",
            { max_tokens: 1500 },
          ).catch((e) => { console.error("Perplexity search failed:", e); return ""; })
        )
      );
      marketResearch = results.filter(Boolean).join("\n\n---\n\n");
    }

    // ── STEP 2: Build strategic analysis prompt ──
    const contextParts: string[] = [];
    if (positioning) {
      contextParts.push(`POSICIONAMENTO: Arquétipo: ${archetype}. Pilares: ${pillars}. Tom: ${tone}. Público: ${positioning.target_audience || "N/A"}. Objetivos: ${positioning.goals || "N/A"}.`);
    }
    if (diagnosis?.diagnosis) {
      contextParts.push(`DIAGNÓSTICO: ${typeof diagnosis.diagnosis === "string" ? diagnosis.diagnosis : JSON.stringify(diagnosis.diagnosis).substring(0, 500)}`);
    }
    if (diagnosis?.estrategia) {
      contextParts.push(`ESTRATÉGIA: ${typeof diagnosis.estrategia === "string" ? diagnosis.estrategia : JSON.stringify(diagnosis.estrategia).substring(0, 500)}`);
    }

    const profilesDescription = trackedProfiles.map((p: any) => {
      const type = p.profile_type === "own" ? "PRÓPRIO" : "CONCORRENTE";
      return `@${p.username} (${type})${p.notes ? ` — ${p.notes}` : ""}`;
    }).join("\n");

    const systemPrompt = `Você é um analista sênior de posicionamento de marca. Você NÃO é um analista de social media. Você NÃO otimiza métricas de vaidade.

Sua função: interpretar atividade do Instagram como INTELIGÊNCIA DE POSICIONAMENTO.

Você pergunta:
- "Que percepção está sendo reforçada?"
- "Que narrativa o mercado está treinando?"
- "Que direção constrói autoridade?"
- "Que direção comoditiza a médica?"
- "Onde há white space?"

FRAMEWORK DE ANÁLISE:
1. CLASSIFICAR por intenção (educational, manifesto, connection, promotional, authority-building, trust-building)
2. CLASSIFICAR por efeito no mercado (differentiating, neutral, saturated, commoditizing, premium-signaling, weak, promising)
3. DETECTAR REPETIÇÃO (hooks, promessas, estruturas, visuais repetidos)
4. DETECTAR SATURAÇÃO DO MERCADO (o que está overcrowded, o que é noise, o que pode ser reclamado)
5. COMPARAR médica vs mercado (onde alinhada, onde similar demais, onde tem território forte, onde ausente)
6. JULGAMENTO ESTRATÉGICO: cada direção recebe um label: Constrói autoridade / Neutro / Comoditiza / Satura / Diferencia / Abre espaço

REGRAS DE DECISÃO:
- "Constrói autoridade": reforça expertise, sinaliza confiança, distingue do mercado genérico
- "Comoditiza": intercambiável, antes/depois genérico, venda de procedimento sem framing estratégico
- "Satura": concorrentes repetem muito, não cria mais contraste
- "Diferencia": cria contraste novo, reframing com intenção estratégica
- "Abre espaço": concorrentes não ocupam, alinha com posicionamento, cria room for premium

CRITÉRIO PRINCIPAL: impacto na percepção e posicionamento (NÃO engagement)

TOM: estratégico, direto, elegante, sem jargão de social media, sem hype.
O output deve parecer: a leitura de um estrategista sênior.
NÃO deve parecer: resumo de ferramenta de analytics.

Retorne APENAS JSON válido. Sem markdown. Sem explicações fora do JSON.`;

    const userPrompt = `## ESPECIALIDADE
${specialty}

## PERFIS MONITORADOS
${profilesDescription || "Nenhum perfil cadastrado."}

## CONTEXTO ESTRATÉGICO MEDSHIFT
${contextParts.length > 0 ? contextParts.join("\n\n") : "Contexto limitado — base a análise no mercado."}

## PESQUISA DE MERCADO ATUAL
${marketResearch || "Pesquisa não disponível — use conhecimento do segmento."}

## TAREFA
Retorne um JSON com EXATAMENTE esta estrutura:

{
  "narrativa_dominante": "Parágrafo curto: que narrativa o perfil da médica está treinando a audiência a acreditar.",
  "percepcao_transmitida": "Parágrafo curto: que percepção o perfil atualmente cria.",
  "seu_perfil": {
    "formatos_mais_usados": ["formato1", "formato2"],
    "sinais_autoridade": ["sinal1", "sinal2", "sinal3"],
    "sinais_comoditizacao": ["sinal1", "sinal2"],
    "excesso_atual": "O que está repetindo demais",
    "lacunas": "O que está faltando"
  },
  "concorrentes": {
    "narrativas_repetidas": ["narrativa1", "narrativa2", "narrativa3"],
    "promessa_dominante": "A promessa que o segmento mais repete",
    "formatos_saturados": ["formato1", "formato2"],
    "angulos_mais_usados": ["ângulo1", "ângulo2"],
    "territorios_superexplorados": ["território1", "território2"],
    "espacos_pouco_ocupados": ["espaço1", "espaço2", "espaço3"]
  },
  "sinais_mercado": {
    "reforcam_autoridade": ["direção1", "direção2", "direção3"],
    "saturadas": ["direção1", "direção2", "direção3"],
    "comoditizam": ["direção1", "direção2"],
    "white_space": ["direção1", "direção2", "direção3"],
    "movimentos_recentes": ["movimento1", "movimento2"]
  },
  "direcao_recomendada": {
    "reforcar": ["ação1", "ação2"],
    "evitar": ["ação1", "ação2"],
    "testar": ["ação1", "ação2"],
    "reposicionar": ["ação1"]
  },
  "risco_atual": "Parágrafo conciso sobre o principal risco de posicionamento.",
  "mudou_esta_semana": ["mudança1", "mudança2", "mudança3"]
}`;

    // ── STEP 3: Call Gemini for strategic analysis (with retry) ──
    const aiRes = await callGemini(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
      temperature: 0.7,
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini error:", aiRes.status, errText);
      throw new Error(`Gemini API error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let result: any;
    try {
      result = typeof content === "object" ? content : JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response as JSON");
      result = JSON.parse(jsonMatch[0]);
    }

    // ── STEP 4: Store the analysis in Supabase ──
    const { data: existing } = await supabase
      .from("instagram_analyses")
      .select("id")
      .eq("user_id", user.id)
      .eq("analysis_type", "full")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const analysisPayload = {
      user_id: user.id,
      analysis_type: "full" as const,
      summary: result.narrativa_dominante || "",
      trends: result.sinais_mercado || {},
      competitor_insights: result.concorrentes || {},
      performance_analysis: result.seu_perfil || {},
      visual_suggestions: result.direcao_recomendada || {},
      content_patterns: {
        risco_atual: result.risco_atual || "",
        mudou_esta_semana: result.mudou_esta_semana || [],
        percepcao_transmitida: result.percepcao_transmitida || "",
      },
      recommendations: [],
      raw_data: {
        generated_at: new Date().toISOString(),
        perplexity_enabled: !!PERPLEXITY_API_KEY,
        profiles_analyzed: competitorUsernames,
        full_result: result,
      },
    };

    if (existing) {
      await supabase.from("instagram_analyses").update(analysisPayload).eq("id", existing.id);
    } else {
      await supabase.from("instagram_analyses").insert(analysisPayload);
    }

    return new Response(
      JSON.stringify({ success: true, intel: result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Instagram Intel error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: err.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
