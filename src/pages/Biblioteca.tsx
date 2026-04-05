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
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  getTitle,
  getStrategicInput,
  getBlocks,
  filterItems,
  type ContentItem,
} from "@/lib/biblioteca-helpers";
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
  Filter,
  PenTool,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const TYPE_META: Record<string, { label: string; color: string }> = {
  educativo: { label: "Educativo", color: "bg-blue-500/10 text-blue-600" },
  manifesto: { label: "Manifesto", color: "bg-purple-500/10 text-purple-600" },
  hibrido: { label: "Híbrido", color: "bg-accent/10 text-accent" },
  conexao: { label: "Conexão", color: "bg-pink-500/10 text-pink-600" },
  conversao: { label: "Conversão", color: "bg-green-500/10 text-green-600" },
};

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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_outputs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as unknown as ContentItem[]) || []);
    } catch (err: unknown) {
      console.error("Erro ao carregar biblioteca:", err);
      toast.error("Erro ao carregar sua biblioteca. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  };

  const toggleGolden = async (item: ContentItem) => {
    if (togglingId) return;
    setTogglingId(item.id);
    const newVal = !item.golden_case;
    try {
      const { error } = await supabase
        .from("content_outputs")
        .update({ golden_case: newVal })
        .eq("id", item.id);
      if (error) throw error;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, golden_case: newVal } : i))
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...item, golden_case: newVal });
      }
      if (newVal) {
        logStrategicEvent(STRATEGIC_EVENTS.GOLDEN_CASE_MARKED, "biblioteca", { content_id: item.id });
      }
      toast.success(
        newVal
          ? "Peça adicionada aos seus casos de ouro."
          : "Removida dos casos de ouro."
      );
    } catch (err: unknown) {
      console.error("Erro ao alterar caso de ouro:", err);
      toast.error("Erro ao alterar caso de ouro. Tente novamente.");
    } finally {
      setTogglingId(null);
    }
  };

  const duplicateItem = async (item: ContentItem) => {
    if (duplicatingId) return;
    setDuplicatingId(item.id);
    try {
      const { error } = await supabase.from("content_outputs").insert({
        user_id: user!.id,
        content_type: item.content_type,
        title: `${getTitle(item)} (cópia)`,
        strategic_input: item.strategic_input,
        generated_content: item.generated_content,
        golden_case: false,
      });
      if (error) throw error;
      toast.success("Peça duplicada no acervo.");
      loadItems();
      setSelectedItem(null);
    } catch (err: unknown) {
      console.error("Erro ao duplicar peça:", err);
      toast.error("Erro ao duplicar peça. Tente novamente.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const filtered = filterItems(items, filter);

  const goldenCount = items.filter((i) => i.golden_case).length;

  const copyBlock = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const copyAll = (item: ContentItem) => {
    const blocks = getBlocks(item);
    const full = blocks.map((b) => `${b.label}\n${b.text}`).join("\n\n");
    navigator.clipboard.writeText(full);
    toast.success("Conteúdo completo copiado!");
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
              Seu acervo estratégico começa quando a primeira peça é estruturada.
            </p>
            <Button
              onClick={() => navigate("/producao")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Iniciar nova peça
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content Grid */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const meta = TYPE_META[item.content_type] || TYPE_META.hibrido;
              const si = getStrategicInput(item);
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
                      {si.tese && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Tese: {si.tese}
                        </p>
                      )}
                      {si.objetivo && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Objetivo: {si.objetivo}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedItem && (() => {
              const meta = TYPE_META[selectedItem.content_type] || TYPE_META.hibrido;
              const si = getStrategicInput(selectedItem);
              const blocks = getBlocks(selectedItem);
              const hasBlocks = blocks.length > 0;

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
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(selectedItem.created_at).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <DialogTitle className="font-heading text-xl">
                      {getTitle(selectedItem)}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5 mt-4">
                    {/* Strategic Context */}
                    {(si.tese || si.objetivo || si.percepcao) && (
                      <div className="bg-accent/5 rounded-2xl border border-accent/15 p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-medium">
                          Base estratégica
                        </p>
                        <div className="space-y-2">
                          {si.objetivo && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Objetivo: </span>
                              <span className="text-foreground font-medium">{si.objetivo}</span>
                            </div>
                          )}
                          {si.tese && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Tese central: </span>
                              <span className="text-foreground font-medium">"{si.tese}"</span>
                            </div>
                          )}
                          {si.percepcao && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Percepção desejada: </span>
                              <span className="text-foreground font-medium">{si.percepcao}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Structured Content — 6 blocks */}
                    {hasBlocks && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-heading text-base font-semibold text-foreground">
                            Estrutura da peça
                          </h3>
                          <button
                            onClick={() => copyAll(selectedItem)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar tudo
                          </button>
                        </div>
                        <div className="space-y-3">
                          {blocks.map((block, i) => (
                            <div
                              key={i}
                              className="bg-background rounded-xl border border-border p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {block.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyBlock(block.text)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {block.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback — no blocks */}
                    {!hasBlocks && (
                      <div className="bg-background rounded-xl border border-border p-5 text-center">
                        <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Esta peça tem base estratégica salva, mas o conteúdo completo precisa ser reaberto para nova visualização.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl mt-3"
                          onClick={() => {
                            setSelectedItem(null);
                            navigate(`/producao?content_id=${selectedItem.id}`);
                          }}
                        >
                          <PenTool className="mr-1.5 h-3.5 w-3.5" />
                          Reabrir na produção
                        </Button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <Button
                        variant={selectedItem.golden_case ? "outline" : "default"}
                        size="sm"
                        className={`rounded-xl ${!selectedItem.golden_case ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
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
                          navigate(`/producao?content_id=${selectedItem.id}`);
                        }}
                      >
                        <PenTool className="mr-1.5 h-3.5 w-3.5" />
                        Reabrir na produção
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => duplicateItem(selectedItem)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Duplicar peça
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
