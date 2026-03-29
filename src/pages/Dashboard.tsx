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
  TrendingUp,
  Archive,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

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
  { key: "onboarding", label: "Onboarding", path: "/onboarding" },
  { key: "diagnosis", label: "Diagnóstico", path: "/diagnostico" },
  { key: "strategy", label: "Estratégia", path: "/estrategia" },
  { key: "series", label: "Séries", path: "/series" },
  { key: "calendar", label: "Calendário", path: "/calendario" },
  { key: "production", label: "Criação", path: "/producao" },
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
        supabase.from("diagnosis_outputs").select("id, estrategia, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
        supabase.from("series").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("calendar_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("content_outputs").select("id, created_at", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);

      const diagRow = diagRes.data?.[0];
      const hasStrategy = !!diagRow && diagRow.estrategia != null && JSON.stringify(diagRow.estrategia) !== "{}";

      const dates = [diagRow?.updated_at, contentRes.data?.[0]?.created_at].filter(Boolean) as string[];
      const latestUpdate = dates.length > 0 ? dates.sort().reverse()[0] : null;

      setData({
        profile: profileRes.data ?? null,
        positioning: posRes.data ?? null,
        hasDiagnosis: !!(diagRow && JSON.stringify(diagRow) !== "{}"),
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

  // Redirect new users to onboarding
  useEffect(() => {
    if (!loading && stage === "pre_onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, stage, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const firstName = data.profile?.full_name?.split(" ")[0] ?? "";

  // Header copy per stage
  const headerCopy: Record<UserStage, { title: string; subtitle: string }> = {
    pre_onboarding: {
      title: firstName ? `Bem-vinda, ${firstName}.` : "Bem-vinda ao MEDSHIFT.",
      subtitle: "Antes de qualquer direção editorial, o MEDSHIFT precisa entender a base do seu posicionamento.",
    },
    post_onboarding: {
      title: "Sua base está registrada.",
      subtitle: "O próximo passo é gerar o diagnóstico estratégico do seu posicionamento atual.",
    },
    has_diagnosis: {
      title: "Diagnóstico concluído.",
      subtitle: "Agora é hora de refinar a direção estratégica que vai guiar toda a sua comunicação.",
    },
    has_strategy: {
      title: "Estratégia definida.",
      subtitle: "Seu sistema editorial já pode começar a ganhar corpo com séries, calendário e conteúdo.",
    },
    active: {
      title: "Seu posicionamento já está ganhando forma.",
      subtitle: "Com base nas decisões construídas até aqui, seu sistema editorial está em andamento.",
    },
  };

  // Next move
  const nextMove: Record<UserStage, { label: string; path: string; cta: string }> = {
    pre_onboarding: { label: "Definir sua base estratégica", path: "/onboarding", cta: "Começar onboarding" },
    post_onboarding: { label: "Gerar diagnóstico de posicionamento", path: "/diagnostico", cta: "Gerar diagnóstico" },
    has_diagnosis: { label: "Refinar direção estratégica", path: "/estrategia", cta: "Definir estratégia" },
    has_strategy: { label: "Criar sua primeira série editorial", path: "/series", cta: "Criar série" },
    active: { label: "Estruturar próxima peça de conteúdo", path: "/producao", cta: "Criar conteúdo" },
  };

  // Strategic snapshot cards — only show cards with real data
  const snapshotCards: { icon: any; label: string; value: string }[] = [];
  if (data.positioning?.archetype) {
    snapshotCards.push({ icon: Target, label: "Arquétipo predominante", value: data.positioning.archetype });
  }
  if (data.positioning?.tone) {
    snapshotCards.push({ icon: Mic, label: "Tom de voz", value: data.positioning.tone });
  }
  if (data.positioning?.pillars && data.positioning.pillars.length > 0) {
    snapshotCards.push({ icon: Layers, label: "Pilares editoriais", value: data.positioning.pillars.join(" · ") });
  }
  if (data.positioning?.target_audience) {
    snapshotCards.push({ icon: Target, label: "Público-alvo", value: data.positioning.target_audience });
  }

  // Activity summary — only if active
  const activityItems: { icon: any; label: string; value: string }[] = [];
  if (data.seriesCount > 0) {
    activityItems.push({ icon: BookOpen, label: "Séries ativas", value: String(data.seriesCount) });
  }
  if (data.calendarCount > 0) {
    activityItems.push({ icon: Calendar, label: "Itens no calendário", value: String(data.calendarCount) });
  }
  if (data.contentCount > 0) {
    activityItems.push({ icon: Archive, label: "Peças estruturadas", value: String(data.contentCount) });
  }

  // Quick actions based on stage
  const quickActions: { label: string; icon: any; path: string; primary?: boolean }[] = [];
  if (stage === "pre_onboarding") {
    quickActions.push({ label: "Começar onboarding", icon: ArrowRight, path: "/onboarding", primary: true });
  } else {
    if (!data.hasDiagnosis) {
      quickActions.push({ label: "Gerar diagnóstico", icon: Target, path: "/diagnostico", primary: !data.hasDiagnosis });
    }
    if (data.hasDiagnosis && !data.hasStrategy) {
      quickActions.push({ label: "Definir estratégia", icon: Sparkles, path: "/estrategia", primary: true });
    }
    if (data.hasStrategy) {
      quickActions.push({ label: "Criar conteúdo", icon: PenTool, path: "/producao", primary: true });
      if (data.seriesCount === 0) quickActions.push({ label: "Criar primeira série", icon: BookOpen, path: "/series" });
      if (data.calendarCount === 0) quickActions.push({ label: "Montar calendário", icon: Calendar, path: "/calendario" });
    }
    if (data.contentCount > 0) {
      quickActions.push({ label: "Revisar acervo", icon: Archive, path: "/biblioteca" });
    }
  }

  const header = headerCopy[stage];
  const move = nextMove[stage];

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">{header.title}</h1>
          <p className="text-muted-foreground">{header.subtitle}</p>
        </motion.div>

        {/* Strategic Snapshot — only if data exists */}
        {snapshotCards.length > 0 && (
          <section>
            <h2 className="font-heading text-lg font-medium text-foreground mb-4">Posicionamento atual</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {snapshotCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  className="bg-card rounded-2xl border border-border p-5 shadow-sm"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <card.icon className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{card.value}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Journey Progress */}
        <section>
          <h2 className="font-heading text-lg font-medium text-foreground mb-4">Arquitetura do sistema</h2>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {journeySteps.map((step) => {
                const status = getStepStatus(step.key, data);
                return (
                  <button
                    key={step.key}
                    onClick={() => status !== "pending" && navigate(step.path)}
                    disabled={status === "pending"}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                      status === "done"
                        ? "text-foreground bg-accent/5"
                        : status === "current"
                        ? "text-accent font-medium bg-accent/10"
                        : "text-muted-foreground/50 cursor-not-allowed"
                    }`}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                    ) : (
                      <Circle className={`h-4 w-4 flex-shrink-0 ${status === "current" ? "text-accent" : "text-muted-foreground/30"}`} />
                    )}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Next Strategic Move */}
        <motion.section
          className="bg-accent/5 border border-accent/15 rounded-2xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-base font-medium text-foreground mb-1">Próximo movimento</h3>
              <p className="text-sm text-muted-foreground mb-4">{move.label}</p>
              <Button
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate(move.path)}
              >
                {move.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Activity Summary — only if there's real activity */}
        {activityItems.length > 0 && (
          <section>
            <h2 className="font-heading text-lg font-medium text-foreground mb-4">Sistema em andamento</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activityItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  className="bg-card rounded-2xl border border-border p-5 shadow-sm text-center"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <item.icon className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-heading font-semibold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                className={`rounded-xl ${action.primary ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                onClick={() => navigate(action.path)}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
