import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  BookOpen,
  Plus,
  ArrowRight,
  Repeat,
  Trash2,
  Mic,
  Eye,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const FREQUENCIES = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
];

const STATUSES = [
  { value: "ativa", label: "Ativa" },
  { value: "pausada", label: "Pausada" },
  { value: "encerrada", label: "Encerrada" },
];

interface Series {
  id: string;
  name: string;
  subtitle: string | null;
  strategic_role: string;
  frequency: string;
  tone: string | null;
  visual_identity: string | null;
  opening_pattern: string | null;
  closing_pattern: string | null;
  status: string;
  created_at: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

const emptyForm = {
  name: "",
  subtitle: "",
  strategic_role: "",
  frequency: "semanal",
  tone: "",
  visual_identity: "",
  opening_pattern: "",
  closing_pattern: "",
};

const Series_Page = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Series | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadSeries();
  }, [user]);

  const loadSeries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("series")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setSeriesList((data as unknown as Series[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.strategic_role.trim()) {
      toast.error("Nome e papel estratégico são obrigatórios.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("series").insert({
      user_id: user!.id,
      name: form.name,
      subtitle: form.subtitle || null,
      strategic_role: form.strategic_role,
      frequency: form.frequency,
      tone: form.tone || null,
      visual_identity: form.visual_identity || null,
      opening_pattern: form.opening_pattern || null,
      closing_pattern: form.closing_pattern || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar série.");
      return;
    }
    logStrategicEvent(STRATEGIC_EVENTS.SERIES_CREATED, "series", { name: form.name });
    toast.success("Série criada com sucesso.");
    setShowCreate(false);
    setForm(emptyForm);
    loadSeries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("series").delete().eq("id", id);
    toast.success("Série removida.");
    setShowDetail(null);
    loadSeries();
  };

  const statusColor = (s: string) => {
    if (s === "ativa") return "bg-green-500/10 text-green-700";
    if (s === "pausada") return "bg-amber-500/10 text-amber-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Séries Editoriais
            </h1>
            <p className="text-muted-foreground">
              Estruturas recorrentes que constroem identidade e memória no perfil.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova série
          </Button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6">
                <Skeleton className="h-5 w-40 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && seriesList.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Nenhuma série criada
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Séries são estruturas recorrentes — como colunas de uma revista — que tornam seu perfil
              reconhecível e estrategicamente memorável.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira série
            </Button>
          </div>
        )}

        {/* Series Grid */}
        {!loading && seriesList.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {seriesList.map((series, i) => (
              <motion.button
                key={series.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm text-left hover:border-accent/30 transition-colors"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                onClick={() => setShowDetail(series)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {series.name}
                    </h3>
                    {series.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{series.subtitle}</p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${statusColor(series.status)}`}>
                    {series.status}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-2">
                  {series.strategic_role}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    {series.frequency}
                  </span>
                  {series.tone && (
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      {series.tone}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Nova Série Editorial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome da série *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Mitos da Harmonização"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subtítulo</label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Uma linha que descreve a série"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Papel estratégico *</label>
                <p className="text-xs text-muted-foreground mb-1.5">Qual função essa série cumpre no seu posicionamento?</p>
                <Textarea
                  value={form.strategic_role}
                  onChange={(e) => setForm({ ...form, strategic_role: e.target.value })}
                  placeholder="Ex: Estabelecer autoridade técnica sobre o tema"
                  className="rounded-xl resize-none min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Frequência</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setForm({ ...form, frequency: f.value })}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        form.frequency === f.value
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-accent/40"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tom de voz</label>
                <Input
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  placeholder="Ex: Direto, técnico, sem jargões"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Identidade visual</label>
                <Input
                  value={form.visual_identity}
                  onChange={(e) => setForm({ ...form, visual_identity: e.target.value })}
                  placeholder="Ex: Fundo escuro, tipografia serifada"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Abertura padrão</label>
                  <Input
                    value={form.opening_pattern}
                    onChange={(e) => setForm({ ...form, opening_pattern: e.target.value })}
                    placeholder="Ex: Você sabia que…"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Fechamento padrão</label>
                  <Input
                    value={form.closing_pattern}
                    onChange={(e) => setForm({ ...form, closing_pattern: e.target.value })}
                    placeholder="Ex: Na próxima semana…"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={saving || !form.name.trim() || !form.strategic_role.trim()}
                className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11"
              >
                {saving ? "Criando…" : "Criar série"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {showDetail && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="font-heading text-xl">{showDetail.name}</DialogTitle>
                      {showDetail.subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{showDetail.subtitle}</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${statusColor(showDetail.status)}`}>
                      {showDetail.status}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="bg-background rounded-xl border border-border p-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Papel estratégico</span>
                    <p className="text-sm text-foreground mt-1">{showDetail.strategic_role}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-xl border border-border p-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Frequência</span>
                      <p className="text-sm text-foreground mt-1 capitalize">{showDetail.frequency}</p>
                    </div>
                    {showDetail.tone && (
                      <div className="bg-background rounded-xl border border-border p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Tom</span>
                        <p className="text-sm text-foreground mt-1">{showDetail.tone}</p>
                      </div>
                    )}
                  </div>

                  {showDetail.visual_identity && (
                    <div className="bg-background rounded-xl border border-border p-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Identidade visual</span>
                      <p className="text-sm text-foreground mt-1">{showDetail.visual_identity}</p>
                    </div>
                  )}

                  {(showDetail.opening_pattern || showDetail.closing_pattern) && (
                    <div className="grid grid-cols-2 gap-3">
                      {showDetail.opening_pattern && (
                        <div className="bg-background rounded-xl border border-border p-4">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Abertura</span>
                          <p className="text-sm text-foreground mt-1">{showDetail.opening_pattern}</p>
                        </div>
                      )}
                      {showDetail.closing_pattern && (
                        <div className="bg-background rounded-xl border border-border p-4">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Fechamento</span>
                          <p className="text-sm text-foreground mt-1">{showDetail.closing_pattern}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setShowDetail(null);
                        navigate(`/producao?objetivo=${encodeURIComponent(showDetail.strategic_role)}`);
                      }}
                      className="flex-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Criar conteúdo desta série
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => handleDelete(showDetail.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Series_Page;
