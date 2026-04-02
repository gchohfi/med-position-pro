import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const eventType = body.event_type;
    const sourceModule = body.source_module || "sistema";
    const details = body.details || {};

    await adminClient.from("refresh_logs").insert({
      user_id: user.id,
      event_type: eventType,
      source_module: sourceModule,
      details,
    });

    const recommendations = generateRecommendations(eventType, details);

    if (recommendations.length > 0) {
      await adminClient
        .from("recommended_actions")
        .delete()
        .eq("user_id", user.id)
        .eq("consumed", false)
        .eq("dismissed", false)
        .in("action_type", recommendations.map(r => r.action_type));

      const actions = recommendations.map(r => ({
        user_id: user.id,
        ...r,
      }));

      await adminClient.from("recommended_actions").insert(actions);
    }

    return new Response(
      JSON.stringify({ success: true, recommendations_count: recommendations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface Recommendation {
  title: string;
  action_type: string;
  reason: string;
  priority: string;
  related_module: string;
  action_path: string;
}

function generateRecommendations(eventType: string, details: Record<string, unknown>): Recommendation[] {
  const recs: Recommendation[] = [];

  switch (eventType) {
    case "onboarding_completed":
      recs.push({
        title: "Gerar seu diagnóstico estratégico",
        action_type: "next_step",
        reason: "Seu posicionamento foi definido. O diagnóstico vai revelar sua situação atual e direcionar a estratégia.",
        priority: "alta",
        related_module: "diagnostico",
        action_path: "/diagnostico",
      });
      break;

    case "diagnosis_generated":
      recs.push({
        title: "Definir sua estratégia editorial",
        action_type: "next_step",
        reason: "Com o diagnóstico pronto, é hora de transformar insights em direção editorial clara.",
        priority: "alta",
        related_module: "estrategia",
        action_path: "/estrategia",
      });
      break;

    case "strategy_generated":
      recs.push(
        {
          title: "Criar sua primeira série editorial",
          action_type: "next_step",
          reason: "Séries recorrentes dão consistência ao seu posicionamento e criam expectativa no público.",
          priority: "alta",
          related_module: "series",
          action_path: "/series",
        },
        {
          title: "Gerar calendário estratégico",
          action_type: "suggestion",
          reason: "Um calendário bem distribuído garante equilíbrio entre seus pilares editoriais.",
          priority: "media",
          related_module: "calendario",
          action_path: "/calendario",
        }
      );
      break;

    case "series_created":
      recs.push({
        title: "Produzir conteúdo para sua nova série",
        action_type: "next_step",
        reason: "Séries ganham força com a primeira peça publicada. Crie um conteúdo estratégico agora.",
        priority: "alta",
        related_module: "producao",
        action_path: "/producao",
      });
      break;

    case "content_generated":
      recs.push(
        {
          title: "Verificar equilíbrio do calendário",
          action_type: "check",
          reason: "Após criar conteúdo, vale garantir que seu mix editorial está equilibrado.",
          priority: "baixa",
          related_module: "calendario",
          action_path: "/calendario",
        },
        {
          title: "Atualizar memória estratégica",
          action_type: "suggestion",
          reason: "Novos conteúdos podem revelar padrões que merecem ser registrados na memória viva.",
          priority: "baixa",
          related_module: "memoria-viva",
          action_path: "/memoria-viva",
        }
      );
      break;

    case "golden_case_marked":
      recs.push({
        title: "Registrar padrão do caso de ouro na memória",
        action_type: "suggestion",
        reason: "Casos de ouro revelam o que funciona melhor. Incorpore esse padrão na sua memória estratégica.",
        priority: "alta",
        related_module: "memoria-viva",
        action_path: "/memoria-viva",
      });
      break;

    case "calendar_generated":
      recs.push({
        title: "Iniciar produção do próximo conteúdo",
        action_type: "next_step",
        reason: "Seu calendário está pronto. Comece a produzir as peças planejadas.",
        priority: "alta",
        related_module: "producao",
        action_path: "/producao",
      });
      break;

    case "radar_refreshed":
      recs.push({
        title: "Revisar estratégia com base no mercado",
        action_type: "suggestion",
        reason: "Novos sinais de mercado podem influenciar sua direção editorial.",
        priority: "media",
        related_module: "estrategia",
        action_path: "/estrategia",
      });
      break;

    case "memory_refreshed":
      recs.push({
        title: "Criar snapshot de evolução",
        action_type: "suggestion",
        reason: "Com a memória atualizada, vale registrar um marco na sua evolução estratégica.",
        priority: "baixa",
        related_module: "evolucao",
        action_path: "/evolucao",
      });
      break;
  }

  return recs;
}
