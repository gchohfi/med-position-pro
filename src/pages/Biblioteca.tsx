import React, { useState, useEffect } from "react";
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
  Archive,
  Star,
  ArrowRight,
  BookOpen,
  Megaphone,
  Shuffle,
  Heart,
  TrendingUp,
  Copy,
  Link2,
  Filter,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const TYPE_META: Record<string, { label: string; color: string }> = {
  educativo: { label: "Educativo", color: "bg-blue-500/10 text-blue-600" },
  manifesto: { label: "Manifesto", color: "bg-purple-500/10 text-purple-600" },
  hibrido: { label: "Híbrido", color: "bg-accent/10 text-accent" },
  conexao: { label: "Conexão", color: "bg-pink-500/10 text-pink-600" },
  conversao: { label: "Conversão", color: "bg-green-500/10 text-green-600" },
};

interface ContentItem {
  id: string;
  title: string | null;
  content_type: string;
  strategic_input: any;
  generated_content: any;
  golden_case: boolean;
  golden_reason: string | null;
  series_id: string | null;
  created_at: string;
}

const FILTERS = [
  { key: "todos", label: "Todos os ativos" },
  { key: "golden", label: "Casos de ouro" },
  { key: "educativo", label: "Educativos" },
  { key: "manifesto", label: "Manifestos" },
  { key: "hibrido", label: "Híbridos" },
  { key: "conexao", label: "Conexão" },
  { key: "conversao", label: "Conversão" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

const Biblioteca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("content_outputs")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setItems((data as unknown as ContentItem[]) || []);
    setLoading(false);
  };

  const toggleGolden = async (item: ContentItem) => {
    const newVal = !item.golden_case;
    await supabase
      .from("content_outputs")
      .update({ golden_case: newVal })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, golden_case: newVal } : i))
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...item, golden_case: newVal });
    }
    toast.success(newVal ? "Marcado como caso de ouro" : "Removido dos casos de ouro");
  };

  const filtered = items.filter((item) => {
    if (filter === "todos") return true;
    if (filter === "golden") return item.golden_case;
    return item.content_type === filter;
  });

  const goldenCount = items.filter((i) => i.golden_case).length;

  const getTitle = (item: ContentItem) => {
    if (item.title) return item.title;
    const input = item.strategic_input as any;
    return input?.tese || input?.objetivo || "Peça sem título";
  };

  const getThesis = (item: ContentItem) => {
    const input = item.strategic_input as any;
    return input?.tese || null;
  };

  const getObjective = (item: ContentItem) => {
    const input = item.strategic_input as any;
    return input?.objetivo || null;
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Biblioteca Estratégica
          </h1>
          <p className="text-muted-foreground">
            Seu acervo de ativos estratégicos — cada peça construída com intenção.
          </p>
        </motion.div>

        {/* Stats */}
        {!loading && items.length > 0 && (
          <div className="flex gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border px-4 py-3">
              <span className="text-2xl font-semibold text-foreground">{items.length}</span>
              <span className="text-xs text-muted-foreground ml-2">Peças criadas</span>
            </div>
            <div className="bg-accent/5 rounded-xl border border-accent/15 px-4 py-3">
              <Star className="h-4 w-4 text-accent inline mr-1" />
              <span className="text-2xl font-semibold text-foreground">{goldenCount}</span>
              <span className="text-xs text-muted-foreground ml-2">Casos de ouro</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <Skeleton className="h-4 w-48 mb-3" />
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
              Acervo estratégico vazio
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Seu acervo estratégico começa quando a primeira peça é criada no Laboratório de Conteúdo.
            </p>
            <Button
              onClick={() => navigate("/producao")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Criar primeira peça
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content Grid */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const meta = TYPE_META[item.content_type] || TYPE_META.hibrido;
              return (
                <motion.button
                  key={item.id}
                  className="w-full text-left bg-card rounded-2xl border border-border p-5 shadow-sm hover:border-accent/20 transition-colors"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                        {item.golden_case && (
                          <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {getTitle(item)}
                      </h3>
                      {getThesis(item) && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Tese: {getThesis(item)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(item.created_at).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* No results for filter */}
        {!loading && items.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum ativo encontrado nesta categoria.</p>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedItem && (() => {
              const meta = TYPE_META[selectedItem.content_type] || TYPE_META.hibrido;
              const content = selectedItem.generated_content as any;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                      {selectedItem.golden_case && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-accent/10 text-accent flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent" />
                          Caso de ouro
                        </span>
                      )}
                    </div>
                    <DialogTitle className="font-heading text-lg">
                      {getTitle(selectedItem)}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 mt-3">
                    {getThesis(selectedItem) && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Tese central</span>
                        <p className="text-sm text-foreground mt-1">{getThesis(selectedItem)}</p>
                      </div>
                    )}
                    {getObjective(selectedItem) && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Objetivo estratégico</span>
                        <p className="text-sm text-foreground mt-1">{getObjective(selectedItem)}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant={selectedItem.golden_case ? "outline" : "default"}
                        size="sm"
                        className="rounded-xl"
                        onClick={() => toggleGolden(selectedItem)}
                      >
                        <Star className={`mr-1.5 h-3.5 w-3.5 ${selectedItem.golden_case ? "fill-accent text-accent" : ""}`} />
                        {selectedItem.golden_case ? "Remover caso de ouro" : "Marcar como caso de ouro"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setSelectedItem(null);
                          const input = selectedItem.strategic_input as any;
                          const params = new URLSearchParams();
                          if (input?.objetivo) params.set("objetivo", input.objetivo);
                          navigate(`/producao?${params.toString()}`);
                        }}
                      >
                        <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                        Reabrir na produção
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

export default Biblioteca;
