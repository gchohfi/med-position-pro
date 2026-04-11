import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
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
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import { getPreset, PRESET_LIST, type BenchmarkPresetId } from "@/lib/benchmark-presets";
import {
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Megaphone,
  Shuffle,
  Heart,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  List,
  LayoutGrid,
  Zap,
  Pencil,
  Check,
  Clock,
  Send,
  Archive,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

/* ── Types ─────────────────── */

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  content_type: string;
  thesis: string | null;
  strategic_objective: string | null;
  visual_direction: string | null;
  benchmark_preset: string | null;
  objetivo: string | null;
  series_id: string | null;
  status: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  educativo: { icon: BookOpen, color: "bg-blue-500/10 text-blue-600", label: "Educativo" },
  manifesto: { icon: Megaphone, color: "bg-purple-500/10 text-purple-600", label: "Manifesto" },
  hibrido: { icon: Shuffle, color: "bg-accent/10 text-accent", label: "Híbrido" },
  conexao: { icon: Heart, color: "bg-pink-500/10 text-pink-600", label: "Conexão" },
  conversao: { icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600", label: "Conversão" },
};

const STATUS_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  planejado: { icon: Clock, label: "Planejado", color: "text-muted-foreground" },
  rascunho: { icon: Pencil, label: "Rascunho", color: "text-amber-600" },
  gerado: { icon: Sparkles, label: "Gerado", color: "text-blue-600" },
  salvo: { icon: Check, label: "Salvo", color: "text-green-600" },
  publicado: { icon: Send, label: "Publicado", color: "text-accent" },
  arquivado: { icon: Archive, label: "Arquivado", color: "text-muted-foreground/50" },
};

