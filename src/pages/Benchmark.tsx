import React, { useState } from "react";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, RefreshCw, Brain, Check, ArrowRight, X,
  Sparkles, Target, Eye, Zap, Crown, BookOpen, Heart,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import {
  BENCHMARK_PRESETS,
  type BenchmarkPresetId,
} from "@/lib/benchmark-presets";

/* ── Types ─────────────────────────────────────────────────────── */

interface BenchmarkRef {
  nome: string;
  posicionamento: string;
  estilo_editorial: string;
  estilo_visual: string;
  hook_style: string;
  cta_style: string;
  sensacao_marca: string;
  forca_autoridade: number;
  forca_engajamento: number;
  densidade_texto: string;
  ritmo: string;
  pontos_fortes: string[];
  o_que_evitar: string[];
  como_adaptar: string;
  preset_sugerido: string;
}

interface InsightEstrategico {
  insight: string;
  acao: string;
  impacto: string;
}

interface BenchmarkData {
  referencias: BenchmarkRef[];
  insights_estrategicos: InsightEstrategico[];
}

/* ── Helpers ───────────────────────────────────────────────────── */

const presetIcons: Record<string, React.ReactNode> = {
  impacto_viral: <Zap className="h-3.5 w-3.5" />,
  autoridade_premium: <Crown className="h-3.5 w-3.5" />,
  educacao_sofisticada: <BookOpen className="h-3.5 w-3.5" />,
  consultorio_humano: <Heart className="h-3.5 w-3.5" />,
};

const presetColors: Record<string, string> = {
  impacto_viral: "text-red-600 bg-red-50 border-red-200",
  autoridade_premium: "text-amber-700 bg-amber-50 border-amber-200",
  educacao_sofisticada: "text-emerald-700 bg-emerald-50 border-emerald-200",
  consultorio_humano: "text-orange-600 bg-orange-50 border-orange-200",
};

const impactoColors: Record<string, string> = {
  alto: "text-red-700 bg-red-50",
  medio: "text-amber-700 bg-amber-50",
  baixo: "text-emerald-700 bg-emerald-50",
};

