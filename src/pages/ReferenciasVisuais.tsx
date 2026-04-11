import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Heart, Search, Filter, Trash2, ExternalLink,
  Palette, Type, LayoutGrid, Zap, BookOpen, Image,
  FolderPlus, Folder, X, Edit2, ArrowRight,
  Crown, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BENCHMARK_PRESETS, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Types ─────────────────────────────────────────────────────── */

const REF_TYPES = [
  { value: "capa", label: "Capa", icon: LayoutGrid },
  { value: "estatistica", label: "Estatística", icon: Zap },
  { value: "manifesto", label: "Manifesto", icon: Crown },
  { value: "educativo_clean", label: "Educativo Clean", icon: BookOpen },
  { value: "final_cta", label: "Final / CTA", icon: ArrowRight },
  { value: "paleta", label: "Paleta", icon: Palette },
  { value: "tipografia", label: "Tipografia", icon: Type },
  { value: "ritmo_editorial", label: "Ritmo Editorial", icon: Sparkles },
] as const;

type RefType = (typeof REF_TYPES)[number]["value"];

const VISUAL_STYLES = [
  { value: "editorial_black_gold", label: "Editorial Black & Gold" },
  { value: "ivory_sage", label: "Ivory & Sage" },
  { value: "travessia", label: "Travessia" },
];

