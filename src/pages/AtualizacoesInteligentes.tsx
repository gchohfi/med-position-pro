import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Zap,
  RefreshCw,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Settings2,
  TrendingDown,
  Target,
  Lightbulb,
  BookOpen,
  Calendar,
  PenTool,
  Radar,
  Brain,
  TrendingUp,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

interface StrategicUpdate {
  id: string;
  update_type: string;
  title: string;
  description: string | null;
  source_module: string | null;
  action_module: string | null;
  action_label: string | null;
  action_path: string | null;
  severity: string;
  is_read: boolean;
  created_at: string;
}

interface NextMove {
  title: string;
  why: string;
  action_label: string;
  action_path: string;
}

interface StalenessItem {
  area: string;
  risk: string;
  recommendation: string;
  module_path: string;
}

interface AutomationPrefs {
  radar_frequency: string;
  memory_refresh: boolean;
  calendar_check: boolean;
  repetition_alerts: boolean;
  territory_suggestions: boolean;
  positioning_review: boolean;
  intensity: string;
}

const MODULE_ICONS: Record<string, any> = {
  estrategia: Lightbulb,
  series: BookOpen,
  calendario: Calendar,
  producao: PenTool,
  radar: Radar,
  "memoria-viva": Brain,
  evolucao: TrendingUp,
  sistema: Settings2,
};

