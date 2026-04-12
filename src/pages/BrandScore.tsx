import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { PageHeader, SectionBlock, PremiumCard } from "@/components/ui/premium-layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Loader2, RefreshCw, Target, Mic, Eye, Shield, Heart,
  Sparkles, BarChart3, Repeat2, BookOpen, ArrowRight, TrendingUp,
  AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { useNavigate } from "react-router-dom";

/* ── Types ─────────────────────────────────────── */

type DimensionKey =
  | "clareza_posicionamento"
  | "consistencia_tom"
  | "consistencia_visual"
  | "forca_autoridade"
  | "proximidade_humana"
  | "diferenciacao"
  | "coerencia_benchmark"
  | "controle_repeticao"
  | "maturidade_editorial";

interface BrandScoreData {
  id: string;
  overall_score: number;
  dimensions: Record<DimensionKey, number>;
  explanations: Record<DimensionKey, string>;
  recommendations: { title: string; description: string; module: string; priority: string }[];
  created_at: string;
}

const DIMENSION_META: Record<DimensionKey, { label: string; icon: typeof Target; route?: string }> = {
  clareza_posicionamento: { label: "Clareza de Posicionamento", icon: Target, route: ROUTES.setup },
  consistencia_tom: { label: "Consistência de Tom", icon: Mic, route: ROUTES.setup },
  consistencia_visual: { label: "Consistência Visual", icon: Eye, route: ROUTES.referenciasVisuais },
  forca_autoridade: { label: "Força de Autoridade", icon: Shield, route: ROUTES.biblioteca },
  proximidade_humana: { label: "Proximidade Humana", icon: Heart, route: ROUTES.personas },
  diferenciacao: { label: "Diferenciação", icon: Sparkles, route: ROUTES.benchmark },
  coerencia_benchmark: { label: "Coerência com Benchmark", icon: BarChart3, route: ROUTES.benchmark },
  controle_repeticao: { label: "Controle de Repetição", icon: Repeat2, route: ROUTES.topicClusters },
  maturidade_editorial: { label: "Maturidade Editorial", icon: BookOpen, route: ROUTES.carrossel },
};

const DIMENSION_ORDER: DimensionKey[] = [
  "clareza_posicionamento", "consistencia_tom", "consistencia_visual",
  "forca_autoridade", "proximidade_humana", "diferenciacao",
  "coerencia_benchmark", "controle_repeticao", "maturidade_editorial",
];

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-accent";
  if (score >= 40) return "text-amber-500";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-accent";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Em desenvolvimento";
  return "Precisa atenção";
}