function ScoreBar({ value, max = 10, label }: { value: number; max?: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */

const BenchmarkPage = () => {
  const { profile } = useDoctor();
  const navigate = useNavigate();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  const generate = async () => {
    if (!profile?.especialidade) {
      toast.error("Configure sua especialidade no perfil primeiro.");
      return;
    }
    setLoading(true);
    setSelected(new Set());
    setCompareMode(false);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-ideas", {
        body: { mode: "benchmark", especialidade: profile.especialidade },
      });
      if (error) throw error;
      setData(result as BenchmarkData);
    } catch (err: any) {
      toast.error(err.message || "Erro ao pesquisar benchmarks.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else if (next.size < 3) { next.add(i); }
      return next;
    });
  };

  const useAsPreset = (ref: BenchmarkRef) => {
    const presetId = ref.preset_sugerido as BenchmarkPresetId;
    const preset = BENCHMARK_PRESETS[presetId];
    if (preset) {
      navigate("/carrossel", { state: { benchmarkPreset: presetId } });
      toast.success(`Direção "${preset.label}" aplicada ao carrossel.`);
    } else {
      navigate("/carrossel");
    }
  };

  const selectedRefs = data?.referencias.filter((_, i) => selected.has(i)) || [];

  /* ── Comparison traits ───────────────────────────────────────── */
  const comparisonTraits = [
    { key: "estilo_editorial", label: "Tom editorial" },
    { key: "hook_style", label: "Estilo do gancho" },
    { key: "cta_style", label: "Estilo do CTA" },
    { key: "ritmo", label: "Ritmo narrativo" },
    { key: "densidade_texto", label: "Densidade" },
    { key: "estilo_visual", label: "Visual" },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="font-heading text-title tracking-tight text-foreground">
              Benchmark Estratégico
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Analise referências, compare direções e transforme benchmarks em decisões.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {data && selectedRefs.length >= 2 && (
              <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)} className="h-8 text-xs gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {compareMode ? "Fechar" : `Comparar (${selectedRefs.length})`}
              </Button>
            )}
            <Button onClick={generate} disabled={loading} size="sm" className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analisando…</> : <><Globe className="h-3.5 w-3.5" /> Gerar análise</>}
            </Button>
          </div>
        </div>



        {/* Loading */}
        {loading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface-card p-5 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

            {/* Compare mode */}
            <AnimatePresence>
              {compareMode && selectedRefs.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="surface-card border-accent/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5 text-accent" /> Comparação estratégica
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setCompareMode(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Header row */}
                    <div className={`grid gap-3 ${selectedRefs.length === 2 ? "grid-cols-[140px_1fr_1fr]" : "grid-cols-[140px_1fr_1fr_1fr]"}`}>
                      <div />
                      {selectedRefs.map((r, i) => (
                        <div key={i} className="text-center">
                          <p className="text-sm font-semibold text-foreground truncate">{r.nome.split("(")[0].trim()}</p>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${presetColors[r.preset_sugerido] || ""}`}>
                            {presetIcons[r.preset_sugerido]} {BENCHMARK_PRESETS[r.preset_sugerido as BenchmarkPresetId]?.label || r.preset_sugerido}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Trait rows */}
                    <div className="space-y-0 divide-y divide-border/30">
                      {comparisonTraits.map(({ key, label }) => (
                        <div key={key} className={`grid gap-3 py-2.5 ${selectedRefs.length === 2 ? "grid-cols-[140px_1fr_1fr]" : "grid-cols-[140px_1fr_1fr_1fr]"}`}>
                          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                          {selectedRefs.map((r, i) => (
                            <span key={i} className="text-xs text-foreground capitalize text-center">
                              {(r[key as keyof BenchmarkRef] as string)?.replace(/_/g, " ") || "—"}
                            </span>
                          ))}
                        </div>
                      ))}

                      {/* Score rows */}
                      <div className={`grid gap-3 py-2.5 ${selectedRefs.length === 2 ? "grid-cols-[140px_1fr_1fr]" : "grid-cols-[140px_1fr_1fr_1fr]"}`}>
                        <span className="text-[11px] font-medium text-muted-foreground">Autoridade</span>
                        {selectedRefs.map((r, i) => (
                          <div key={i} className="flex justify-center">
                            <span className="text-xs font-semibold text-foreground">{r.forca_autoridade}/10</span>
                          </div>
                        ))}
                      </div>
                      <div className={`grid gap-3 py-2.5 ${selectedRefs.length === 2 ? "grid-cols-[140px_1fr_1fr]" : "grid-cols-[140px_1fr_1fr_1fr]"}`}>
                        <span className="text-[11px] font-medium text-muted-foreground">Engajamento</span>
                        {selectedRefs.map((r, i) => (
                          <div key={i} className="flex justify-center">
                            <span className="text-xs font-semibold text-foreground">{r.forca_engajamento}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Benchmark cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-label uppercase tracking-wider text-muted-foreground/60">
                  Referências analisadas
                </h3>
                {data.referencias.length > 1 && (
                  <p className="text-[11px] text-muted-foreground">
                    Selecione 2-3 cards para comparar
                  </p>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.referencias.map((ref, i) => {
                  const isSelected = selected.has(i);
                  const presetId = ref.preset_sugerido as BenchmarkPresetId;
                  const preset = BENCHMARK_PRESETS[presetId];

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`surface-card transition-all cursor-pointer ${
                        isSelected ? "border-accent shadow-premium-md ring-1 ring-accent/10" : "hover:shadow-premium-md hover:border-accent/20"
                      }`}
                      onClick={() => toggleSelect(i)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">{ref.nome}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ref.posicionamento}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-accent bg-accent" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-accent-foreground" />}
                        </div>
                      </div>

                      {/* Brand feel */}
                      <p className="text-xs italic text-muted-foreground/80 mb-4 border-l-2 border-accent/30 pl-3">
                        "{ref.sensacao_marca}"
                      </p>

                      {/* Scores */}
                      <div className="space-y-2 mb-4">
                        <ScoreBar value={ref.forca_autoridade} label="Autoridade" />
                        <ScoreBar value={ref.forca_engajamento} label="Engajamento" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <Badge variant="outline" className="text-[10px]">{ref.hook_style}</Badge>
                        <Badge variant="outline" className="text-[10px]">{ref.ritmo?.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline" className="text-[10px]">{ref.densidade_texto}</Badge>
                        {preset && (
                          <Badge variant="outline" className={`text-[10px] gap-1 ${presetColors[presetId] || ""}`}>
                            {presetIcons[presetId]} {preset.label}
                          </Badge>
                        )}
                      </div>

                      {/* Strengths & avoid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-semibold text-foreground mb-1">✓ Pontos fortes</p>
                          {ref.pontos_fortes?.map((p, j) => (
                            <p key={j} className="text-[11px] text-muted-foreground leading-relaxed">• {p}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-foreground mb-1">✕ Evitar copiar</p>
                          {ref.o_que_evitar?.map((p, j) => (
                            <p key={j} className="text-[11px] text-muted-foreground leading-relaxed">• {p}</p>
                          ))}
                        </div>
                      </div>

                      {/* Adaptation */}
                      <div className="bg-accent/5 rounded-lg p-3 mb-4">
                        <p className="text-[10px] font-semibold text-accent mb-1">Como adaptar para você</p>
                        <p className="text-[11px] text-muted-foreground">{ref.como_adaptar}</p>
                      </div>

                      {/* CTA */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 text-xs"
                        onClick={(e) => { e.stopPropagation(); useAsPreset(ref); }}
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                        Usar como base no carrossel
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Strategic insights */}
            {data.insights_estrategicos?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" /> Insights Estratégicos
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.insights_estrategicos.map((ins, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground">{ins.insight}</p>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${impactoColors[ins.impacto] || ""}`}>
                          {ins.impacto}
                        </Badge>
                      </div>
                      <p className="text-xs text-accent">{ins.acao}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !data && (
          <div className="flex flex-col items-center py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm mb-1">
              Analise referências de conteúdo médico e transforme em decisões estratégicas para seus carrosséis.
            </p>
            <p className="text-muted-foreground/60 text-xs max-w-xs">
              Gere benchmarks, compare direções e escolha o preset ideal.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BenchmarkPage;