const SEVERITY_STYLES: Record<string, { bg: string; icon: any }> = {
  info: { bg: "bg-blue-500/10 border-blue-500/20 text-blue-700", icon: Info },
  warning: { bg: "bg-amber-500/10 border-amber-500/20 text-amber-700", icon: AlertTriangle },
  success: { bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700", icon: CheckCircle2 },
};

const TYPE_LABELS: Record<string, string> = {
  repetition: "Repetição detectada",
  stagnation: "Estagnação",
  opportunity: "Oportunidade",
  recommendation: "Recomendação",
  drift: "Desvio estratégico",
  refresh: "Atualização",
};

const INTENSITY_OPTIONS = [
  { value: "discreto", label: "Discreto", desc: "Atualizações pontuais e mínimas" },
  { value: "equilibrado", label: "Equilibrado", desc: "Cadência regular e estratégica" },
  { value: "proativo", label: "Proativo", desc: "Máxima inteligência ativa" },
];

const ROUTINES = [
  { key: "memory_refresh", label: "Atualizar memória estratégica", icon: Brain, desc: "Refina padrões validados e territórios" },
  { key: "calendar_check", label: "Verificar repetição no calendário", icon: Calendar, desc: "Detecta excesso de tipos similares" },
  { key: "repetition_alerts", label: "Alertar sobre repetição de conteúdo", icon: AlertTriangle, desc: "Sinaliza saturação editorial" },
  { key: "territory_suggestions", label: "Sugerir novos territórios", icon: Target, desc: "Identifica espaços inexplorados" },
  { key: "positioning_review", label: "Revisão mensal de posicionamento", icon: TrendingUp, desc: "Compara direção atual com mercado" },
];

const LOADING_MESSAGES = [
  "Refinando sua leitura estratégica…",
  "Atualizando sinais do sistema…",
  "Conectando memória, mercado e direção editorial…",
];

const AtualizacoesInteligentes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [updates, setUpdates] = useState<StrategicUpdate[]>([]);
  const [nextMove, setNextMove] = useState<NextMove | null>(null);
  const [staleness, setStaleness] = useState<StalenessItem[]>([]);
  const [prefs, setPrefs] = useState<AutomationPrefs>({
    radar_frequency: "semanal",
    memory_refresh: true,
    calendar_check: true,
    repetition_alerts: true,
    territory_suggestions: true,
    positioning_review: true,
    intensity: "equilibrado",
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (!generating) { setLoadingMsgIndex(0); return; }
    const interval = setInterval(() => {
      setLoadingMsgIndex((p) => (p + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [generating]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: updatesData }, { data: prefsData }] = await Promise.all([
      supabase
        .from("strategic_updates")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("automation_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

    if (updatesData) setUpdates(updatesData as StrategicUpdate[]);
    if (prefsData) {
      setPrefs({
        radar_frequency: (prefsData as any).radar_frequency || "semanal",
        memory_refresh: (prefsData as any).memory_refresh ?? true,
        calendar_check: (prefsData as any).calendar_check ?? true,
        repetition_alerts: (prefsData as any).repetition_alerts ?? true,
        territory_suggestions: (prefsData as any).territory_suggestions ?? true,
        positioning_review: (prefsData as any).positioning_review ?? true,
        intensity: (prefsData as any).intensity || "equilibrado",
      });
    }
    setLoading(false);
  };

  const generateUpdates = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? supabaseKey;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-strategic-updates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) throw new Error("Erro na geração");
      const result = await res.json();

      if (result.updates) setUpdates(result.updates);
      if (result.next_move) setNextMove(result.next_move);
      if (result.staleness) setStaleness(result.staleness);

      toast.success("Nova atualização estratégica incorporada.");
    } catch {
      toast.error("Erro ao gerar atualizações. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const savePrefs = async (newPrefs: AutomationPrefs) => {
    setPrefs(newPrefs);
    const { data: existing } = await supabase
      .from("automation_preferences")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("automation_preferences")
        .update({ ...newPrefs, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
    } else {
      await supabase
        .from("automation_preferences")
        .insert({ user_id: user!.id, ...newPrefs });
    }
    toast.success("Preferências salvas.");
  };

  const hasData = updates.length > 0;
  const warnings = updates.filter((u) => u.severity === "warning");
  const infos = updates.filter((u) => u.severity !== "warning");

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-5xl space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6">
                <Skeleton className="h-4 w-48 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
                Atualizações Inteligentes
              </h1>
              <p className="text-muted-foreground text-sm">
                O MEDSHIFT continua refinando sua direção com base no que já foi construído, no que está faltando e no que está mudando ao redor.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                Preferências
              </Button>
              <Button
                onClick={generateUpdates}
                disabled={generating}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-sm"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {generating ? "Analisando…" : hasData ? "Atualizar" : "Gerar análise"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.section
            className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <h2 className="font-heading text-lg font-medium text-foreground">Rotinas programadas</h2>
            <p className="text-xs text-muted-foreground -mt-4">
              Controle como o sistema mantém sua inteligência estratégica atualizada.
            </p>

            <div className="space-y-4">
              {ROUTINES.map((r) => {
                const Icon = r.icon;
                const val = prefs[r.key as keyof AutomationPrefs] as boolean;
                return (
                  <div key={r.key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={val}
                      onCheckedChange={(checked) =>
                        savePrefs({ ...prefs, [r.key]: checked })
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Intensidade do sistema</h3>
              <div className="grid grid-cols-3 gap-3">
                {INTENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => savePrefs({ ...prefs, intensity: opt.value })}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      prefs.intensity === opt.value
                        ? "border-accent bg-accent/5 shadow-sm"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Generating state */}
        {generating && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {!hasData && !generating && (
          <motion.div
            className="flex flex-col items-center py-20"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Inteligência estratégica em espera
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              As atualizações inteligentes começam a ganhar força conforme o MEDSHIFT entende sua marca, sua produção e o seu território.
            </p>
            <Button
              onClick={generateUpdates}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar primeira análise
            </Button>
          </motion.div>
        )}

        {/* Data sections */}
        {hasData && !generating && (
          <>
            {/* Next Move */}
            {nextMove && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <div className="bg-accent/5 rounded-2xl border border-accent/15 p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
                        Próximo movimento recomendado
                      </p>
                      <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
                        {nextMove.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">{nextMove.why}</p>
                      <Button
                        size="sm"
                        className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => navigate(nextMove.action_path)}
                      >
                        {nextMove.action_label}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Staleness / Drift */}
            {warnings.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Sinais de estagnação ou repetição
                  </h2>
                </div>
                <div className="space-y-3">
                  {warnings.map((u) => (
                    <div key={u.id} className="bg-amber-500/5 rounded-2xl border border-amber-500/15 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-1">{u.title}</h3>
                            <p className="text-xs text-muted-foreground">{u.description}</p>
                          </div>
                        </div>
                        {u.action_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl shrink-0 text-xs"
                            onClick={() => navigate(u.action_path!)}
                          >
                            {u.action_label || "Revisar"}
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Strategic Updates */}
            {infos.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    O que foi atualizado
                  </h2>
                </div>
                <div className="space-y-3">
                  {infos.map((u) => {
                    const style = SEVERITY_STYLES[u.severity] || SEVERITY_STYLES.info;
                    const SevIcon = style.icon;
                    const ModIcon = MODULE_ICONS[u.source_module || "sistema"] || Info;
                    return (
                      <div key={u.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <ModIcon className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-foreground">{u.title}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${style.bg}`}>
                                  {TYPE_LABELS[u.update_type] || u.update_type}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{u.description}</p>
                            </div>
                          </div>
                          {u.action_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl shrink-0 text-xs"
                              onClick={() => navigate(u.action_path!)}
                            >
                              {u.action_label || "Abrir"}
                              <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* System alive indicator */}
            <motion.div
              className="bg-muted/30 rounded-2xl border border-border p-4 flex items-center justify-between"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {updates[0] && new Date(updates[0].created_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={generateUpdates}
                disabled={generating}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Atualizar agora
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AtualizacoesInteligentes;
