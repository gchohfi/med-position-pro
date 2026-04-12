import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders, callGemini, errorResponse, jsonResponse, checkRateLimit, rateLimitResponse } from "../_shared/gemini.ts";
import { extractJsonFromText } from "../_shared/json-utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    const rl = checkRateLimit(user.id);
    if (!rl.allowed) return rateLimitResponse();

    // Fetch all relevant data in parallel
    const [posRes, contentRes, calRes, seriesRes, memoryRes, clustersRes, feedbackRes] = await Promise.all([
      supabase.from("positioning").select("archetype, tone, pillars, target_audience, goals").eq("user_id", user.id).maybeSingle(),
      supabase.from("content_outputs").select("id, title, content_type, strategic_input, generated_content, golden_case, created_at, campaign_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("calendar_items").select("id, status, benchmark_preset, strategic_objective, content_type").eq("user_id", user.id),
      supabase.from("series").select("id, name, strategic_role, tone, frequency").eq("user_id", user.id),
      supabase.from("strategic_memory").select("preferred_presets, rejected_patterns, rewrite_count, hook_intensity, tone_preferences, preferred_visual_styles, notes_summary").eq("user_id", user.id).maybeSingle(),
      supabase.from("topic_clusters").select("cluster_name, usage_count, intent, priority").eq("user_id", user.id),
      supabase.from("content_feedback").select("satisfaction, clarity_score, authority_score, aesthetic_score, outcome_tags, benchmark_preset").eq("user_id", user.id).limit(50),
    ]);

    const positioning = posRes.data;
    const contents = contentRes.data ?? [];
    const calendar = calRes.data ?? [];
    const series = seriesRes.data ?? [];
    const memory = memoryRes.data;
    const clusters = clustersRes.data ?? [];
    const feedback = feedbackRes.data ?? [];

    // Build data snapshot for the prompt
    const dataSnapshot = {
      positioning: positioning ? { archetype: positioning.archetype, tone: positioning.tone, pillars: positioning.pillars, goals: positioning.goals } : null,
      contentCount: contents.length,
      goldenCaseCount: contents.filter((c: any) => c.golden_case).length,
      presetDistribution: {} as Record<string, number>,
      objectiveDistribution: {} as Record<string, number>,
      seriesCount: series.length,
      seriesRoles: series.map((s: any) => s.strategic_role),
      calendarCount: calendar.length,
      calendarStatuses: {} as Record<string, number>,
      clusterCount: clusters.length,
      unusedClusters: clusters.filter((c: any) => c.usage_count === 0).map((c: any) => c.cluster_name),
      memoryInsights: memory ? {
        rewriteCount: memory.rewrite_count,
        rejectedPatterns: memory.rejected_patterns,
        hookIntensity: memory.hook_intensity,
        preferredPresets: memory.preferred_presets,
      } : null,
      avgFeedback: {
        satisfaction: 0,
        clarity: 0,
        authority: 0,
        aesthetic: 0,
      },
    };

    for (const c of contents) {
      const si = c.strategic_input as Record<string, any>;
      const preset = si?.benchmark_preset ?? si?.benchmarkPreset ?? "sem_preset";
      dataSnapshot.presetDistribution[preset] = (dataSnapshot.presetDistribution[preset] || 0) + 1;
      const obj = si?.objetivo ?? si?.objective ?? "indefinido";
      dataSnapshot.objectiveDistribution[obj] = (dataSnapshot.objectiveDistribution[obj] || 0) + 1;
    }

    for (const ci of calendar) {
      const st = (ci as any).status;
      dataSnapshot.calendarStatuses[st] = (dataSnapshot.calendarStatuses[st] || 0) + 1;
    }

    if (feedback.length > 0) {
      let sN = 0, cN = 0, aN = 0, aeN = 0;
      for (const f of feedback) {
        const fb = f as any;
        if (fb.satisfaction) { dataSnapshot.avgFeedback.satisfaction += fb.satisfaction; sN++; }
        if (fb.clarity_score) { dataSnapshot.avgFeedback.clarity += fb.clarity_score; cN++; }
        if (fb.authority_score) { dataSnapshot.avgFeedback.authority += fb.authority_score; aN++; }
        if (fb.aesthetic_score) { dataSnapshot.avgFeedback.aesthetic += fb.aesthetic_score; aeN++; }
      }
      if (sN) dataSnapshot.avgFeedback.satisfaction = Math.round(dataSnapshot.avgFeedback.satisfaction / sN * 10) / 10;
      if (cN) dataSnapshot.avgFeedback.clarity = Math.round(dataSnapshot.avgFeedback.clarity / cN * 10) / 10;
      if (aN) dataSnapshot.avgFeedback.authority = Math.round(dataSnapshot.avgFeedback.authority / aN * 10) / 10;
      if (aeN) dataSnapshot.avgFeedback.aesthetic = Math.round(dataSnapshot.avgFeedback.aesthetic / aeN * 10) / 10;
    }

    const prompt = `Você é um consultor de marca pessoal médica no Instagram. Analise os dados abaixo e produza um scoring de marca pessoal.

DADOS DA MÉDICA:
${JSON.stringify(dataSnapshot, null, 2)}

Avalie estas 9 dimensões (score de 0 a 100 cada):

1. clareza_posicionamento — Quão claro está o posicionamento (arquétipo, tom, pilares definidos e coerentes)
2. consistencia_tom — O tom usado nos conteúdos é consistente com o definido no posicionamento
3. consistencia_visual — Os presets visuais são usados de forma coerente e intencional
4. forca_autoridade — Os conteúdos transmitem autoridade na especialidade
5. proximidade_humana — Há equilíbrio entre técnico e humano/acessível
6. diferenciacao — O conteúdo se diferencia do padrão do segmento
7. coerencia_benchmark — O benchmark preset escolhido é executado com fidelidade
8. controle_repeticao — Não há repetição excessiva de temas ou formatos
9. maturidade_editorial — O sistema editorial está completo (séries, calendário, clusters, campanhas)

Responda APENAS com JSON válido no formato:
{
  "overall_score": number,
  "dimensions": {
    "clareza_posicionamento": number,
    "consistencia_tom": number,
    "consistencia_visual": number,
    "forca_autoridade": number,
    "proximidade_humana": number,
    "diferenciacao": number,
    "coerencia_benchmark": number,
    "controle_repeticao": number,
    "maturidade_editorial": number
  },
  "explanations": {
    "clareza_posicionamento": "explicação curta",
    "consistencia_tom": "explicação curta",
    "consistencia_visual": "explicação curta",
    "forca_autoridade": "explicação curta",
    "proximidade_humana": "explicação curta",
    "diferenciacao": "explicação curta",
    "coerencia_benchmark": "explicação curta",
    "controle_repeticao": "explicação curta",
    "maturidade_editorial": "explicação curta"
  },
  "recommendations": [
    { "title": "título curto", "description": "o que fazer", "module": "módulo relacionado", "priority": "alta|media|baixa" }
  ]
}

Seja preciso, honesto e útil. Máximo 5 recomendações. Cada explicação deve ter no máximo 2 frases.`;

    const aiRes = await callGemini("", {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[brand-score] AI error:", errText);
      return errorResponse("Erro ao gerar score", 502);
    }

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";
    const parsed = extractJsonFromText(rawText);

    if (!parsed || !parsed.dimensions || !parsed.overall_score) {
      console.error("[brand-score] Failed to parse AI response:", rawText.slice(0, 500));
      return errorResponse("Erro ao processar resposta da IA", 500);
    }

    // Save to DB
    const { error: insertErr } = await supabase.from("brand_scores").insert({
      user_id: user.id,
      overall_score: parsed.overall_score,
      dimensions: parsed.dimensions,
      explanations: parsed.explanations ?? {},
      recommendations: parsed.recommendations ?? [],
      data_snapshot: dataSnapshot,
    });

    if (insertErr) {
      console.error("[brand-score] Insert error:", insertErr);
      return errorResponse("Erro ao salvar score", 500);
    }

    return jsonResponse(parsed);
  } catch (err) {
    console.error("[brand-score] Error:", err);
    return errorResponse(String(err), 500);
  }
});
