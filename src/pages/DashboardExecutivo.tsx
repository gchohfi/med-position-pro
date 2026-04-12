import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { PageHeader, SectionBlock, PremiumCard } from "@/components/ui/premium-layout";
import { motion } from "framer-motion";
import {
  Loader2, ArrowRight, TrendingUp, TrendingDown, Minus,
  Layers, Calendar, Archive, Target, Sparkles, AlertTriangle,
  BookOpen, BarChart3, Repeat2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { BENCHMARK_PRESETS, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Types ─────────────────────────────────────── */

interface DashboardStats {
  totalContent: number;
  recentContent: ContentItem[];
  presetDistribution: Record<string, number>;
  objectiveDistribution: Record<string, number>;
  clusterDistribution: Record<string, number>;
  goldenCases: ContentItem[];
  highRewriteContent: ContentItem[];
  calendarTotal: number;
  calendarByStatus: Record<string, number>;
  libraryTotal: number;
  seriesCount: number;
  strategicAlerts: string[];
  topPreset: string | null;
  neglectedClusters: string[];
}

interface ContentItem {
  id: string;
  title: string | null;
  content_type: string;
  created_at: string;
  golden_case: boolean;
  strategic_input: Record<string, unknown>;
  generated_content: Record<string, unknown>;
  campaign_id: string | null;
}

/* ── Data Fetching ─────────────────────────────── */

async function fetchDashboardData(userId: string): Promise<DashboardStats> {
  const [contentRes, calendarRes, seriesRes, clustersRes, memoryRes] = await Promise.all([
    supabase.from("content_outputs").select("id, title, content_type, created_at, golden_case, strategic_input, generated_content, campaign_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("calendar_items").select("id, status").eq("user_id", userId),
    supabase.from("series").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("topic_clusters").select("cluster_name, usage_count").eq("user_id", userId),
    supabase.from("strategic_memory").select("preferred_presets, rejected_patterns, rewrite_count, notes_summary").eq("user_id", userId).maybeSingle(),
  ]);

  const contents = (contentRes.data ?? []) as unknown as ContentItem[];
  const calendarItems = calendarRes.data ?? [];
  const clusters = clustersRes.data ?? [];

  // Preset distribution
  const presetDist: Record<string, number> = {};
  const objDist: Record<string, number> = {};
  const clusterDist: Record<string, number> = {};
  let maxRewrite = 0;
  const highRewrite: ContentItem[] = [];

  for (const c of contents) {
    const si = c.strategic_input as Record<string, unknown>;
    const preset = (si?.benchmark_preset ?? si?.benchmarkPreset ?? "sem_preset") as string;
    presetDist[preset] = (presetDist[preset] || 0) + 1;

    const obj = (si?.objetivo ?? si?.objective ?? "indefinido") as string;
    objDist[obj] = (objDist[obj] || 0) + 1;

    const cluster = (si?.cluster ?? si?.topic_cluster ?? "") as string;
    if (cluster) clusterDist[cluster] = (clusterDist[cluster] || 0) + 1;

    const gc = c.generated_content as Record<string, unknown>;
    const rw = (gc?.rewrite_count ?? 0) as number;
    if (rw > maxRewrite) maxRewrite = rw;
    if (rw >= 2) highRewrite.push(c);
  }

  // Calendar by status
  const calByStatus: Record<string, number> = {};
  for (const ci of calendarItems) {
    const st = (ci as { status: string }).status;
    calByStatus[st] = (calByStatus[st] || 0) + 1;
  }

  // Top preset
  let topPreset: string | null = null;
  let topCount = 0;
  for (const [k, v] of Object.entries(presetDist)) {
    if (v > topCount) { topCount = v; topPreset = k; }
  }

  // Neglected clusters
  const usedClusterNames = new Set(Object.keys(clusterDist));
  const neglected = clusters.filter(c => !usedClusterNames.has(c.cluster_name) || c.usage_count === 0).map(c => c.cluster_name);

  // Strategic alerts
  const alerts: string[] = [];
  if (topPreset && topCount > contents.length * 0.6 && contents.length > 3) {
    const presetLabel = BENCHMARK_PRESETS[topPreset as BenchmarkPresetId]?.label ?? topPreset;
    alerts.push(`Preset "${presetLabel}" concentra ${Math.round(topCount / contents.length * 100)}% dos conteúdos. Diversifique.`);
  }
  if (neglected.length >= 2) {
    alerts.push(`${neglected.length} clusters temáticos ainda não foram explorados.`);
  }
  if (highRewrite.length >= 3) {
    alerts.push(`${highRewrite.length} conteúdos precisaram de muitos ajustes. Revise a direção criativa.`);
  }
  const calPending = calByStatus["planejado"] ?? 0;
  if (calPending > 5) {
    alerts.push(`${calPending} itens no calendário ainda estão como "planejado".`);
  }
  const memoryData = memoryRes.data as Record<string, unknown> | null;
  const rejectedPatterns = (memoryData?.rejected_patterns ?? []) as unknown[];
  if (rejectedPatterns.length >= 5) {
    alerts.push(`Memória estratégica acumula ${rejectedPatterns.length} padrões rejeitados. Revise preferências.`);
  }

  return {
    totalContent: contents.length,
    recentContent: contents.slice(0, 5),
    presetDistribution: presetDist,
    objectiveDistribution: objDist,
    clusterDistribution: clusterDist,
    goldenCases: contents.filter(c => c.golden_case).slice(0, 5),
    highRewriteContent: highRewrite.slice(0, 5),
    calendarTotal: calendarItems.length,
    calendarByStatus: calByStatus,
    libraryTotal: contents.length,
    seriesCount: seriesRes.count ?? 0,
    strategicAlerts: alerts,
    topPreset,
    neglectedClusters: neglected.slice(0, 6),
  };
}

/* ── Sub-components ────────────────────────────── */

function MetricCard({ label, value, icon: Icon, trend, action }: {
  label: string; value: string | number; icon: typeof Target; trend?: "up" | "down" | "neutral"; action?: { label: string; path: string };
}) {
  const navigate = useNavigate();
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <PremiumCard className="p-5 flex flex-col justify-between min-h-[120px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-label text-muted-foreground">{label}</span>
        </div>
        {trend && <TrendIcon className={`h-3.5 w-3.5 ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-muted-foreground/40"}`} />}
      </div>
      <p className="font-heading text-3xl text-foreground">{value}</p>
      {action && (
        <button onClick={() => navigate(action.path)} className="text-xs text-accent hover:underline mt-2 flex items-center gap-1">
          {action.label} <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </PremiumCard>
  );
}

function DistributionBar({ items, colorMap }: { items: Record<string, number>; colorMap?: Record<string, string> }) {
  const total = Object.values(items).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;

  const sorted = Object.entries(items).sort((a, b) => b[1] - a[1]);
  const colors = ["bg-accent", "bg-accent/70", "bg-accent/50", "bg-accent/30", "bg-muted-foreground/20"];

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        {sorted.map(([key, val], i) => (
          <div key={key} className={`${colorMap?.[key] ?? colors[i % colors.length]} transition-all`} style={{ width: `${(val / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.slice(0, 5).map(([key, val], i) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${colorMap?.[key] ?? colors[i % colors.length]}`} />
            <span>{formatLabel(key)}</span>
            <span className="text-foreground font-medium">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLabel(raw: string): string {
  const preset = BENCHMARK_PRESETS[raw as BenchmarkPresetId];
  if (preset) return preset.label;
  return raw.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()).slice(0, 30);
}

function AlertCard({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-foreground leading-relaxed">{message}</p>
    </div>
  );
}

function ContentRow({ item, navigate }: { item: ContentItem; navigate: ReturnType<typeof useNavigate> }) {
  const si = item.strategic_input as Record<string, unknown>;
  const preset = (si?.benchmark_preset ?? si?.benchmarkPreset ?? "") as string;
  const presetLabel = BENCHMARK_PRESETS[preset as BenchmarkPresetId]?.label;
  return (
    <button
      onClick={() => navigate(ROUTES.biblioteca)}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-md hover:bg-secondary/50 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.title ?? "Sem título"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          {presetLabel && <> · {presetLabel}</>}
        </p>
      </div>
      {item.golden_case && <Sparkles className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground ml-2 flex-shrink-0 transition-colors" />
    </button>
  );
}

/* ── Main ──────────────────────────────────────── */

export default function DashboardExecutivo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(user.id).then(d => { setStats(d); setLoading(false); });
  }, [user]);

  if (loading || !stats) {
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
      <div className="p-6 md:p-10 max-w-6xl space-y-10">
        <PageHeader title="Dashboard Executivo" subtitle="Visão estratégica do seu sistema editorial" />

        {/* KPIs */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <MetricCard label="Conteúdos" value={stats.totalContent} icon={Layers} action={{ label: "Biblioteca", path: ROUTES.biblioteca }} />
          <MetricCard label="Golden Cases" value={stats.goldenCases.length} icon={Sparkles} action={{ label: "Ver melhores", path: ROUTES.biblioteca }} />
          <MetricCard label="Séries" value={stats.seriesCount} icon={BookOpen} action={{ label: "Gerenciar", path: ROUTES.carrossel }} />
          <MetricCard label="Calendário" value={stats.calendarTotal} icon={Calendar} action={{ label: "Ver calendário", path: ROUTES.carrossel }} />
        </motion.div>

        {/* Alerts */}
        {stats.strategicAlerts.length > 0 && (
          <SectionBlock label="Alertas Estratégicos">
            <div className="space-y-2">
              {stats.strategicAlerts.map((a, i) => <AlertCard key={i} message={a} />)}
            </div>
          </SectionBlock>
        )}

        {/* Distributions */}
        <div className="grid md:grid-cols-2 gap-6">
          <SectionBlock label="Direção Criativa">
            <PremiumCard className="p-5">
              <p className="text-xs text-muted-foreground mb-3">Distribuição por preset</p>
              <DistributionBar items={stats.presetDistribution} />
              {stats.topPreset && (
                <p className="text-xs text-muted-foreground mt-4">
                  Preset predominante: <span className="text-foreground font-medium">{formatLabel(stats.topPreset)}</span>
                </p>
              )}
            </PremiumCard>
          </SectionBlock>

          <SectionBlock label="Objetivos">
            <PremiumCard className="p-5">
              <p className="text-xs text-muted-foreground mb-3">Distribuição por objetivo estratégico</p>
              <DistributionBar items={stats.objectiveDistribution} />
            </PremiumCard>
          </SectionBlock>
        </div>

        {/* Clusters */}
        {(Object.keys(stats.clusterDistribution).length > 0 || stats.neglectedClusters.length > 0) && (
          <SectionBlock label="Clusters Temáticos">
            <div className="grid md:grid-cols-2 gap-4">
              {Object.keys(stats.clusterDistribution).length > 0 && (
                <PremiumCard className="p-5">
                  <p className="text-xs text-muted-foreground mb-3">Temas mais usados</p>
                  <DistributionBar items={stats.clusterDistribution} />
                </PremiumCard>
              )}
              {stats.neglectedClusters.length > 0 && (
                <PremiumCard className="p-5">
                  <p className="text-xs text-muted-foreground mb-3">Temas não explorados</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.neglectedClusters.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-muted-foreground">{c}</span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => navigate(ROUTES.topicClusters)}>
                    Explorar clusters <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </PremiumCard>
              )}
            </div>
          </SectionBlock>
        )}

        {/* Calendar Status */}
        {stats.calendarTotal > 0 && (
          <SectionBlock label="Status do Calendário">
            <PremiumCard className="p-5">
              <DistributionBar items={stats.calendarByStatus} />
            </PremiumCard>
          </SectionBlock>
        )}

        {/* Content Lists */}
        <div className="grid md:grid-cols-2 gap-6">
          {stats.recentContent.length > 0 && (
            <SectionBlock label="Conteúdos Recentes">
              <PremiumCard className="p-2">
                {stats.recentContent.map(c => <ContentRow key={c.id} item={c} navigate={navigate} />)}
              </PremiumCard>
            </SectionBlock>
          )}

          {stats.goldenCases.length > 0 && (
            <SectionBlock label="Golden Cases">
              <PremiumCard className="p-2">
                {stats.goldenCases.map(c => <ContentRow key={c.id} item={c} navigate={navigate} />)}
              </PremiumCard>
            </SectionBlock>
          )}
        </div>

        {/* High rewrite */}
        {stats.highRewriteContent.length > 0 && (
          <SectionBlock label="Mais Reescritos">
            <PremiumCard className="p-2">
              <div className="grid md:grid-cols-2">
                {stats.highRewriteContent.map(c => <ContentRow key={c.id} item={c} navigate={navigate} />)}
              </div>
            </PremiumCard>
          </SectionBlock>
        )}
      </div>
    </AppLayout>
  );
}
