import React, { useState, useMemo, useCallback, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Loader2, Sparkles, Target, ArrowRight,
  Plus, X, AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRESET_LIST, getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Types ─────────────────────────────────────────── */

interface AxisConfig {
  id: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
}

const AXES: AxisConfig[] = [
  { id: "premium_acessivel", label: "Premium ↔ Acessível", leftLabel: "Premium", rightLabel: "Acessível" },
  { id: "tecnico_coloquial", label: "Técnico ↔ Coloquial", leftLabel: "Técnico", rightLabel: "Coloquial" },
  { id: "provocativo_acolhedor", label: "Provocativo ↔ Acolhedor", leftLabel: "Provocativo", rightLabel: "Acolhedor" },
  { id: "autoridade_proximidade", label: "Autoridade ↔ Proximidade", leftLabel: "Autoridade", rightLabel: "Proximidade" },
  { id: "educativo_conversao", label: "Educativo ↔ Conversão", leftLabel: "Educativo", rightLabel: "Conversão" },
];

interface PlottedProfile {
  name: string;
  isUser: boolean;
  x: number; // 0-100
  y: number; // 0-100
  preset?: string;
  insight?: string;
}

interface MapResult {
  profiles: PlottedProfile[];
  empty_zones: string[];
  opportunities: string[];
  similarities: string[];
  recommended_preset: string;
  recommended_preset_reason: string;
}

/* ── Component ─────────────────────────────────────── */

const MapaDiferenciacao = () => {
  const { profile, isConfigured } = useDoctor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [axisX, setAxisX] = useState<string>("premium_acessivel");
  const [axisY, setAxisY] = useState<string>("provocativo_acolhedor");
  const [benchmarks, setBenchmarks] = useState<string[]>([]);
  const [newBenchmark, setNewBenchmark] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapResult | null>(null);

  // Load saved inspiration profiles as benchmark options
  const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("inspiration_profiles")
      .select("handle")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedProfiles(data.map((p) => p.handle));
      });
  }, [user]);

  const xAxis = AXES.find((a) => a.id === axisX)!;
  const yAxis = AXES.find((a) => a.id === axisY)!;

  const addBenchmark = () => {
    const handle = newBenchmark.trim().replace(/^@/, "");
    if (!handle) return;
    if (benchmarks.includes(handle)) { toast.error("Já adicionado."); return; }
    setBenchmarks((prev) => [...prev, handle]);
    setNewBenchmark("");
  };

  const removeBenchmark = (h: string) => setBenchmarks((prev) => prev.filter((b) => b !== h));

  const handleGenerate = async () => {
    if (!profile || benchmarks.length === 0) {
      toast.error("Adicione pelo menos uma referência.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? key;

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-ideas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: key,
        },
        body: JSON.stringify({
          type: "differentiation_map",
          profile,
          benchmarks,
          axis_x: { id: axisX, left: xAxis.leftLabel, right: xAxis.rightLabel },
          axis_y: { id: axisY, left: yAxis.leftLabel, right: yAxis.rightLabel },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      if (data.map) {
        setResult(data.map);
      } else {
        throw new Error("Formato de resposta inesperado");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar mapa.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Compass className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground">
                Mapa de Diferenciação
              </h1>
              <p className="text-muted-foreground text-sm">
                Visualize seu posicionamento em relação a perfis de referência e encontre espaços vazios.
              </p>
            </div>
          </div>
        </div>

        {!isConfigured ? (
          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Perfil não configurado</p>
              <p className="text-xs text-muted-foreground">Configure seu perfil primeiro.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/setup")}>Ir para Setup</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {/* Axis selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Eixo horizontal (X)</label>
                  <Select value={axisX} onValueChange={setAxisX}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AXES.filter((a) => a.id !== axisY).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Eixo vertical (Y)</label>
                  <Select value={axisY} onValueChange={setAxisY}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AXES.filter((a) => a.id !== axisX).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Benchmarks */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Perfis de referência</label>
                <div className="flex gap-2">
                  <input
                    value={newBenchmark}
                    onChange={(e) => setNewBenchmark(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addBenchmark(); }}
                    placeholder="@perfil_referencia"
                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button size="sm" variant="outline" onClick={addBenchmark} className="h-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Saved profiles as quick-add */}
                {savedProfiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {savedProfiles.filter((h) => !benchmarks.includes(h)).slice(0, 6).map((h) => (
                      <button
                        key={h}
                        onClick={() => setBenchmarks((prev) => [...prev, h])}
                        className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-accent/30 hover:text-foreground transition-colors"
                      >
                        + {h}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected benchmarks */}
                {benchmarks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {benchmarks.map((h) => (
                      <Badge key={h} variant="secondary" className="gap-1 pr-1 text-xs">
                        @{h}
                        <button onClick={() => removeBenchmark(h)} className="p-0.5 rounded-full hover:bg-muted">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || benchmarks.length === 0}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analisando posicionamento...</>
                ) : (
                  <><Target className="h-4 w-4 mr-2" />Gerar mapa de diferenciação</>
                )}
              </Button>
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Scatter plot */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-foreground mb-4">Posicionamento Comparativo</h2>
                    <ScatterPlot
                      profiles={result.profiles}
                      xAxis={xAxis}
                      yAxis={yAxis}
                    />
                  </div>

                  {/* Insights grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Empty zones */}
                    {result.empty_zones.length > 0 && (
                      <InsightCard
                        title="Zonas vazias"
                        subtitle="Oportunidades de diferenciação"
                        items={result.empty_zones}
                        accentClass="text-emerald-600"
                        icon="🟢"
                      />
                    )}

                    {/* Opportunities */}
                    {result.opportunities.length > 0 && (
                      <InsightCard
                        title="Oportunidades"
                        subtitle="Movimentos estratégicos sugeridos"
                        items={result.opportunities}
                        accentClass="text-accent"
                        icon="💡"
                      />
                    )}

                    {/* Similarities */}
                    {result.similarities.length > 0 && (
                      <InsightCard
                        title="Excessos de semelhança"
                        subtitle="Onde você está muito próximo de concorrentes"
                        items={result.similarities}
                        accentClass="text-amber-600"
                        icon="⚠️"
                      />
                    )}

                    {/* Recommended preset */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        Preset recomendado
                      </p>
                      {(() => {
                        const preset = getPreset(result.recommended_preset as BenchmarkPresetId);
                        return (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{preset.icon}</span>
                              <div>
                                <p className="text-sm font-semibold">{preset.label}</p>
                                <p className="text-[10px] text-muted-foreground">{preset.tagline}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{result.recommended_preset_reason}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs mt-1"
                              onClick={() => navigate("/carrossel", { state: { benchmarkPreset: result.recommended_preset } })}
                            >
                              Usar no carrossel <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/* ── Scatter Plot ─────────────────────────────────── */

function ScatterPlot({
  profiles,
  xAxis,
  yAxis,
}: {
  profiles: PlottedProfile[];
  xAxis: AxisConfig;
  yAxis: AxisConfig;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full" style={{ paddingBottom: "75%" }}>
      <div className="absolute inset-0">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="200" y1="0" x2="200" y2="300" stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="100" y1="0" x2="100" y2="300" stroke="currentColor" className="text-border/30" strokeWidth="0.3" strokeDasharray="2 4" />
          <line x1="300" y1="0" x2="300" y2="300" stroke="currentColor" className="text-border/30" strokeWidth="0.3" strokeDasharray="2 4" />
          <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" className="text-border/30" strokeWidth="0.3" strokeDasharray="2 4" />
          <line x1="0" y1="225" x2="400" y2="225" stroke="currentColor" className="text-border/30" strokeWidth="0.3" strokeDasharray="2 4" />
        </svg>

        {/* Axis labels */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium writing-mode-vertical"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}>
          {yAxis.leftLabel}
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium"
          style={{ writingMode: "vertical-rl" }}>
          {yAxis.rightLabel}
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">
          {xAxis.rightLabel}
        </span>
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">
          {xAxis.leftLabel}
        </span>

        {/* Dots */}
        {profiles.map((p) => {
          const left = `${8 + p.x * 0.84}%`;
          const top = `${8 + p.y * 0.84}%`;
          const isHovered = hovered === p.name;

          return (
            <motion.div
              key={p.name}
              className="absolute flex flex-col items-center"
              style={{ left, top, transform: "translate(-50%, -50%)" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              onMouseEnter={() => setHovered(p.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`rounded-full border-2 transition-all cursor-pointer ${
                  p.isUser
                    ? "w-5 h-5 bg-accent border-accent shadow-lg shadow-accent/20"
                    : "w-3.5 h-3.5 bg-muted-foreground/30 border-muted-foreground/50 hover:bg-muted-foreground/50"
                }`}
              />
              <span className={`text-[9px] mt-1 whitespace-nowrap font-medium transition-opacity ${
                p.isUser
                  ? "text-accent"
                  : isHovered ? "text-foreground opacity-100" : "text-muted-foreground opacity-70"
              }`}>
                {p.name}
              </span>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && p.insight && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full mt-2 bg-card border border-border rounded-lg p-2 shadow-lg z-10 w-48"
                  >
                    <p className="text-[10px] text-foreground font-medium mb-0.5">{p.name}</p>
                    {p.preset && (
                      <p className="text-[9px] text-accent mb-1">{getPreset(p.preset as BenchmarkPresetId).icon} {getPreset(p.preset as BenchmarkPresetId).label}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground">{p.insight}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Insight Card ─────────────────────────────────── */

function InsightCard({
  title,
  subtitle,
  items,
  accentClass,
  icon,
}: {
  title: string;
  subtitle: string;
  items: string[];
  accentClass: string;
  icon: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className={`text-xs font-medium ${accentClass} mb-0.5 flex items-center gap-1.5`}>
        <span>{icon}</span> {title}
      </p>
      <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground flex gap-2">
            <span className="text-muted-foreground/40 shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MapaDiferenciacao;
