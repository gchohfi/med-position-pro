import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Archive,
  Eye,
  Copy,
  Trash2,
  ArrowRight,
  Star,
  Search,
  Filter,
  Bookmark,
  TrendingUp,
  Sparkles,
  X,
  RefreshCw,
} from "lucide-react";
import ContentTransformDialog from "@/components/ContentTransformDialog";
import AppLayout from "@/components/AppLayout";
import {
  PerformanceBadge,
  MetricsMiniRow,
  ManualMetricsDialog,
  InstagramConnectionStatus,
} from "@/components/PerformanceMetrics";
import {
  normalizePerformanceRow,
  toPerformanceInsert,
  type ContentPerformanceRecord,
  type ContentPerformanceMetrics,
} from "@/lib/instagram-performance";
import {
  TravessIARoteiro,
  travessiaToSlideData,
  type PreferredVisualStyle,
} from "@/types/carousel";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import { VISUAL_SYSTEMS, type ArchetypeStyle } from "@/components/carousel/SlideRenderer";
import { PRESET_LIST, getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Types ──────────────────────── */

interface EnrichedItem {
  id: string;
  title: string | null;
  created_at: string;
  strategic_input: any;
  generated_content: any;
  golden_case: boolean;
  golden_reason: string | null;
  carousel_slide_urls: any;
  // Derived
  preset: string | null;
  visualStyle: string | null;
  objetivo: string | null;
  tema: string | null;
  tese: string | null;
  exported: boolean;
  slideCount: number;
  ctaFinal: string | null;
  tom: string | null;
}

interface FeedbackMap {
  [contentOutputId: string]: {
    satisfaction: number | null;
    outcome_tags: string[];
    reuse_direction: boolean;
    posted: boolean;
  };
}

function enrichItem(raw: any): EnrichedItem {
  const si = raw.strategic_input || {};
  const gc = raw.generated_content || {};
  const roteiro = gc.roteiro as TravessIARoteiro | undefined;
  return {
    id: raw.id,
    title: raw.title,
    created_at: raw.created_at,
    strategic_input: si,
    generated_content: gc,
    golden_case: raw.golden_case ?? false,
    golden_reason: raw.golden_reason,
    carousel_slide_urls: raw.carousel_slide_urls,
    preset: si.preset || gc.preset || null,
    visualStyle: gc.visualStyle || roteiro?.preferredVisualStyle || null,
    objetivo: si.objetivo || null,
    tema: si.tema || null,
    tese: si.tese || null,
    exported: Array.isArray(raw.carousel_slide_urls) && raw.carousel_slide_urls.length > 0,
    slideCount: roteiro?.slides?.length || gc.slideDataList?.length || 0,
    ctaFinal: roteiro?.cta_final || null,
    tom: si.tom_de_voz || null,
  };
}

const objetivoLabels: Record<string, string> = {
  educar: "Educar",
  salvar: "Salvamentos",
  comentar: "Comentários",
  conversao: "Conversão",
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

/* ── Component ──────────────────── */

const Biblioteca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rawItems, setRawItems] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackMap>({});
  const [perfMap, setPerfMap] = useState<Record<string, ContentPerformanceRecord>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPreset, setFilterPreset] = useState("all");
  const [filterVisual, setFilterVisual] = useState("all");
  const [filterObjetivo, setFilterObjetivo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all | golden | exported | reuse
  const [sortBy, setSortBy] = useState<"recent" | "best">("recent");

  // Preview
  const [selectedItem, setSelectedItem] = useState<EnrichedItem | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [outputsRes, feedbackRes, perfRes] = await Promise.all([
        supabase
          .from("content_outputs")
          .select("*")
          .eq("user_id", user!.id)
          .eq("content_type", "carrossel")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_feedback")
          .select("content_output_id, satisfaction, outcome_tags, reuse_direction, posted")
          .eq("user_id", user!.id),
        supabase
          .from("content_performance")
          .select("*")
          .eq("user_id", user!.id),
      ]);
      if (outputsRes.error) throw outputsRes.error;
      setRawItems(outputsRes.data || []);

      const fbMap: FeedbackMap = {};
      for (const fb of feedbackRes.data || []) {
        if (fb.content_output_id) {
          fbMap[fb.content_output_id] = {
            satisfaction: fb.satisfaction,
            outcome_tags: Array.isArray(fb.outcome_tags) ? fb.outcome_tags as string[] : [],
            reuse_direction: fb.reuse_direction ?? false,
            posted: fb.posted ?? false,
          };
        }
      }
      setFeedbacks(fbMap);

      const pm: Record<string, ContentPerformanceRecord> = {};
      for (const row of perfRes.data || []) {
        const rec = normalizePerformanceRow(row);
        if (rec.contentOutputId) pm[rec.contentOutputId] = rec;
      }
      setPerfMap(pm);
    } catch {
      toast.error("Erro ao carregar biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(() => rawItems.map(enrichItem), [rawItems]);

  const filtered = useMemo(() => {
    let list = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) =>
          (it.title || "").toLowerCase().includes(q) ||
          (it.tese || "").toLowerCase().includes(q) ||
          (it.tema || "").toLowerCase().includes(q) ||
          (it.ctaFinal || "").toLowerCase().includes(q) ||
          (it.tom || "").toLowerCase().includes(q)
      );
    }

    // Preset
    if (filterPreset !== "all") {
      list = list.filter((it) => it.preset === filterPreset);
    }

    // Visual
    if (filterVisual !== "all") {
      list = list.filter((it) => it.visualStyle === filterVisual);
    }

    // Objetivo
    if (filterObjetivo !== "all") {
      list = list.filter((it) => it.objetivo === filterObjetivo);
    }

    // Status
    if (filterStatus === "golden") list = list.filter((it) => it.golden_case);
    if (filterStatus === "exported") list = list.filter((it) => it.exported);
    if (filterStatus === "reuse") list = list.filter((it) => feedbacks[it.id]?.reuse_direction);
    if (filterStatus === "posted") list = list.filter((it) => feedbacks[it.id]?.posted);

    // Sort
    if (sortBy === "best") {
      list.sort((a, b) => (feedbacks[b.id]?.satisfaction ?? 0) - (feedbacks[a.id]?.satisfaction ?? 0));
    }

    return list;
  }, [items, search, filterPreset, filterVisual, filterObjetivo, filterStatus, sortBy, feedbacks]);

  // Stats
  const stats = useMemo(() => {
    const presetCounts: Record<string, number> = {};
    let exported = 0;
    let golden = 0;
    for (const it of items) {
      if (it.preset) presetCounts[it.preset] = (presetCounts[it.preset] || 0) + 1;
      if (it.exported) exported++;
      if (it.golden_case) golden++;
    }
    const topPreset = Object.entries(presetCounts).sort((a, b) => b[1] - a[1])[0];
    return { total: items.length, exported, golden, topPreset };
  }, [items]);

  const handleView = (item: EnrichedItem) => {
    setSelectedItem(item);
    const content = item.generated_content;
    if (content?.roteiro) {
      const roteiro = content.roteiro as TravessIARoteiro;
      const slides = roteiro.slides.map((s: any) => travessiaToSlideData(s, roteiro.slides.length));
      setSlideDataList(slides);
      setVisualStyle(content.visualStyle || "editorial_black_gold");
    } else if (content?.slideDataList) {
      setSlideDataList(content.slideDataList);
      setVisualStyle(content.visualStyle || "editorial_black_gold");
    }
  };

  const handleDuplicate = async (item: EnrichedItem) => {
    try {
      const { error } = await supabase.from("content_outputs").insert({
        user_id: user!.id,
        content_type: "carrossel",
        title: `${item.title || "Carrossel"} (cópia)`,
        strategic_input: item.strategic_input,
        generated_content: item.generated_content,
      } as any);
      if (error) throw error;
      toast.success("Carrossel duplicado!");
      loadAll();
    } catch {
      toast.error("Erro ao duplicar.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("content_outputs").delete().eq("id", id);
      if (error) throw error;
      setRawItems((prev) => prev.filter((c) => c.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
        setSlideDataList([]);
      }
      toast.success("Carrossel removido.");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const handleToggleGolden = async (item: EnrichedItem) => {
    const newVal = !item.golden_case;
    try {
      const { error } = await supabase
        .from("content_outputs")
        .update({ golden_case: newVal, golden_reason: newVal ? "Marcado como referência" : null })
        .eq("id", item.id);
      if (error) throw error;
      setRawItems((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, golden_case: newVal, golden_reason: newVal ? "Marcado como referência" : null } : r))
      );
      toast.success(newVal ? "Marcado como referência!" : "Referência removida.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleToggleReuse = async (item: EnrichedItem) => {
    const existing = feedbacks[item.id];
    const newVal = !(existing?.reuse_direction ?? false);
    try {
      if (existing) {
        await supabase
          .from("content_feedback")
          .update({ reuse_direction: newVal } as any)
          .eq("content_output_id", item.id);
      } else {
        await supabase.from("content_feedback").insert({
          user_id: user!.id,
          content_output_id: item.id,
          reuse_direction: newVal,
          outcome_tags: [],
        } as any);
      }
      setFeedbacks((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], reuse_direction: newVal, satisfaction: prev[item.id]?.satisfaction ?? null, outcome_tags: prev[item.id]?.outcome_tags ?? [], posted: prev[item.id]?.posted ?? false },
      }));
      toast.success(newVal ? "Salvo como direção futura!" : "Direção removida.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleSaveMetrics = async (
    contentOutputId: string,
    metrics: Partial<ContentPerformanceMetrics>,
    postUrl?: string
  ) => {
    try {
      const insert = toPerformanceInsert(user!.id, contentOutputId, metrics, {
        source: "manual",
        externalPostUrl: postUrl,
      });
      const { data, error } = await supabase
        .from("content_performance")
        .upsert(insert as any, { onConflict: "user_id,content_output_id" })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setPerfMap((prev) => ({
          ...prev,
          [contentOutputId]: normalizePerformanceRow(data),
        }));
      }
      toast.success("Métricas salvas!");
    } catch {
      toast.error("Erro ao salvar métricas.");
    }
  };

  const hasActiveFilters = filterPreset !== "all" || filterVisual !== "all" || filterObjetivo !== "all" || filterStatus !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setFilterPreset("all");
    setFilterVisual("all");
    setFilterObjetivo("all");
    setFilterStatus("all");
    setSortBy("recent");
  };

  /* ── Render ──────────────────── */

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Biblioteca Estratégica
          </h1>
          <p className="text-muted-foreground text-sm">
            Seus ativos criativos — direções, presets e aprendizados consolidados.
          </p>
        </div>

        {/* Instagram connection status */}
        {!loading && items.length > 0 && (
          <div className="mb-4">
            <InstagramConnectionStatus connected={false} />
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex gap-3 mb-6 flex-wrap">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Exportados" value={stats.exported} icon={<TrendingUp className="h-3 w-3" />} />
            <StatPill label="Referência" value={stats.golden} icon={<Star className="h-3 w-3 text-amber-500" />} />
            {stats.topPreset && (
              <div className="bg-accent/5 border border-accent/15 rounded-lg px-3 py-2 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-xs text-foreground">
                  Preset favorito: <strong>{getPreset(stats.topPreset[0] as BenchmarkPresetId).label}</strong>
                  <span className="text-muted-foreground ml-1">({stats.topPreset[1]}×)</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search + Filters */}
        {!loading && items.length > 0 && !selectedItem && (
          <div className="space-y-3 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por tema, tese, CTA, tom…"
                className="pl-10 h-9 text-sm"
              />
            </div>

            {/* Filter row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />

              <Select value={filterPreset} onValueChange={setFilterPreset}>
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos presets</SelectItem>
                  {PRESET_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.icon} {p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterVisual} onValueChange={setFilterVisual}>
                <SelectTrigger className="h-8 text-xs w-[150px]">
                  <SelectValue placeholder="Visual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos visuais</SelectItem>
                  {Object.entries(VISUAL_SYSTEMS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterObjetivo} onValueChange={setFilterObjetivo}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos objetivos</SelectItem>
                  {Object.entries(objetivoLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="golden">⭐ Referência</SelectItem>
                  <SelectItem value="exported">📤 Exportados</SelectItem>
                  <SelectItem value="reuse">🔁 Direção futura</SelectItem>
                  <SelectItem value="posted">✅ Publicados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recentes</SelectItem>
                  <SelectItem value="best">Melhor avaliados</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                {filtered.length} de {items.length} carrosséis
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <Skeleton className="h-4 w-36 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <Archive className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Sua biblioteca está vazia
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Crie seu primeiro carrossel e salve para construir sua memória estratégica.
            </p>
            <Button
              onClick={() => navigate("/carrossel")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Criar carrossel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* No results */}
        {!loading && items.length > 0 && filtered.length === 0 && !selectedItem && (
          <div className="flex flex-col items-center py-16">
            <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum carrossel encontrado com esses filtros.
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && !selectedItem && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => {
              const fb = feedbacks[item.id];
              const presetInfo = item.preset ? getPreset(item.preset as BenchmarkPresetId) : null;
              const vsLabel = item.visualStyle && item.visualStyle in VISUAL_SYSTEMS
                ? VISUAL_SYSTEMS[item.visualStyle as ArchetypeStyle].label
                : null;

              return (
                <motion.div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border p-5 hover:border-accent/20 transition-colors group"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
                      {item.title || "Carrossel sem título"}
                    </h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.created_at).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Tese */}
                  {item.tese && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.tese}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {presetInfo && (
                      <Badge variant="secondary" className="text-[9px] h-5">
                        {presetInfo.icon} {presetInfo.label}
                      </Badge>
                    )}
                    {vsLabel && (
                      <Badge variant="outline" className="text-[9px] h-5">
                        {vsLabel}
                      </Badge>
                    )}
                    {item.objetivo && objetivoLabels[item.objetivo] && (
                      <Badge variant="outline" className="text-[9px] h-5">
                        {objetivoLabels[item.objetivo]}
                      </Badge>
                    )}
                    {item.slideCount > 0 && (
                      <Badge variant="outline" className="text-[9px] h-5">
                        {item.slideCount} slides
                      </Badge>
                    )}
                    {item.exported && (
                      <Badge variant="outline" className="text-[9px] h-5 text-green-600 border-green-200">
                        Exportado
                      </Badge>
                    )}
                    {item.golden_case && (
                      <Badge className="text-[9px] h-5 bg-amber-100 text-amber-700 border-amber-200">
                        ⭐ Referência
                      </Badge>
                    )}
                    {fb?.posted && (
                      <Badge variant="outline" className="text-[9px] h-5 text-blue-600 border-blue-200">
                        Publicado
                      </Badge>
                    )}
                    {fb?.satisfaction && fb.satisfaction >= 4 && (
                      <Badge variant="outline" className="text-[9px] h-5 text-emerald-600 border-emerald-200">
                        Nota {fb.satisfaction}/5
                      </Badge>
                    )}
                    {fb?.reuse_direction && (
                      <Badge variant="outline" className="text-[9px] h-5 text-accent border-accent/30">
                        Direção futura
                      </Badge>
                    )}
                  </div>

                  {/* Performance metrics */}
                  {perfMap[item.id] && (
                    <div className="mb-2">
                      <MetricsMiniRow metrics={perfMap[item.id].metrics} />
                    </div>
                  )}

                  {/* CTA preview */}
                  {item.ctaFinal && (
                    <p className="text-[10px] text-muted-foreground italic line-clamp-1 mb-3">
                      CTA: "{item.ctaFinal}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleView(item)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 text-xs ${item.golden_case ? "text-amber-600" : ""}`}
                      onClick={() => handleToggleGolden(item)}
                      title={item.golden_case ? "Remover referência" : "Marcar como referência"}
                    >
                      <Star className={`h-3 w-3 ${item.golden_case ? "fill-amber-500" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 text-xs ${feedbacks[item.id]?.reuse_direction ? "text-accent" : ""}`}
                      onClick={() => handleToggleReuse(item)}
                      title={feedbacks[item.id]?.reuse_direction ? "Remover direção futura" : "Usar como direção futura"}
                    >
                      <Bookmark className={`h-3 w-3 ${feedbacks[item.id]?.reuse_direction ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDuplicate(item)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <ManualMetricsDialog
                      contentOutputId={item.id}
                      existingMetrics={perfMap[item.id]?.metrics}
                      onSave={(m, url) => handleSaveMetrics(item.id, m, url)}
                    >
                      <Button size="sm" variant="ghost" className="h-7 text-xs" title="Métricas">
                        <TrendingUp className="h-3 w-3" />
                      </Button>
                    </ManualMetricsDialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Preview */}
        {selectedItem && slideDataList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {selectedItem.title || "Carrossel"}
                </h2>
                <div className="flex gap-2 mt-1">
                  {selectedItem.preset && (
                    <Badge variant="secondary" className="text-[10px]">
                      {getPreset(selectedItem.preset as BenchmarkPresetId).icon}{" "}
                      {getPreset(selectedItem.preset as BenchmarkPresetId).label}
                    </Badge>
                  )}
                  {selectedItem.objetivo && objetivoLabels[selectedItem.objetivo] && (
                    <Badge variant="outline" className="text-[10px]">
                      {objetivoLabels[selectedItem.objetivo]}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedItem(null);
                  setSlideDataList([]);
                }}
              >
                ← Voltar
              </Button>
            </div>
            <CarouselVisualPreview
              slides={slideDataList}
              visualStyle={visualStyle}
              contentOutputId={selectedItem.id}
              onSlidesChange={setSlideDataList}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/* ── Stat pill ──────────────────── */

function StatPill({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border px-3 py-2 flex items-center gap-2">
      {icon}
      <span className="text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default Biblioteca;