const OBJETIVO_LABELS: Record<string, string> = {
  educar: "Educar",
  salvar: "Salvamentos",
  comentar: "Comentários",
  conversao: "Conversão",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type ViewMode = "month" | "week" | "list";

/* ── Component ─────────────── */

const Calendario = () => {
  const { user } = useAuth();
  const { profile } = useDoctor();
  const navigate = useNavigate();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filterPreset, setFilterPreset] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.getFullYear(), now.getMonth(), diff);
  });

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("calendar_items")
      .select("*")
      .eq("user_id", user!.id)
      .order("date", { ascending: true });
    setItems((data as unknown as CalendarItem[]) || []);
    setLoading(false);
  };

  const generateCalendar = async () => {
    setGenerating(true);
    try {
      const [posRes, profileRes, seriesRes, outputsRes, memoryRes] = await Promise.all([
        supabase.from("positioning").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("specialty").eq("id", user!.id).single(),
        supabase.from("series").select("name, frequency, strategic_role").eq("user_id", user!.id),
        supabase.from("content_outputs").select("title, strategic_input, generated_content").eq("user_id", user!.id).eq("content_type", "carrossel").order("created_at", { ascending: false }).limit(20),
        supabase.from("strategic_memory").select("preferred_presets, notes_summary").eq("user_id", user!.id).maybeSingle(),
      ]);

      // Extract used topics & presets from existing content
      const usedTopics: string[] = [];
      const usedPresets: string[] = [];
      for (const o of outputsRes.data || []) {
        if (o.title) usedTopics.push(o.title);
        const si = o.strategic_input as any;
        if (si?.tema) usedTopics.push(si.tema);
        const gc = o.generated_content as any;
        if (gc?.preset) usedPresets.push(gc.preset);
      }

      const memoryHints = memoryRes.data?.notes_summary || null;

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = currentSession?.access_token ?? supabaseKey;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-calendar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            positioning: posRes.data,
            specialty: profileRes.data?.specialty,
            series: seriesRes.data || [],
            usedTopics: [...new Set(usedTopics)],
            usedPresets: [...new Set(usedPresets)],
            memoryHints,
          }),
        }
      );

      if (response.status === 429) { toast.error("Limite de requisições."); return; }
      if (response.status === 402) { toast.error("Créditos esgotados."); return; }
      if (!response.ok) throw new Error("Erro");

      logStrategicEvent(STRATEGIC_EVENTS.CALENDAR_GENERATED, "calendario");
      toast.success("Calendário estratégico gerado!");
      loadItems();
    } catch {
      toast.error("Erro ao gerar calendário.");
    } finally {
      setGenerating(false);
    }
  };

  const updateItemStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("calendar_items").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status."); return; }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, status } : null);
    toast.success(`Status atualizado para "${status}".`);
  };

  const goToCarrossel = (item: CalendarItem) => {
    const preset = item.benchmark_preset ? getPreset(item.benchmark_preset as BenchmarkPresetId) : null;
    navigate("/carrossel", {
      state: {
        tese: item.thesis || "",
        objetivo: item.objetivo || "educar",
        objetivoEnum: item.objetivo || "educar",
        objetivoDetalhado: item.strategic_objective || "",
        tema: item.title,
        preset: item.benchmark_preset,
        visualStyle: preset?.preferredVisualStyle,
      },
    });
  };

  // Filtered items
  const filtered = useMemo(() => {
    let list = [...items];
    if (filterPreset !== "all") list = list.filter((it) => it.benchmark_preset === filterPreset);
    if (filterStatus !== "all") list = list.filter((it) => it.status === filterStatus);
    return list;
  }, [items, filterPreset, filterStatus]);

  // Calendar helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = currentMonth.getDay();

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    filtered.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [filtered]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  // Stats
  const stats = useMemo(() => {
    const presetCounts: Record<string, number> = {};
    const objCounts: Record<string, number> = {};
    for (const it of items) {
      if (it.benchmark_preset) presetCounts[it.benchmark_preset] = (presetCounts[it.benchmark_preset] || 0) + 1;
      if (it.objetivo) objCounts[it.objetivo] = (objCounts[it.objetivo] || 0) + 1;
    }
    return { total: items.length, presetCounts, objCounts };
  }, [items]);

  /* ── Render ─────────────── */

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-6xl space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
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
          className="flex items-start justify-between mb-6"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Calendário Editorial
            </h1>
            <p className="text-muted-foreground text-sm">
              Planejamento estratégico — cada peça existe por uma razão.
            </p>
          </div>
          <Button
            onClick={generateCalendar}
            disabled={generating}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            {items.length > 0 ? (
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {generating
              ? "Gerando…"
              : items.length > 0
              ? "Regerar calendário"
              : "Gerar calendário"}
          </Button>
        </motion.div>

        {/* Stats bar */}
        {items.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{stats.total}</span>
              <span className="text-xs text-muted-foreground">Peças</span>
            </div>
            {Object.entries(stats.presetCounts).slice(0, 4).map(([k, v]) => {
              const p = getPreset(k as BenchmarkPresetId);
              return (
                <div key={k} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs text-foreground font-medium">{v}×</span>
                  <span className="text-[10px] text-muted-foreground">{p.label}</span>
                </div>
              );
            })}
            {Object.entries(stats.objCounts).slice(0, 4).map(([k, v]) => (
              <div key={k} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="text-xs text-foreground font-medium">{v}×</span>
                <span className="text-[10px] text-muted-foreground">{OBJETIVO_LABELS[k] || k}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            {/* View mode */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              {([
                { mode: "month" as ViewMode, icon: LayoutGrid, label: "Mês" },
                { mode: "week" as ViewMode, icon: List, label: "Semana" },
                { mode: "list" as ViewMode, icon: List, label: "Lista" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`h-7 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Empty */}
        {items.length === 0 && !generating && (
          <div className="flex flex-col items-center py-20">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Nenhum calendário gerado
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Gere um calendário editorial estratégico de 30 dias baseado no seu posicionamento e memória estratégica.
            </p>
            <Button
              onClick={generateCalendar}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar calendário
            </Button>
          </div>
        )}

        {/* Generating */}
        {generating && items.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <div className="animate-pulse">
              <CalendarIcon className="h-12 w-12 text-accent/50 mb-4 mx-auto" />
            </div>
            <p className="text-muted-foreground text-sm animate-pulse">
              Analisando perfil, memória e temas anteriores…
            </p>
          </div>
        )}

        {/* ═══ MONTH VIEW ═══ */}
        {items.length > 0 && viewMode === "month" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="font-heading text-lg font-semibold text-foreground capitalize">
                {monthLabel}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-28 rounded-xl" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const day = dayIdx + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={day}
                    className={`h-28 rounded-xl border p-1.5 transition-colors ${
                      isToday
                        ? "border-accent/40 bg-accent/5"
                        : dayItems.length > 0
                        ? "border-border bg-card hover:border-accent/20"
                        : "border-transparent bg-background"
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => {
                        const meta = TYPE_META[item.content_type] || TYPE_META.hibrido;
                        const preset = item.benchmark_preset ? getPreset(item.benchmark_preset as BenchmarkPresetId) : null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${meta.color} hover:opacity-80 transition-opacity`}
                          >
                            {preset && <span className="mr-0.5">{preset.icon}</span>}
                            {item.title}
                          </button>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          +{dayItems.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ WEEK VIEW ═══ */}
        {items.length > 0 && viewMode === "week" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="font-heading text-base font-semibold text-foreground">
                {currentWeekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — {
                  (() => {
                    const end = new Date(currentWeekStart);
                    end.setDate(end.getDate() + 6);
                    return end.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
                  })()
                }
              </span>
              <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={i}
                    className={`min-h-[160px] rounded-xl border p-3 ${
                      isToday ? "border-accent/40 bg-accent/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span className={`text-xs font-medium ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                        {WEEKDAYS[d.getDay()]}
                      </span>
                      <span className={`text-xs ${isToday ? "text-accent font-semibold" : "text-muted-foreground"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayItems.map((item) => {
                        const meta = TYPE_META[item.content_type] || TYPE_META.hibrido;
                        const preset = item.benchmark_preset ? getPreset(item.benchmark_preset as BenchmarkPresetId) : null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left p-2 rounded-lg ${meta.color} hover:opacity-80 transition-opacity`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              {preset && <span className="text-[10px]">{preset.icon}</span>}
                              <span className="text-[10px] font-semibold truncate">{item.title}</span>
                            </div>
                            {item.thesis && (
                              <p className="text-[9px] opacity-80 line-clamp-2">{item.thesis}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {items.length > 0 && viewMode === "list" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {filtered.map((item, i) => {
              const meta = TYPE_META[item.content_type] || TYPE_META.hibrido;
              const preset = item.benchmark_preset ? getPreset(item.benchmark_preset as BenchmarkPresetId) : null;
              const statusMeta = STATUS_META[item.status] || STATUS_META.planejado;
              const StatusIcon = statusMeta.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-card rounded-xl border border-border p-4 hover:border-accent/20 transition-colors flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Date */}
                  <div className="text-center shrink-0 w-12">
                    <span className="text-lg font-semibold text-foreground">
                      {new Date(item.date + "T12:00:00").getDate()}
                    </span>
                    <span className="text-[10px] text-muted-foreground block capitalize">
                      {new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                    </div>
                    {item.thesis && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.thesis}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {preset && (
                      <Badge variant="secondary" className="text-[9px] h-5">
                        {preset.icon} {preset.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[9px] h-5 ${meta.color}`}>
                      {meta.label}
                    </Badge>
                    <div className={`flex items-center gap-1 text-[10px] ${statusMeta.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusMeta.label}
                    </div>
                  </div>

                  {/* Quick action */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToCarrossel(item);
                    }}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Gerar
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Legend */}
        {items.length > 0 && viewMode !== "list" && (
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${meta.color.split(" ")[0]}`} />
                {meta.label}
              </div>
            ))}
          </div>
        )}

        {/* ═══ Item Detail Dialog ═══ */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            {selectedItem && (() => {
              const meta = TYPE_META[selectedItem.content_type] || TYPE_META.hibrido;
              const Icon = meta.icon;
              const preset = selectedItem.benchmark_preset ? getPreset(selectedItem.benchmark_preset as BenchmarkPresetId) : null;
              const statusMeta = STATUS_META[selectedItem.status] || STATUS_META.planejado;

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      {preset && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-accent/10 text-accent">
                          {preset.icon} {preset.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedItem.date + "T12:00:00").toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                    <DialogTitle className="font-heading text-lg">{selectedItem.title}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 mt-3">
                    {selectedItem.thesis && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Tese central</span>
                        <p className="text-sm text-foreground mt-1">{selectedItem.thesis}</p>
                      </div>
                    )}
                    {selectedItem.strategic_objective && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Objetivo estratégico</span>
                        <p className="text-sm text-foreground mt-1">{selectedItem.strategic_objective}</p>
                      </div>
                    )}

                    {/* Info row */}
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.visual_direction && (
                        <Badge variant="outline" className="text-xs">
                          {selectedItem.visual_direction}
                        </Badge>
                      )}
                      {selectedItem.objetivo && OBJETIVO_LABELS[selectedItem.objetivo] && (
                        <Badge variant="outline" className="text-xs">
                          {OBJETIVO_LABELS[selectedItem.objetivo]}
                        </Badge>
                      )}
                    </div>

                    {/* Status control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Select
                        value={selectedItem.status}
                        onValueChange={(v) => updateItemStatus(selectedItem.id, v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_META).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedItem(null);
                          goToCarrossel(selectedItem);
                        }}
                        className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11"
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        Criar carrossel
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Calendario;
