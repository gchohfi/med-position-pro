import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Target,
  Mic,
  Layers,
  BookOpen,
  Calendar,
  PenTool,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Archive,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { ROUTES } from "@/lib/routes";

interface DashboardData {
  profile: { full_name: string | null; onboarding_complete: boolean } | null;
  positioning: {
    archetype: string | null;
    tone: string | null;
    pillars: string[] | null;
    target_audience: string | null;
    goals: string | null;
  } | null;
  hasDiagnosis: boolean;
  hasStrategy: boolean;
  seriesCount: number;
  calendarCount: number;
  contentCount: number;
  latestUpdate: string | null;
}

type UserStage = "pre_onboarding" | "post_onboarding" | "has_diagnosis" | "has_strategy" | "active";

function resolveStage(data: DashboardData): UserStage {
  if (!data.profile?.onboarding_complete) return "pre_onboarding";
  if (!data.hasDiagnosis) return "post_onboarding";
  if (!data.hasStrategy) return "has_diagnosis";
  if (data.seriesCount === 0 && data.calendarCount === 0 && data.contentCount === 0) return "has_strategy";
  return "active";
}

const journeySteps = [
  { key: "onboarding", label: "Onboarding", path: ROUTES.onboarding },
  { key: "diagnosis", label: "Diagnóstico", path: ROUTES.diagnostico },
  { key: "strategy", label: "Estratégia", path: ROUTES.estrategiaIa },
  { key: "series", label: "Séries", path: ROUTES.series },
  { key: "calendar", label: "Calendário", path: ROUTES.calendario },
  { key: "production", label: "Criação", path: ROUTES.producao },
];

