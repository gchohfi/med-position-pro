import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  content_type: string;
  thesis: string | null;
  strategic_objective: string | null;
  visual_direction: string | null;
  series_id: string | null;
  status: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  educativo: { icon: BookOpen, color: "bg-blue-500/10 text-blue-600", label: "Educativo" },
  manifesto: { icon: Megaphone, color: "bg-purple-500/10 text-purple-600", label: "Manifesto" },
  hibrido: { icon: Shuffle, color: "bg-accent/10 text-accent", label: "Híbrido" },
  conexao: { icon: Heart, color: "bg-pink-500/10 text-pink-600", label: "Conexão" },
  conversao: { icon: TrendingUp, color: "bg-green-500/10 text-green-600", label: "Conversão" },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Calendario = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
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
      const [posRes, profileRes, seriesRes] = await Promise.all([
        supabase.from("positioning").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("specialty").eq("id", user!.id).single(),
        supabase.from("series").select("name, frequency, strategic_role").eq("user_id", user!.id),
      ]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-calendar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            positioning: posRes.data,
            specialty: profileRes.data?.specialty,
            series: seriesRes.data || [],
          }),
        }
      );

      if (response.status === 429) { toast.error("Limite de requisições."); return; }
      if (response.status === 402) { toast.error("Créditos esgotados."); return; }
      if (!response.ok) throw new Error("Erro");

      toast.success("Calendário estratégico gerado com sucesso.");
      loadItems();
    } catch {
      toast.error("Erro ao gerar calendário.");
    } finally {
      setGenerating(false);
    }
  };

  // Calendar grid
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = currentMonth.getDay();

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    items.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [items]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const goToProducao = (item: CalendarItem) => {
    const params = new URLSearchParams();
    if (item.strategic_objective) params.set("objetivo", item.strategic_objective);
    navigate(`/producao?${params.toString()}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-6xl space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Calendário Editorial
            </h1>
            <p className="text-muted-foreground">
              Planejamento estratégico de 30 dias — cada peça existe por uma razão.
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
              ? "Gerando calendário…"
              : items.length > 0
              ? "Regerar calendário"
              : "Gerar calendário estratégico"}
          </Button>
        </motion.div>

        {/* Empty */}
        {items.length === 0 && !generating && (
          <div className="flex flex-col items-center py-20">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Nenhum calendário gerado
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Gere um calendário editorial estratégico de 30 dias baseado no seu posicionamento, diagnóstico e séries ativas.
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
              Planejando distribuição estratégica…
            </p>
          </div>
        )}

        {/* Calendar Grid */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Month Nav */}
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

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 rounded-xl" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const day = dayIdx + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={day}
                    className={`h-24 rounded-xl border p-1.5 transition-colors ${
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
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${meta.color} hover:opacity-80 transition-opacity`}
                          >
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

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${meta.color.split(" ")[0]}`} />
                  {meta.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            {selectedItem && (() => {
              const meta = TYPE_META[selectedItem.content_type] || TYPE_META.hibrido;
              const Icon = meta.icon;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
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
                    {selectedItem.visual_direction && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Direção visual</span>
                        <p className="text-sm text-foreground mt-1 capitalize">{selectedItem.visual_direction}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setSelectedItem(null);
                        goToProducao(selectedItem);
                      }}
                      className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11"
                    >
                      Criar conteúdo desta peça
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
