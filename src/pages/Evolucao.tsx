import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Target,
  Crown,
  Layers,
  BarChart3,
  Compass,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface EvolutionSnapshot {
  positioning_clarity: string;
  archetype_consolidation: string;
  editorial_consistency: string;
  content_mix_balance: string;
  authorship_maturity: string;
  strongest_content_types: string[];
  neglected_territories: string[];
  perceived_changes?: string;
  next_strategic_move: string;
  cycle_summary: string;
}

interface Snapshot {
  id: string;
  cycle_number: number;
  snapshot: EvolutionSnapshot;
  recommendation: string | null;
  created_at: string;
}

const LEVEL_MAP: Record<string, { value: number; label: string }> = {
  baixa: { value: 20, label: "Baixa" },
  "em construção": { value: 45, label: "Em construção" },
  clara: { value: 70, label: "Clara" },
  consolidada: { value: 95, label: "Consolidada" },
  instável: { value: 20, label: "Instável" },
  emergindo: { value: 45, label: "Emergindo" },
  definido: { value: 70, label: "Definido" },
  consolidado: { value: 95, label: "Consolidado" },
  inconsistente: { value: 20, label: "Inconsistente" },
  melhorando: { value: 45, label: "Melhorando" },
  consistente: { value: 70, label: "Consistente" },
  exemplar: { value: 95, label: "Exemplar" },
  desequilibrado: { value: 20, label: "Desequilibrado" },
  equilibrado: { value: 70, label: "Equilibrado" },
  estratégico: { value: 95, label: "Estratégico" },
  iniciante: { value: 20, label: "Iniciante" },
  "em desenvolvimento": { value: 45, label: "Em desenvolvimento" },
  autoral: { value: 70, label: "Autoral" },
  referência: { value: 95, label: "Referência" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const Evolucao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) loadSnapshots();
  }, [user]);

  const loadSnapshots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("positioning_snapshots")
      .select("*")
      .eq("user_id", user!.id)
      .order("cycle_number", { ascending: true });
    setSnapshots((data as unknown as Snapshot[]) || []);
    setLoading(false);
  };

  const generateEvolution = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-memory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (response.status === 429) { toast.error("Limite de requisições."); return; }
      if (response.status === 402) { toast.error("Créditos esgotados."); return; }
      if (!response.ok) throw new Error("Erro");
      toast.success("Evolução estratégica registrada.");
      loadSnapshots();
    } catch {
      toast.error("Erro ao gerar evolução.");
    } finally {
      setGenerating(false);
    }
  };

  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latestData = latest?.snapshot;

  const getLevelInfo = (val: string) => LEVEL_MAP[val] || { value: 50, label: val };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!latest) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Evolução do Posicionamento
            </h1>
            <p className="text-muted-foreground mb-10">
              Acompanhe como sua presença está ficando mais clara, forte e reconhecível.
            </p>
          </motion.div>

          {generating ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6">
                  <Skeleton className="h-5 w-48 mb-4" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Mapeando evolução de posicionamento…
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm mb-2 text-center max-w-sm">
                A evolução começa quando sua produção deixa de ser aleatória e passa a obedecer uma direção.
              </p>
              <Button
                onClick={generateEvolution}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 mt-4"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Registrar primeiro ciclo
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  const metrics = [
    { label: "Clareza de posicionamento", value: latestData!.positioning_clarity, icon: Target },
    { label: "Consolidação do arquétipo", value: latestData!.archetype_consolidation, icon: Crown },
    { label: "Consistência editorial", value: latestData!.editorial_consistency, icon: Layers },
    { label: "Equilíbrio de conteúdo", value: latestData!.content_mix_balance, icon: BarChart3 },
    { label: "Maturidade autoral", value: latestData!.authorship_maturity, icon: CheckCircle },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-2"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Evolução do Posicionamento
            </h1>
            <p className="text-muted-foreground">
              Acompanhe como sua presença está ficando mais clara, forte e reconhecível.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={generateEvolution}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            Novo ciclo
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground mb-8">
          Ciclo {latest.cycle_number} · Registrado em{" "}
          {new Date(latest.created_at).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-5">
          {/* Cycle Timeline */}
          {snapshots.length > 1 && (
            <motion.div
              className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <h3 className="font-heading text-base font-semibold text-foreground mb-4">
                Ciclos registrados
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {snapshots.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`flex flex-col items-center ${
                        i === snapshots.length - 1 ? "text-accent" : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          i === snapshots.length - 1
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.cycle_number}
                      </div>
                      <span className="text-[10px] mt-1 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {i < snapshots.length - 1 && (
                      <div className="w-8 h-px bg-border mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cycle Summary */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Compass className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Situação atual
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {latestData!.cycle_summary}
            </p>
          </motion.div>

          {/* Qualitative Metrics */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <h3 className="font-heading text-base font-semibold text-foreground mb-5">
              Indicadores de posicionamento
            </h3>
            <div className="space-y-4">
              {metrics.map((metric) => {
                const info = getLevelInfo(metric.value);
                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{metric.label}</span>
                      </div>
                      <span className="text-xs text-accent font-medium">{info.label}</span>
                    </div>
                    <Progress value={info.value} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Strongest Content Types */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Tipos que mais fortaleceram a marca
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {latestData!.strongest_content_types.map((t, i) => (
                <span key={i} className="text-sm bg-green-500/10 text-green-700 px-3 py-1.5 rounded-xl">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Neglected Territories */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Territórios negligenciados
              </h3>
            </div>
            <ul className="space-y-1.5">
              {latestData!.neglected_territories.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Perceived Changes */}
          {latestData!.perceived_changes && (
            <motion.div
              className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Mudanças percebidas
                </h3>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {latestData!.perceived_changes}
              </p>
            </motion.div>
          )}

          {/* Next Strategic Move */}
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/20 p-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Próximo movimento estratégico
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4">
              {latestData!.next_strategic_move}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/series")}
                variant="outline"
                className="rounded-xl"
              >
                Gerenciar séries
              </Button>
              <Button
                onClick={() => navigate("/calendario")}
                variant="outline"
                className="rounded-xl"
              >
                Replanejar calendário
              </Button>
              <Button
                onClick={() => navigate("/producao")}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Criar conteúdo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Evolucao;
