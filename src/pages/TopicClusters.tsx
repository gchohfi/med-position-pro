import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Layers,
  TrendingUp,
  ArrowRight,
  Target,
  Zap,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  getClustersForSpecialty,
  analyzeClusterUsage,
  type ClusterDefinition,
  type ClusterUsageStats,
} from "@/lib/topic-clusters";
import { BENCHMARK_PRESETS, type BenchmarkPresetId } from "@/lib/benchmark-presets";
import { ROUTES } from "@/lib/routes";

type FilterMode = "todos" | "subexplorado" | "equilibrado" | "saturado" | "alto_potencial";

const TopicClusters = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [selectedCluster, setSelectedCluster] = useState<ClusterDefinition | null>(null);
  const [filter, setFilter] = useState<FilterMode>("todos");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [profileRes, clustersRes] = await Promise.all([
      supabase.from("profiles").select("specialty").eq("id", user!.id).single(),
      supabase.from("topic_clusters").select("cluster_name, usage_count").eq("user_id", user!.id),
    ]);
    setSpecialty(profileRes.data?.specialty || "Dermatologia");
    const counts: Record<string, number> = {};
    (clustersRes.data || []).forEach((c: any) => { counts[c.cluster_name] = c.usage_count || 0; });
    setUsageCounts(counts);
    setLoading(false);
  };

  const clusters = useMemo(() => getClustersForSpecialty(specialty), [specialty]);
  const stats = useMemo(() => analyzeClusterUsage(clusters, usageCounts), [clusters, usageCounts]);
  const statsMap = useMemo(() => {
    const m: Record<string, ClusterUsageStats> = {};
    stats.forEach((s) => { m[s.clusterId] = s; });
    return m;
  }, [stats]);

  const filtered = useMemo(() => {
    if (filter === "todos") return clusters;
    if (filter === "alto_potencial") return clusters.filter((c) => statsMap[c.id]?.potential === "alto");
    return clusters.filter((c) => statsMap[c.id]?.saturation === filter);
  }, [clusters, filter, statsMap]);

  // Summary stats
  const summary = useMemo(() => {
    const sub = stats.filter((s) => s.saturation === "subexplorado").length;
    const eq = stats.filter((s) => s.saturation === "equilibrado").length;
    const sat = stats.filter((s) => s.saturation === "saturado").length;
    const highPot = stats.filter((s) => s.potential === "alto").length;
    return { sub, eq, sat, highPot, total: stats.length };
  }, [stats]);

  const seedClusters = async () => {
    setSeeding(true);
    try {
      const existing = await supabase
        .from("topic_clusters")
        .select("cluster_name")
        .eq("user_id", user!.id)
        .eq("specialty", specialty);
      const existingNames = new Set((existing.data || []).map((r: any) => r.cluster_name));
      const toInsert = clusters
        .filter((c) => !existingNames.has(c.id))
        .map((c) => ({
          user_id: user!.id,
          specialty,
          cluster_name: c.id,
          description: c.description,
          intent: c.intent,
          priority: c.defaultPriority,
          benchmark_affinity: c.benchmarkAffinity,
          recommended_objectives: c.recommendedObjectives,
          recommended_visual_styles: c.recommendedVisualStyles,
          subtopics: c.subtopics,
          contraindications: c.contraindications,
        }));
      if (toInsert.length > 0) {
        await supabase.from("topic_clusters").insert(toInsert);
      }
      toast.success(`${toInsert.length} clusters ativados para ${specialty}.`);
      loadData();
    } catch {
      toast.error("Erro ao ativar clusters.");
    } finally {
      setSeeding(false);
    }
  };

  const goToCarousel = (cluster: ClusterDefinition) => {
    const bestPreset = cluster.benchmarkAffinity[0] || "educacao_sofisticada";
    navigate(ROUTES.carrossel, {
      state: {
        cluster: cluster.id,
        clusterName: cluster.name,
        preset: bestPreset,
        objetivo: cluster.recommendedObjectives[0] || "educar",
      },
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-6xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Topic Clusters
            </h1>
            <p className="text-muted-foreground text-sm">
              Organize sua estratégia por territórios temáticos — pense como estrategista, não como gerador.
            </p>
          </div>
          <Button
            onClick={seedClusters}
            disabled={seeding}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {seeding ? "Ativando…" : "Ativar clusters"}
          </Button>
        </motion.div>

        {/* Summary Matrix */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Alto Potencial", value: summary.highPot, color: "text-accent", icon: Zap },
            { label: "Subexplorados", value: summary.sub, color: "text-amber-500", icon: Target },
            { label: "Equilibrados", value: summary.eq, color: "text-green-500", icon: BarChart3 },
            { label: "Saturados", value: summary.sat, color: "text-red-400", icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className={`font-heading text-2xl font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <SelectTrigger className="w-48 h-9 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os clusters</SelectItem>
              <SelectItem value="alto_potencial">Alto potencial</SelectItem>
              <SelectItem value="subexplorado">Subexplorados</SelectItem>
              <SelectItem value="equilibrado">Equilibrados</SelectItem>
              <SelectItem value="saturado">Saturados</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {clusters.length}
          </span>
        </div>

        {/* Cluster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((cluster, i) => {
              const stat = statsMap[cluster.id];
              return (
                <motion.div
                  key={cluster.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <button
                    onClick={() => setSelectedCluster(cluster)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-5 hover:border-accent/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cluster.icon}</span>
                        <h3 className="font-heading text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                          {cluster.name}
                        </h3>
                      </div>
                      {stat && (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 rounded-full ${
                            stat.potential === "alto"
                              ? "bg-accent/10 text-accent"
                              : stat.saturation === "saturado"
                              ? "bg-red-500/10 text-red-500"
                              : stat.saturation === "subexplorado"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {stat.potential === "alto"
                            ? "Alto potencial"
                            : stat.saturation === "saturado"
                            ? "Saturado"
                            : stat.saturation === "subexplorado"
                            ? "Subexplorado"
                            : "Equilibrado"}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {cluster.description}
                    </p>

                    {/* Affinity presets */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {cluster.benchmarkAffinity.map((presetId) => {
                        const preset = BENCHMARK_PRESETS[presetId];
                        return (
                          <span
                            key={presetId}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                          >
                            {preset?.icon} {preset?.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Usage indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60">
                        {stat?.usageCount || 0}× usado
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <div
                            key={bar}
                            className={`w-1 h-3 rounded-full ${
                              bar <= (stat?.usageCount || 0)
                                ? "bg-accent"
                                : "bg-secondary"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Cluster Detail Dialog */}
        <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
          <DialogContent className="max-w-lg">
            {selectedCluster && (() => {
              const stat = statsMap[selectedCluster.id];
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{selectedCluster.icon}</span>
                      <DialogTitle className="font-heading text-lg">
                        {selectedCluster.name}
                      </DialogTitle>
                    </div>
                  </DialogHeader>

                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedCluster.description}
                  </p>

                  {/* Subtopics */}
                  <div className="bg-background rounded-xl border border-border p-4 mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Subtemas</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedCluster.subtopics.map((st) => (
                        <Badge
                          key={st}
                          variant="secondary"
                          className="text-[11px] rounded-full bg-secondary/70"
                        >
                          {st}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Affinity */}
                  <div className="bg-background rounded-xl border border-border p-4 mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Presets compatíveis</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCluster.benchmarkAffinity.map((pid) => {
                        const p = BENCHMARK_PRESETS[pid];
                        return (
                          <div key={pid} className="flex items-center gap-1.5 text-xs text-foreground">
                            <span>{p?.icon}</span>
                            <span className="font-medium">{p?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contraindications */}
                  {selectedCluster.contraindications.length > 0 && (
                    <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-4 mb-4">
                      <span className="text-xs text-red-500/80 uppercase tracking-wide">Cuidados</span>
                      <ul className="mt-1.5 space-y-1">
                        {selectedCluster.contraindications.map((c) => (
                          <li key={c} className="text-xs text-muted-foreground">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status */}
                  {stat && (
                    <div className="flex items-center gap-3 mb-4">
                      <Badge
                        variant="secondary"
                        className={`text-xs rounded-full ${
                          stat.potential === "alto"
                            ? "bg-accent/10 text-accent"
                            : stat.saturation === "saturado"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-secondary"
                        }`}
                      >
                        {stat.potential === "alto" ? "Alto potencial" : stat.saturation}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{stat.usageCount}× usado</span>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setSelectedCluster(null);
                      goToCarousel(selectedCluster);
                    }}
                    className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11"
                  >
                    Criar carrossel neste cluster
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TopicClusters;