interface VisualReference {
  id: string;
  title: string;
  ref_type: RefType;
  description: string | null;
  tags: string[];
  benchmark_preset: string | null;
  visual_style: string | null;
  suggested_use: string | null;
  image_url: string | null;
  link: string | null;
  favorite: boolean;
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

/* ── Component ─────────────────────────────────────────────────── */

const ReferenciasVisuais = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refs, setRefs] = useState<VisualReference[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RefType | "all">("all");
  const [search, setSearch] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<VisualReference | null>(null);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", ref_type: "capa" as RefType, description: "",
    tags: "", benchmark_preset: "", visual_style: "",
    suggested_use: "", image_url: "", link: "",
  });

  const [newCollectionName, setNewCollectionName] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [refsRes, collRes] = await Promise.all([
      supabase.from("visual_references").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("visual_reference_collections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (refsRes.data) setRefs(refsRes.data as unknown as VisualReference[]);
    if (collRes.data) setCollections(collRes.data as unknown as Collection[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ title: "", ref_type: "capa", description: "", tags: "", benchmark_preset: "", visual_style: "", suggested_use: "", image_url: "", link: "" });
    setEditingRef(null);
  };

  const openEdit = (ref: VisualReference) => {
    setEditingRef(ref);
    setForm({
      title: ref.title,
      ref_type: ref.ref_type,
      description: ref.description || "",
      tags: ref.tags.join(", "),
      benchmark_preset: ref.benchmark_preset || "",
      visual_style: ref.visual_style || "",
      suggested_use: ref.suggested_use || "",
      image_url: ref.image_url || "",
      link: ref.link || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) { toast.error("Título é obrigatório."); return; }
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      ref_type: form.ref_type,
      description: form.description.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      benchmark_preset: form.benchmark_preset || null,
      visual_style: form.visual_style || null,
      suggested_use: form.suggested_use.trim() || null,
      image_url: form.image_url.trim() || null,
      link: form.link.trim() || null,
    };

    if (editingRef) {
      const { error } = await supabase.from("visual_references").update(payload).eq("id", editingRef.id);
      if (error) { toast.error("Erro ao atualizar."); return; }
      toast.success("Referência atualizada.");
    } else {
      const { error } = await supabase.from("visual_references").insert(payload);
      if (error) { toast.error("Erro ao salvar."); return; }
      toast.success("Referência adicionada!");
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const toggleFavorite = async (ref: VisualReference) => {
    await supabase.from("visual_references").update({ favorite: !ref.favorite }).eq("id", ref.id);
    setRefs((prev) => prev.map((r) => r.id === ref.id ? { ...r, favorite: !r.favorite } : r));
  };

  const deleteRef = async (id: string) => {
    await supabase.from("visual_references").delete().eq("id", id);
    setRefs((prev) => prev.filter((r) => r.id !== id));
    toast.success("Referência removida.");
  };

  const createCollection = async () => {
    if (!user || !newCollectionName.trim()) return;
    const { error } = await supabase.from("visual_reference_collections").insert({
      user_id: user.id, name: newCollectionName.trim(),
    });
    if (error) { toast.error("Erro ao criar coleção."); return; }
    setNewCollectionName("");
    toast.success("Coleção criada!");
    fetchData();
  };

  const deleteCollection = async (id: string) => {
    await supabase.from("visual_reference_collections").delete().eq("id", id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coleção removida.");
  };

  const useInCarousel = (ref: VisualReference) => {
    const state: Record<string, string> = {};
    if (ref.benchmark_preset) state.benchmarkPreset = ref.benchmark_preset;
    if (ref.visual_style) state.visualStyle = ref.visual_style;
    navigate("/carrossel", { state });
    toast.success(`Referência "${ref.title}" aplicada.`);
  };

  /* ── Filtering ───────────────────────────────────────────────── */
  const filtered = refs.filter((r) => {
    if (filter !== "all" && r.ref_type !== filter) return false;
    if (showFavOnly && !r.favorite) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const typeInfo = (type: string) => REF_TYPES.find((t) => t.value === type);

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Referências Visuais
            </h1>
            <p className="text-muted-foreground text-sm">
              Guarde, organize e reutilize referências de estética para seus carrosséis.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderPlus className="h-4 w-4" /> Coleção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Coleções</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Nome da coleção" className="flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }} />
                    <Button size="sm" onClick={createCollection} disabled={!newCollectionName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {collections.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma coleção ainda.</p>
                  )}
                  {collections.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteCollection(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRef ? "Editar referência" : "Nova referência visual"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Ex: Capa minimalista com headline bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={form.ref_type} onValueChange={(v) => setForm((f) => ({ ...f, ref_type: v as RefType }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REF_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Visual style</Label>
                      <Select value={form.visual_style} onValueChange={(v) => setForm((f) => ({ ...f, visual_style: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {VISUAL_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Benchmark preset</Label>
                    <Select value={form.benchmark_preset} onValueChange={(v) => setForm((f) => ({ ...f, benchmark_preset: v }))}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(BENCHMARK_PRESETS).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.icon} {p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="O que torna esta referência interessante?" rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tags (separadas por vírgula)</Label>
                    <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      placeholder="bold, dark, headline curta" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Uso sugerido</Label>
                    <Input value={form.suggested_use} onChange={(e) => setForm((f) => ({ ...f, suggested_use: e.target.value }))}
                      placeholder="Ex: Capas de carrossel sobre skincare" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">URL da imagem</Label>
                      <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                        placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Link externo</Label>
                      <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                        placeholder="https://instagram.com/p/..." />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {editingRef ? "Salvar alterações" : "Adicionar referência"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar referências..." className="pl-9 h-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilter("all")}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                filter === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-accent/30"
              }`}>
              Todas
            </button>
            {REF_TYPES.map((t) => (
              <button key={t.value} onClick={() => setFilter(t.value)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                  filter === t.value ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-accent/30"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFavOnly(!showFavOnly)}
            className={`flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
              showFavOnly ? "bg-red-50 text-red-600 border-red-200" : "border-border text-muted-foreground hover:border-accent/30"
            }`}>
            <Heart className={`h-3 w-3 ${showFavOnly ? "fill-red-500" : ""}`} /> Favoritos
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((ref, i) => {
                const ti = typeInfo(ref.ref_type);
                const TypeIcon = ti?.icon || Image;
                const preset = ref.benchmark_preset ? BENCHMARK_PRESETS[ref.benchmark_preset as BenchmarkPresetId] : null;

                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-2xl border border-border hover:border-accent/20 transition-all group"
                  >
                    {/* Image */}
                    {ref.image_url && (
                      <div className="aspect-[16/10] rounded-t-2xl overflow-hidden bg-muted">
                        <img src={ref.image_url} alt={ref.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <TypeIcon className="h-4 w-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{ref.title}</h3>
                            <p className="text-[10px] text-muted-foreground">{ti?.label || ref.ref_type}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(ref)} className="shrink-0 p-1">
                          <Heart className={`h-4 w-4 transition-colors ${ref.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground/40 hover:text-red-400"}`} />
                        </button>
                      </div>

                      {/* Description */}
                      {ref.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{ref.description}</p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {ref.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                        {ref.visual_style && (
                          <Badge variant="outline" className="text-[10px]">
                            {VISUAL_STYLES.find((s) => s.value === ref.visual_style)?.label || ref.visual_style}
                          </Badge>
                        )}
                        {preset && (
                          <Badge variant="outline" className="text-[10px]">{preset.icon} {preset.label}</Badge>
                        )}
                      </div>

                      {/* Suggested use */}
                      {ref.suggested_use && (
                        <div className="bg-accent/5 rounded-lg p-2.5">
                          <p className="text-[10px] font-medium text-accent mb-0.5">Uso sugerido</p>
                          <p className="text-[11px] text-muted-foreground">{ref.suggested_use}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => useInCarousel(ref)}>
                          <ArrowRight className="h-3 w-3 mr-1" /> Usar no carrossel
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(ref)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {ref.link && (
                          <a href={ref.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRef(ref.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {refs.length === 0 ? "Nenhuma referência ainda" : "Nenhum resultado"}
            </p>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {refs.length === 0
                ? "Adicione referências visuais para alimentar a geração de carrosséis com direção de arte."
                : "Tente mudar os filtros ou o termo de busca."}
            </p>
            {refs.length === 0 && (
              <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4" /> Adicionar primeira referência
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ReferenciasVisuais;
