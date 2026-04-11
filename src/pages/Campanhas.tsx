import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FolderOpen,
  Plus,
  Layers,
  Target,
  Calendar,
  Edit2,
  Trash2,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Clock,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { PRESET_LIST, getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Types ── */

interface Campaign {
  id: string;
  name: string;
  theme: string | null;
  strategic_objective: string | null;
  benchmark_preset: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  persona_ids: string[];
  cluster_ids: string[];
  notes: string | null;
  created_at: string;
}

interface CampaignStats {
  contentCount: number;
  calendarCount: number;
  presets: Record<string, number>;
  objectives: Record<string, number>;
}

type CampaignStatus = "planejada" | "ativa" | "concluida" | "pausada";

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: React.ReactNode }> = {
  planejada: { label: "Planejada", color: "bg-secondary text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  ativa: { label: "Ativa", color: "bg-accent/10 text-accent", icon: <CheckCircle2 className="h-3 w-3" /> },
  concluida: { label: "Concluída", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  pausada: { label: "Pausada", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <Pause className="h-3 w-3" /> },
};

const objetivoLabels: Record<string, string> = {
  educar: "Educar",
  salvar: "Salvamentos",
  comentar: "Comentários",
  conversao: "Conversão",
};

/* ── Component ── */

const Campanhas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, CampaignStats>>({});
  const [personas, setPersonas] = useState<{ id: string; nome_interno: string }[]>([]);
  const [clusters, setClusters] = useState<{ id: string; cluster_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: "",
    theme: "",
    strategic_objective: "",
    benchmark_preset: "",
    status: "planejada" as CampaignStatus,
    start_date: "",
    end_date: "",
    persona_ids: [] as string[],
    cluster_ids: [] as string[],
    notes: "",
  });

  // Detail view
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignContent, setCampaignContent] = useState<any[]>([]);
  const [campaignCalendar, setCampaignCalendar] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [campRes, personaRes, clusterRes, contentRes, calRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("patient_personas").select("id, nome_interno").eq("user_id", user.id),
        supabase.from("topic_clusters").select("id, cluster_name").eq("user_id", user.id),
        supabase.from("content_outputs").select("id, campaign_id, strategic_input").eq("user_id", user.id).not("campaign_id", "is", null),
        supabase.from("calendar_items").select("id, campaign_id").eq("user_id", user.id).not("campaign_id", "is", null),
      ]);

      const camps = (campRes.data || []).map((c: any) => ({
        ...c,
        persona_ids: Array.isArray(c.persona_ids) ? c.persona_ids : [],
        cluster_ids: Array.isArray(c.cluster_ids) ? c.cluster_ids : [],
      })) as Campaign[];
      setCampaigns(camps);
      setPersonas((personaRes.data || []) as any);
      setClusters((clusterRes.data || []) as any);

      // Build stats
      const sm: Record<string, CampaignStats> = {};
      for (const camp of camps) {
        sm[camp.id] = { contentCount: 0, calendarCount: 0, presets: {}, objectives: {} };
      }
      for (const co of contentRes.data || []) {
        const cid = (co as any).campaign_id;
        if (cid && sm[cid]) {
          sm[cid].contentCount++;
          const si = (co as any).strategic_input || {};
          if (si.preset) sm[cid].presets[si.preset] = (sm[cid].presets[si.preset] || 0) + 1;
          if (si.objetivo) sm[cid].objectives[si.objetivo] = (sm[cid].objectives[si.objetivo] || 0) + 1;
        }
      }
      for (const ci of calRes.data || []) {
        const cid = (ci as any).campaign_id;
        if (cid && sm[cid]) sm[cid].calendarCount++;
      }
      setStatsMap(sm);
    } catch {
      toast.error("Erro ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", theme: "", strategic_objective: "", benchmark_preset: "", status: "planejada", start_date: "", end_date: "", persona_ids: [], cluster_ids: [], notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      theme: c.theme || "",
      strategic_objective: c.strategic_objective || "",
      benchmark_preset: c.benchmark_preset || "",
      status: c.status as CampaignStatus,
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      persona_ids: c.persona_ids,
      cluster_ids: c.cluster_ids,
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) return;
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        theme: form.theme || null,
        strategic_objective: form.strategic_objective || null,
        benchmark_preset: form.benchmark_preset || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        persona_ids: form.persona_ids,
        cluster_ids: form.cluster_ids,
        notes: form.notes || null,
      };

      if (editing) {
        await supabase.from("campaigns").update(payload as any).eq("id", editing.id);
        toast.success("Campanha atualizada!");
      } else {
        await supabase.from("campaigns").insert(payload as any);
        toast.success("Campanha criada!");
      }
      setDialogOpen(false);
      loadAll();
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await supabase.from("campaigns").delete().eq("id", id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (selectedCampaign?.id === id) setSelectedCampaign(null);
      toast.success("Campanha removida.");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const openDetail = async (c: Campaign) => {
    setSelectedCampaign(c);
    if (!user) return;
    const [contentRes, calRes] = await Promise.all([
      supabase.from("content_outputs").select("id, title, strategic_input, created_at").eq("campaign_id", c.id).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_items").select("id, title, date, status, content_type").eq("campaign_id", c.id).eq("user_id", user.id).order("date", { ascending: true }),
    ]);
    setCampaignContent(contentRes.data || []);
    setCampaignCalendar(calRes.data || []);
  };

  // Strategic gap analysis
  const getGaps = (c: Campaign): string[] => {
    const stats = statsMap[c.id];
    if (!stats) return [];
    const gaps: string[] = [];
    if (stats.contentCount === 0) gaps.push("Nenhum conteúdo criado ainda");
    const usedObjs = Object.keys(stats.objectives);
    const allObjs = ["educar", "salvar", "comentar", "conversao"];
    const missingObjs = allObjs.filter(o => !usedObjs.includes(o));
    if (missingObjs.length > 0 && stats.contentCount > 0) {
      gaps.push(`Objetivos não cobertos: ${missingObjs.map(o => objetivoLabels[o]).join(", ")}`);
    }
    if (c.benchmark_preset && stats.contentCount > 3) {
      const presetCount = stats.presets[c.benchmark_preset] || 0;
      if (presetCount > stats.contentCount * 0.8) gaps.push("Preset principal saturado — diversifique");
    }
    return gaps;
  };

  /* ── Render ── */

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="font-heading text-title tracking-tight text-foreground flex items-center gap-2.5">
              <FolderOpen className="h-5 w-5 text-accent" />
              Campanhas
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-lg">
              Organize conteúdos em campanhas estratégicas para manter consistência editorial.
            </p>
          </div>
          <Button onClick={openNew} size="sm" className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-3.5 w-3.5" /> Nova Campanha
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="surface-card p-5 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && campaigns.length === 0 && !selectedCampaign && (
          <div className="flex flex-col items-center py-20 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/25 mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Crie campanhas para agrupar conteúdos por tema e acompanhar a cobertura estratégica.
            </p>
          </div>
        )}

        {/* Campaign list */}
        {!loading && campaigns.length > 0 && !selectedCampaign && (
          <div className="grid gap-3 md:grid-cols-2">
            {campaigns.map((c, i) => {
              const stats = statsMap[c.id] || { contentCount: 0, calendarCount: 0, presets: {}, objectives: {} };
              const statusCfg = STATUS_CONFIG[c.status as CampaignStatus] || STATUS_CONFIG.planejada;
              const presetInfo = c.benchmark_preset ? getPreset(c.benchmark_preset as BenchmarkPresetId) : null;
              const gaps = getGaps(c);

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="surface-card p-5 hover:shadow-premium-md hover:border-accent/20 transition-all group cursor-pointer"
                  onClick={() => openDetail(c)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[13px] font-medium text-foreground leading-snug">{c.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 ${statusCfg.color}`}>
                      {statusCfg.icon} {statusCfg.label}
                    </span>
                  </div>

                  {c.theme && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.theme}</p>}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {presetInfo && (
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground">
                        {presetInfo.icon} {presetInfo.label}
                      </span>
                    )}
                    {c.strategic_objective && (
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground">
                        {c.strategic_objective}
                      </span>
                    )}
                    {c.start_date && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(c.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        {c.end_date && ` → ${new Date(c.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {stats.contentCount} conteúdos</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {stats.calendarCount} no calendário</span>
                  </div>

                  {/* Gaps */}
                  {gaps.length > 0 && (
                    <div className="flex items-start gap-1.5 mt-2 text-[11px] text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{gaps[0]}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => openEdit(c)}>
                      <Edit2 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => navigate(`/carrossel?campaign=${c.id}`)}>
                      <Plus className="h-3 w-3 mr-1" /> Criar conteúdo
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive hover:text-destructive" onClick={() => deleteCampaign(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Campaign detail */}
        {selectedCampaign && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-heading text-title tracking-tight text-foreground">{selectedCampaign.name}</h2>
                {selectedCampaign.theme && <p className="text-[13px] text-muted-foreground">{selectedCampaign.theme}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectedCampaign(null)}>
                  ← Voltar
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate(`/carrossel?campaign=${selectedCampaign.id}`)}>
                  <Plus className="h-3.5 w-3.5" /> Criar conteúdo
                </Button>
              </div>
            </div>

            {/* Strategic overview */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="surface-card p-4 space-y-1">
                <span className="text-label uppercase tracking-wider text-muted-foreground/60">Conteúdos</span>
                <p className="text-2xl font-heading text-foreground">{statsMap[selectedCampaign.id]?.contentCount || 0}</p>
              </div>
              <div className="surface-card p-4 space-y-1">
                <span className="text-label uppercase tracking-wider text-muted-foreground/60">Calendário</span>
                <p className="text-2xl font-heading text-foreground">{statsMap[selectedCampaign.id]?.calendarCount || 0}</p>
              </div>
              <div className="surface-card p-4 space-y-1">
                <span className="text-label uppercase tracking-wider text-muted-foreground/60">Objetivos cobertos</span>
                <p className="text-2xl font-heading text-foreground">{Object.keys(statsMap[selectedCampaign.id]?.objectives || {}).length}/4</p>
              </div>
            </div>

            {/* Objective coverage */}
            {(() => {
              const stats = statsMap[selectedCampaign.id];
              if (!stats || stats.contentCount === 0) return null;
              const allObjs = ["educar", "salvar", "comentar", "conversao"];
              return (
                <div className="surface-card p-5 space-y-3">
                  <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3" /> Cobertura de objetivos
                  </h3>
                  <div className="space-y-2">
                    {allObjs.map(obj => {
                      const count = stats.objectives[obj] || 0;
                      const pct = stats.contentCount > 0 ? (count / stats.contentCount) * 100 : 0;
                      return (
                        <div key={obj} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24">{objetivoLabels[obj]}</span>
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-[11px] text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Gaps */}
            {(() => {
              const gaps = getGaps(selectedCampaign);
              if (gaps.length === 0) return null;
              return (
                <div className="surface-card p-5 space-y-2">
                  <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Oportunidades
                  </h3>
                  {gaps.map((g, i) => (
                    <p key={i} className="text-[13px] text-orange-600 dark:text-orange-400 flex items-start gap-2">
                      <span className="text-[10px] mt-0.5">•</span> {g}
                    </p>
                  ))}
                </div>
              );
            })()}

            {/* Linked content */}
            <div className="surface-card p-5 space-y-3">
              <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Conteúdos ({campaignContent.length})
              </h3>
              {campaignContent.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 py-4 text-center">Nenhum conteúdo vinculado a esta campanha.</p>
              ) : (
                <div className="space-y-1.5">
                  {campaignContent.map((co: any) => (
                    <div key={co.id} className="flex items-center justify-between p-2.5 rounded-md bg-background hover:bg-secondary/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">{co.title || "Carrossel"}</p>
                        <p className="text-[10px] text-muted-foreground/50">{new Date(co.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigate("/biblioteca")}>
                        Ver <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked calendar */}
            <div className="surface-card p-5 space-y-3">
              <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Calendário ({campaignCalendar.length})
              </h3>
              {campaignCalendar.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 py-4 text-center">Nenhum item de calendário vinculado.</p>
              ) : (
                <div className="space-y-1.5">
                  {campaignCalendar.map((ci: any) => (
                    <div key={ci.id} className="flex items-center justify-between p-2.5 rounded-md bg-background hover:bg-secondary/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">{ci.title}</p>
                        <p className="text-[10px] text-muted-foreground/50">{new Date(ci.date).toLocaleDateString("pt-BR")} · {ci.content_type}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-5">{ci.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-title-sm">
                {editing ? "Editar Campanha" : "Nova Campanha"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome da campanha *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Protocolo Bioestimuladores" className="text-[13px] h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tema central</Label>
                <Textarea value={form.theme} onChange={(e) => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="O que une os conteúdos desta campanha" rows={2} className="text-[13px] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Objetivo estratégico</Label>
                  <Input value={form.strategic_objective} onChange={(e) => setForm(f => ({ ...f, strategic_objective: e.target.value }))} placeholder="Ex: Gerar autoridade" className="text-[13px] h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Preset principal</Label>
                  <Select value={form.benchmark_preset} onValueChange={(v) => setForm(f => ({ ...f, benchmark_preset: v }))}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PRESET_LIST.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.icon} {p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as CampaignStatus }))}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Período</Label>
                  <div className="flex gap-1.5">
                    <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className="text-[11px] h-9 flex-1" />
                    <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} className="text-[11px] h-9 flex-1" />
                  </div>
                </div>
              </div>

              {personas.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Personas relacionadas</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {personas.map(p => {
                      const isSelected = form.persona_ids.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          className={`text-[11px] px-2 py-1 rounded-sm border transition-colors ${isSelected ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/30"}`}
                          onClick={() => setForm(f => ({
                            ...f,
                            persona_ids: isSelected ? f.persona_ids.filter(id => id !== p.id) : [...f.persona_ids, p.id]
                          }))}
                        >
                          {p.nome_interno}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações internas" rows={2} className="text-[13px] resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-xs">Cancelar</Button>
                <Button size="sm" onClick={save} disabled={!form.name.trim()} className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                  {editing ? "Salvar" : "Criar campanha"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Campanhas;