function getStepStatus(step: string, data: DashboardData): "done" | "current" | "pending" {
  switch (step) {
    case "onboarding":
      return data.profile?.onboarding_complete ? "done" : "current";
    case "diagnosis":
      if (!data.profile?.onboarding_complete) return "pending";
      return data.hasDiagnosis ? "done" : data.profile?.onboarding_complete ? "current" : "pending";
    case "strategy":
      if (!data.hasDiagnosis) return "pending";
      return data.hasStrategy ? "done" : "current";
    case "series":
      if (!data.hasStrategy) return "pending";
      return data.seriesCount > 0 ? "done" : "current";
    case "calendar":
      if (!data.hasStrategy) return "pending";
      return data.calendarCount > 0 ? "done" : "current";
    case "production":
      if (!data.hasStrategy) return "pending";
      return data.contentCount > 0 ? "done" : "current";
    default:
      return "pending";
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    profile: null,
    positioning: null,
    hasDiagnosis: false,
    hasStrategy: false,
    seriesCount: 0,
    calendarCount: 0,
    contentCount: 0,
    latestUpdate: null,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, posRes, diagRes, seriesRes, calRes, contentRes] = await Promise.all([
        supabase.from("profiles").select("full_name, onboarding_complete").eq("id", user.id).maybeSingle(),
        supabase.from("positioning").select("archetype, tone, pillars, target_audience, goals").eq("user_id", user.id).maybeSingle(),
        supabase.from("diagnosis_outputs").select("id, diagnosis, estrategia, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
        supabase.from("series").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("calendar_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("content_outputs").select("id, created_at", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);

      const diagRow = diagRes.data?.[0];
      const hasDiagnosisReal = !!(diagRow?.diagnosis && typeof diagRow.diagnosis === "object" && Object.keys(diagRow.diagnosis as object).length > 1);
      const hasStrategy = !!(diagRow?.estrategia && typeof diagRow.estrategia === "object" && Object.keys(diagRow.estrategia as object).length > 1);

      const dates = [diagRow?.updated_at, contentRes.data?.[0]?.created_at].filter(Boolean) as string[];
      const latestUpdate = dates.length > 0 ? dates.sort().reverse()[0] : null;

      setData({
        profile: profileRes.data ?? null,
        positioning: posRes.data ?? null,
        hasDiagnosis: hasDiagnosisReal,
        hasStrategy,
        seriesCount: seriesRes.count ?? 0,
        calendarCount: calRes.count ?? 0,
        contentCount: contentRes.count ?? 0,
        latestUpdate,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const stage = resolveStage(data);

  useEffect(() => {
    if (!loading && stage === "pre_onboarding") {
      navigate(ROUTES.onboarding, { replace: true });
    }
  }, [loading, stage, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const firstName = data.profile?.full_name?.split(" ")[0] ?? "";

  const headerCopy: Record<UserStage, { title: string; subtitle: string }> = {
    pre_onboarding: {
      title: firstName ? `Bem-vinda, ${firstName}.` : "Bem-vinda.",
      subtitle: "Antes de qualquer direção editorial, precisamos entender a base do seu posicionamento.",
    },
    post_onboarding: {
      title: "Sua base está registrada.",
      subtitle: "O próximo passo é gerar o diagnóstico estratégico do seu posicionamento atual.",
    },
    has_diagnosis: {
      title: "Diagnóstico concluído.",
      subtitle: "Agora é hora de refinar a direção estratégica da sua comunicação.",
    },
    has_strategy: {
      title: "Estratégia definida.",
      subtitle: "Seu sistema editorial já pode começar a ganhar corpo.",
    },
    active: {
      title: firstName ? `${firstName}, seu sistema está ativo.` : "Seu sistema está ativo.",
      subtitle: "Com base nas decisões construídas, seu sistema editorial está em andamento.",
    },
  };

  const nextMove: Record<UserStage, { label: string; path: string; cta: string }> = {
    pre_onboarding: { label: "Definir sua base estratégica", path: ROUTES.onboarding, cta: "Começar onboarding" },
    post_onboarding: { label: "Gerar diagnóstico de posicionamento", path: ROUTES.diagnostico, cta: "Gerar diagnóstico" },
    has_diagnosis: { label: "Refinar direção estratégica", path: ROUTES.estrategiaIa, cta: "Definir estratégia" },
    has_strategy: { label: "Criar sua primeira série editorial", path: ROUTES.series, cta: "Criar série" },
    active: { label: "Estruturar próxima peça de conteúdo", path: ROUTES.producao, cta: "Criar conteúdo" },
  };

  const snapshotCards: { icon: typeof Target; label: string; value: string }[] = [];
  if (data.positioning?.archetype) {
    snapshotCards.push({ icon: Target, label: "Arquétipo", value: data.positioning.archetype });
  }
  if (data.positioning?.tone) {
    snapshotCards.push({ icon: Mic, label: "Tom de voz", value: data.positioning.tone });
  }
  if (data.positioning?.pillars && data.positioning.pillars.length > 0) {
    snapshotCards.push({ icon: Layers, label: "Pilares editoriais", value: data.positioning.pillars.join(" · ") });
  }
  if (data.positioning?.target_audience) {
    const raw = data.positioning.target_audience;
    const isCorrupted = raw.length > 200 || raw.includes("\n") || raw.split(" ").length > 40;
    const displayValue = isCorrupted
      ? raw.split(/[.\n]/)[0].trim().slice(0, 150) + (raw.length > 150 ? "…" : "")
      : raw;
    if (displayValue.length > 10) {
      snapshotCards.push({ icon: Target, label: "Público-alvo", value: displayValue });
    }
  }

  const activityItems: { icon: typeof BookOpen; label: string; value: string }[] = [];
  if (data.seriesCount > 0) activityItems.push({ icon: BookOpen, label: "Séries", value: String(data.seriesCount) });
  if (data.calendarCount > 0) activityItems.push({ icon: Calendar, label: "Calendário", value: String(data.calendarCount) });
  if (data.contentCount > 0) activityItems.push({ icon: Archive, label: "Peças", value: String(data.contentCount) });

  const header = headerCopy[stage];
  const move = nextMove[stage];

  return (
    <AppLayout>
      <div className="p-8 md:p-12 max-w-4xl space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-display-sm text-foreground mb-2">{header.title}</h1>
          <p className="text-muted-foreground">{header.subtitle}</p>
        </motion.div>

        {/* Next Move */}
        <motion.div
          className="border border-border rounded-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Próximo passo</p>
              <p className="text-foreground mb-4">{move.label}</p>
              <Button size="sm" onClick={() => navigate(move.path)}>
                {move.cta}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Strategic Snapshot */}
        {snapshotCards.length > 0 && (
          <section>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Posicionamento</p>
            <div className="grid md:grid-cols-2 gap-4">
              {snapshotCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  className="border border-border rounded-lg p-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{card.value}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Journey */}
        <section>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Progresso</p>
          <div className="border border-border rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {journeySteps.map((step) => {
                const status = getStepStatus(step.key, data);
                return (
                  <button
                    key={step.key}
                    onClick={() => status !== "pending" && navigate(step.path)}
                    disabled={status === "pending"}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
                      status === "done"
                        ? "text-foreground"
                        : status === "current"
                        ? "text-foreground font-medium bg-secondary"
                        : "text-muted-foreground/40 cursor-not-allowed"
                    }`}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground flex-shrink-0" />
                    ) : (
                      <Circle className={`h-3.5 w-3.5 flex-shrink-0 ${status === "current" ? "text-foreground" : "text-muted-foreground/30"}`} />
                    )}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Activity */}
        {activityItems.length > 0 && (
          <section>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Atividade</p>
            <div className="grid grid-cols-3 gap-4">
              {activityItems.map((item) => (
                <div key={item.label} className="border border-border rounded-lg p-5 text-center">
                  <p className="text-2xl font-heading text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;