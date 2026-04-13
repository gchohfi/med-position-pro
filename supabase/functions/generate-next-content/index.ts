import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callGemini, errorResponse } from "../_shared/gemini.ts";
import { extractJSON } from "../_shared/json.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing auth", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    // Fetch all strategic data in parallel
    const [
      { data: profile },
      { data: positioning },
      { data: contents },
      { data: calendarItems },
      { data: clusters },
      { data: series },
      { data: memory },
      { data: campaigns },
      { data: personas },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("content_outputs").select("id, title, content_type, strategic_input, created_at, campaign_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("calendar_items").select("*").eq("user_id", user.id).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(14),
      supabase.from("topic_clusters").select("*").eq("user_id", user.id),
      supabase.from("series").select("*").eq("user_id", user.id).eq("status", "ativa"),
      supabase.from("strategic_memory").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("campaigns").select("*").eq("user_id", user.id).eq("status", "ativa"),
      supabase.from("patient_personas").select("*").eq("user_id", user.id).eq("is_active", true),
    ]);

    // Build context summary
    const recentTitles = (contents || []).slice(0, 10).map((c: any) => c.title || "sem título");
    const recentPresets = (contents || []).slice(0, 10).map((c: any) => (c.strategic_input as any)?.benchmark_preset).filter(Boolean);
    const recentObjectives = (contents || []).slice(0, 10).map((c: any) => (c.strategic_input as any)?.objetivo).filter(Boolean);

    const usedClusterNames = (contents || []).map((c: any) => (c.strategic_input as any)?.cluster).filter(Boolean);
    const allClusterNames = (clusters || []).map((c: any) => c.cluster_name);
    const unusedClusters = allClusterNames.filter((n: string) => !usedClusterNames.includes(n));

    const presetCounts: Record<string, number> = {};
    recentPresets.forEach((p: string) => { presetCounts[p] = (presetCounts[p] || 0) + 1; });
    const dominantPreset = Object.entries(presetCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const objectiveCounts: Record<string, number> = {};
    recentObjectives.forEach((o: string) => { objectiveCounts[o] = (objectiveCounts[o] || 0) + 1; });

    const today = new Date();
    const month = today.toLocaleString("pt-BR", { month: "long" });

    const ctx: string[] = [];
    if (profile?.specialty) ctx.push(`Especialidade: ${profile.specialty}`);
    if (positioning?.archetype) ctx.push(`Arquétipo: ${positioning.archetype}`);
    if (positioning?.tone) ctx.push(`Tom: ${positioning.tone}`);
    if (positioning?.target_audience) ctx.push(`Público: ${positioning.target_audience}`);
    if (positioning?.pillars?.length) ctx.push(`Pilares: ${positioning.pillars.join(", ")}`);
    if (series?.length) ctx.push(`Séries ativas: ${series.map((s: any) => s.name).join(", ")}`);
    if (campaigns?.length) ctx.push(`Campanhas ativas: ${campaigns.map((c: any) => `${c.name} (${c.theme})`).join(", ")}`);
    if (personas?.length) ctx.push(`Personas ativas: ${personas.map((p: any) => `${p.nome_interno} — ${p.dor_principal}`).join("; ")}`);
    if (memory?.rejected_patterns?.length) ctx.push(`Padrões rejeitados: ${(memory.rejected_patterns as string[]).slice(0, 3).join(", ")}`);
    if (memory?.preferred_presets?.length) ctx.push(`Presets preferidos: ${(memory.preferred_presets as string[]).join(", ")}`);
    if (memory?.preferred_visual_styles?.length) ctx.push(`Estilos visuais preferidos: ${(memory.preferred_visual_styles as string[]).join(", ")}`);

    const prompt = `Você é o motor estratégico de conteúdo médico no Instagram. Analise o contexto abaixo e sugira o melhor próximo conteúdo a ser criado AGORA.

CONTEXTO DO MÉDICO:
${ctx.join("\n")}

CONTEÚDOS RECENTES (últimos 10 títulos):
${recentTitles.join("\n")}

PRESETS USADOS RECENTEMENTE: ${JSON.stringify(presetCounts)}
${dominantPreset ? `⚠️ Preset dominante: "${dominantPreset}" — diversifique.` : ""}

OBJETIVOS USADOS: ${JSON.stringify(objectiveCounts)}

CLUSTERS NÃO EXPLORADOS: ${unusedClusters.length > 0 ? unusedClusters.join(", ") : "Todos cobertos."}

CALENDÁRIO PRÓXIMOS 14 DIAS: ${(calendarItems || []).length > 0 ? (calendarItems || []).map((ci: any) => `${ci.date}: ${ci.title} (${ci.content_type})`).join("; ") : "Vazio."}

MÊS ATUAL: ${month} ${today.getFullYear()}

Retorne um JSON com exatamente este formato:
{
  "suggestions": [
    {
      "title": "título curto e direto do conteúdo",
      "thesis": "tese editorial clara e pronta para usar como base do carrossel — uma frase opinativa que guia o conteúdo",
      "why_now": "por que este conteúdo agora (1-2 frases contextuais)",
      "preset": "impacto_viral | autoridade_premium | educacao_sofisticada | consultorio_humano",
      "objetivo": "educar | salvar | comentar | conversao",
      "visual_style": "travessia | editorial_black_gold | ivory_sage",
      "risk_repetition": "baixo | medio | alto",
      "strategic_opportunity": "frase curta sobre a oportunidade estratégica",
      "cluster": "cluster temático se aplicável, senão null",
      "campaign": "nome da campanha se aplicável, senão null",
      "persona": "nome da persona se aplicável, senão null",
      "hook_angle": "tipo de abertura sugerida — ex: 'provocação', 'dado surpreendente', 'pergunta direta', 'mito comum', 'declaração polêmica'",
      "cta_direction": "direção do CTA final — ex: 'agendar consulta', 'salvar para depois', 'comentar experiência', 'compartilhar com alguém'",
      "narrative_rhythm": "ritmo narrativo — ex: 'problema → revelação → solução', 'mito → verdade → prova', 'história → insight → ação'",
      "confidence": "alta | media | baixa",
      "recommendation_reasoning": "1-2 frases explicando a lógica estratégica por trás desta escolha"
    }
  ]
}

REGRAS:
- Retorne exatamente 3 sugestões: a principal (index 0) e 2 alternativas
- A sugestão principal deve ser a mais estrategicamente relevante AGORA
- Evite repetir presets e objetivos já saturados
- Considere sazonalidade do mês
- Se há clusters não explorados, priorize-os
- Se há campanha ativa, ao menos 1 sugestão deve ser para ela
- Cada sugestão deve ser genuinamente diferente em tema, preset e abordagem
- A "thesis" deve ser uma opinião editorial clara, não um resumo genérico
- O "hook_angle" deve ser específico e acionável
- O "narrative_rhythm" deve descrever a jornada emocional do carrossel
- O "confidence" reflete quão segura é a recomendação dado o contexto disponível
- O "recommendation_reasoning" deve justificar a escolha estrategicamente
- Use "conversao" (não "converter") como valor do objetivo
- Responda em português (Brasil)`;

    const response = await callGemini("unused", {
      messages: [
        { role: "system", content: "You generate structured JSON recommendations for medical content strategy. Always return valid JSON with exactly 3 suggestions. Every field must be present. Respond in Portuguese (Brazil)." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 5000,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return errorResponse("Rate limit — tente novamente em instantes.", 429);
      if (response.status === 402) return errorResponse("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.", 402);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const result = typeof content === "object" ? content : extractJSON(content);

    return new Response(JSON.stringify({
      ...result,
      meta: {
        total_contents: (contents || []).length,
        unused_clusters: unusedClusters.length,
        dominant_preset: dominantPreset || null,
        active_campaigns: (campaigns || []).length,
        calendar_next_14d: (calendarItems || []).length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", (err as Error)?.message || err);
    return errorResponse("Erro ao gerar recomendação.", 500);
  }
});