/* ── Score Ring ─────────────────────────────────── */

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--accent))" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-heading text-4xl text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-0.5">{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

/* ── Dimension Bar ─────────────────────────────── */

function DimensionRow({ dimKey, score, explanation }: { dimKey: DimensionKey; score: number; explanation: string }) {
  const navigate = useNavigate();
  const meta = DIMENSION_META[dimKey];
  const Icon = meta.icon;

  return (
    <div className="py-3 group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{meta.label}</span>
        </div>
        <span className={`text-sm font-medium ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-1.5">
        <motion.div
          className={`h-full rounded-full ${scoreBg(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{explanation}</p>
        {meta.route && (
          <button onClick={() => navigate(meta.route!)} className="text-xs text-accent hover:underline flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            Ir <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Evolution Sparkline ───────────────────────── */

function EvolutionChart({ history }: { history: BrandScoreData[] }) {
  if (history.length < 2) return null;

  const scores = history.map(h => h.overall_score);
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const w = 400;
  const h = 80;

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  const trend = scores[0] - scores[scores.length - 1];

  return (
    <PremiumCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-label text-muted-foreground">Evolução</p>
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`h-3.5 w-3.5 ${trend >= 0 ? "text-emerald-500" : "text-red-400"}`} />
          <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-500" : "text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend} pts
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <polyline fill="none" stroke="hsl(var(--accent))" strokeWidth={2} points={points} strokeLinejoin="round" />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * w;
          const y = h - ((s - min) / range) * h;
          return <circle key={i} cx={x} cy={y} r={3} fill="hsl(var(--accent))" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        {history.map((h, i) => (
          <span key={h.id}>{new Date(h.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
        )).reverse()}
      </div>
    </PremiumCard>
  );
}

/* ── Recommendation Card ───────────────────────── */

function RecommendationCard({ rec }: { rec: { title: string; description: string; module: string; priority: string } }) {
  const navigate = useNavigate();
  const moduleRoutes: Record<string, string> = {
    posicionamento: ROUTES.setup,
    carrossel: ROUTES.carrossel,
    biblioteca: ROUTES.biblioteca,
    benchmark: ROUTES.benchmark,
    calendario: ROUTES.carrossel,
    series: ROUTES.carrossel,
    clusters: ROUTES.topicClusters,
    personas: ROUTES.personas,
    referencias: ROUTES.referenciasVisuais,
  };

  const route = Object.entries(moduleRoutes).find(([k]) => rec.module?.toLowerCase().includes(k))?.[1];
  const PriorityIcon = rec.priority === "alta" ? AlertTriangle : rec.priority === "media" ? Info : CheckCircle2;
  const priorityColor = rec.priority === "alta" ? "text-red-400" : rec.priority === "media" ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
      <PriorityIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${priorityColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{rec.title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
      </div>
      {route && (
        <Button variant="ghost" size="sm" className="text-xs flex-shrink-0" onClick={() => navigate(route)}>
          Ir <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────── */

export default function BrandScore() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState<BrandScoreData | null>(null);
  const [history, setHistory] = useState<BrandScoreData[]>([]);

  const fetchScores = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("brand_scores")
      .select("id, overall_score, dimensions, explanations, recommendations, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const scores = (data ?? []) as unknown as BrandScoreData[];
    setCurrent(scores[0] ?? null);
    setHistory(scores);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const generateScore = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-brand-score");
      if (error) throw error;
      toast.success("Score de marca atualizado");
      await fetchScores();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar score");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl space-y-10">
        <div className="flex items-start justify-between">
          <PageHeader title="Score de Marca" subtitle="Avaliação estratégica da sua presença editorial" />
          <Button onClick={generateScore} disabled={generating} size="sm" className="mt-1">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {current ? "Atualizar" : "Gerar score"}
          </Button>
        </div>

        {!current ? (
          <PremiumCard className="p-10 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Nenhum score gerado ainda</p>
            <p className="text-sm text-muted-foreground mb-4">Clique em "Gerar score" para avaliar sua marca pessoal com base nos dados do seu sistema editorial.</p>
            <Button onClick={generateScore} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar primeiro score
            </Button>
          </PremiumCard>
        ) : (
          <>
            {/* Score Overview */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                <PremiumCard className="p-8 flex flex-col items-center">
                  <p className="text-label text-muted-foreground mb-4">Score Geral</p>
                  <ScoreRing score={current.overall_score} />
                  <p className="text-xs text-muted-foreground mt-3">
                    Atualizado em {new Date(current.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </PremiumCard>

                <div className="space-y-0 divide-y divide-border/50">
                  {DIMENSION_ORDER.map((key) => (
                    <DimensionRow
                      key={key}
                      dimKey={key}
                      score={current.dimensions[key] ?? 0}
                      explanation={current.explanations[key] ?? ""}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Evolution */}
            {history.length >= 2 && (
              <SectionBlock label="Evolução do Score">
                <EvolutionChart history={history} />
              </SectionBlock>
            )}

            {/* Recommendations */}
            {current.recommendations.length > 0 && (
              <SectionBlock label="Recomendações">
                <div className="space-y-2">
                  {current.recommendations.map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} />
                  ))}
                </div>
              </SectionBlock>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
