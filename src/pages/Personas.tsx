import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Target,
  Heart,
  ShieldCheck,
  MessageCircle,
  Zap,
  Loader2,
} from "lucide-react";

/* ── Types ─────────────────────────── */

interface PatientPersona {
  id: string;
  user_id: string;
  nome_interno: string;
  faixa_etaria: string;
  momento_vida: string;
  dor_principal: string;
  objecoes: string[];
  desejo: string;
  gatilhos_confianca: string[];
  linguagem_ideal: string;
  cta_ideal: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FAIXA_OPTIONS = [
  "18-25",
  "25-30",
  "30-40",
  "40-50",
  "50-60",
  "60+",
];

const EMPTY_PERSONA: Omit<PatientPersona, "id" | "user_id" | "created_at" | "updated_at"> = {
  nome_interno: "",
  faixa_etaria: "30-40",
  momento_vida: "",
  dor_principal: "",
  objecoes: [],
  desejo: "",
  gatilhos_confianca: [],
  linguagem_ideal: "",
  cta_ideal: "",
  is_active: false,
};

/* ── Suggestions by specialty ──────── */

function getSuggestions(specialty: string | undefined) {
  const base = {
    momentos: [
      "Pré-consulta — pesquisando sintomas",
      "Pós-diagnóstico — buscando segunda opinião",
      "Preventivo — quer manter saúde",
      "Estético — quer melhorar aparência",
      "Mãe preocupada — buscando para os filhos",
    ],
    dores: [
      "Não confia em informações da internet",
      "Já passou por experiência ruim",
      "Sente vergonha de falar sobre o problema",
      "Não sabe a quem procurar",
      "Preocupada com custo do tratamento",
    ],
    gatilhos: [
      "Dados científicos claros",
      "Testemunhos de pacientes",
      "Linguagem acolhedora",
      "Credenciais visíveis",
      "Conteúdo sem jargão",
    ],
    ctas: [
      "Agende sua avaliação",
      "Salve para mostrar na consulta",
      "Compartilhe com quem precisa",
      "Comente sua dúvida",
      "Mande mensagem no direct",
    ],
  };

  if (specialty?.includes("Dermatologia")) {
    base.dores = ["Acne persistente afetando autoestima", "Manchas que não melhoram", "Medo de procedimentos", ...base.dores];
    base.momentos = ["Rotina de skincare — quer orientação profissional", ...base.momentos];
  } else if (specialty?.includes("Ginecologia")) {
    base.dores = ["Tabu sobre saúde íntima", "Medo do exame preventivo", "Sintomas que ignora há tempo", ...base.dores];
  } else if (specialty?.includes("Pediatria")) {
    base.momentos = ["Mãe de primeira viagem", "Filho com sintoma recorrente", ...base.momentos];
  }

  return base;
}

/* ── Component ─────────────────────── */

export default function Personas() {
  const { user } = useAuth();
  const { profile } = useDoctor();
  const [personas, setPersonas] = useState<PatientPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Partial<PatientPersona> | null>(null);
  const [newObjecao, setNewObjecao] = useState("");
  const [newGatilho, setNewGatilho] = useState("");

  const suggestions = getSuggestions(profile?.especialidade);

  /* ── Fetch ── */
  const fetchPersonas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("patient_personas")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPersonas(data.map((d) => ({ ...d, objecoes: d.objecoes as string[] ?? [], gatilhos_confianca: d.gatilhos_confianca as string[] ?? [] })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPersonas(); }, [fetchPersonas]);

  /* ── Save ── */
  const handleSave = async () => {
    if (!user || !editingPersona?.nome_interno?.trim()) {
      toast.error("Nome interno é obrigatório");
      return;
    }
    setSaving(true);

    const payload = {
      user_id: user.id,
      nome_interno: editingPersona.nome_interno,
      faixa_etaria: editingPersona.faixa_etaria || "30-40",
      momento_vida: editingPersona.momento_vida || "",
      dor_principal: editingPersona.dor_principal || "",
      objecoes: editingPersona.objecoes || [],
      desejo: editingPersona.desejo || "",
      gatilhos_confianca: editingPersona.gatilhos_confianca || [],
      linguagem_ideal: editingPersona.linguagem_ideal || "",
      cta_ideal: editingPersona.cta_ideal || "",
      is_active: editingPersona.is_active || false,
    };

    let error;
    if (editingPersona.id) {
      ({ error } = await supabase.from("patient_personas").update(payload).eq("id", editingPersona.id));
    } else {
      ({ error } = await supabase.from("patient_personas").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar persona");
    } else {
      toast.success(editingPersona.id ? "Persona atualizada" : "Persona criada");
      setDialogOpen(false);
      setEditingPersona(null);
      fetchPersonas();
    }
    setSaving(false);
  };

  /* ── Toggle active ── */
  const toggleActive = async (persona: PatientPersona) => {
    const { error } = await supabase
      .from("patient_personas")
      .update({ is_active: !persona.is_active })
      .eq("id", persona.id);
    if (!error) fetchPersonas();
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("patient_personas").delete().eq("id", id);
    if (!error) {
      toast.success("Persona removida");
      fetchPersonas();
    }
  };

  /* ── Helpers for array fields ── */
  const addToArray = (field: "objecoes" | "gatilhos_confianca", value: string) => {
    if (!value.trim() || !editingPersona) return;
    const current = (editingPersona[field] as string[]) || [];
    if (current.includes(value.trim())) return;
    setEditingPersona({ ...editingPersona, [field]: [...current, value.trim()] });
    if (field === "objecoes") setNewObjecao("");
    else setNewGatilho("");
  };

  const removeFromArray = (field: "objecoes" | "gatilhos_confianca", idx: number) => {
    if (!editingPersona) return;
    const current = [...((editingPersona[field] as string[]) || [])];
    current.splice(idx, 1);
    setEditingPersona({ ...editingPersona, [field]: current });
  };

  const openNew = () => {
    setEditingPersona({ ...EMPTY_PERSONA });
    setNewObjecao("");
    setNewGatilho("");
    setDialogOpen(true);
  };

  const openEdit = (p: PatientPersona) => {
    setEditingPersona({ ...p });
    setNewObjecao("");
    setNewGatilho("");
    setDialogOpen(true);
  };

  /* ── Render ── */
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-title tracking-tight text-foreground flex items-center gap-2.5">
              <Users className="h-5 w-5 text-accent" />
              Personas de Paciente
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-lg">
              Defina quem é seu público para gerar conteúdo com linguagem, dor e CTA precisos.
            </p>
          </div>
          <Button onClick={openNew} size="sm" className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-3.5 w-3.5" /> Nova Persona
          </Button>
        </div>

        {/* Active indicator */}
        {personas.filter((p) => p.is_active).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {personas.filter((p) => p.is_active).map((p) => (
              <Badge key={p.id} variant="default" className="bg-accent/15 text-accent border-accent/30 gap-1">
                <Star className="h-3 w-3" /> {p.nome_interno}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground self-center">— ativas na geração</span>
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : personas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma persona criada ainda.</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" /> Criar primeira persona
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {personas.map((p) => (
              <Card
                key={p.id}
                className={`transition-all ${p.is_active ? "border-accent/40 bg-accent/[0.03]" : "border-border/50"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-heading flex items-center gap-2">
                        {p.nome_interno}
                        {p.is_active && <Badge variant="secondary" className="text-[10px] bg-accent/15 text-accent">Ativa</Badge>}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{p.faixa_etaria} · {p.momento_vida || "—"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(p)}>
                        {p.is_active ? <Star className="h-3.5 w-3.5 text-accent fill-accent" /> : <StarOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.dor_principal && (
                    <div className="flex gap-2">
                      <Target className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dor principal</span>
                        <p className="text-foreground/80">{p.dor_principal}</p>
                      </div>
                    </div>
                  )}
                  {p.desejo && (
                    <div className="flex gap-2">
                      <Heart className="h-4 w-4 text-pink-400/70 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Desejo</span>
                        <p className="text-foreground/80">{p.desejo}</p>
                      </div>
                    </div>
                  )}
                  {(p.objecoes as string[])?.length > 0 && (
                    <div className="flex gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-400/70 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {(p.objecoes as string[]).map((o, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">{o}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {p.cta_ideal && (
                    <div className="flex gap-2">
                      <Zap className="h-4 w-4 text-accent/70 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">CTA ideal</span>
                        <p className="text-foreground/80 italic">"{p.cta_ideal}"</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingPersona?.id ? "Editar Persona" : "Nova Persona"}
              </DialogTitle>
            </DialogHeader>

            {editingPersona && (
              <div className="space-y-5 pt-2">
                {/* Name + Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome interno</Label>
                    <Input
                      value={editingPersona.nome_interno || ""}
                      onChange={(e) => setEditingPersona({ ...editingPersona, nome_interno: e.target.value })}
                      placeholder="Ex: Maria Executiva"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Faixa etária</Label>
                    <Select
                      value={editingPersona.faixa_etaria || "30-40"}
                      onValueChange={(v) => setEditingPersona({ ...editingPersona, faixa_etaria: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FAIXA_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f} anos</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Momento de vida */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Momento de vida</Label>
                  <Input
                    value={editingPersona.momento_vida || ""}
                    onChange={(e) => setEditingPersona({ ...editingPersona, momento_vida: e.target.value })}
                    placeholder="Ex: Mãe de 2 filhos, trabalha fora"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.momentos.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        onClick={() => setEditingPersona({ ...editingPersona, momento_vida: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dor principal */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3 text-destructive/60" /> Dor principal</Label>
                  <Textarea
                    value={editingPersona.dor_principal || ""}
                    onChange={(e) => setEditingPersona({ ...editingPersona, dor_principal: e.target.value })}
                    placeholder="A dor mais urgente que essa persona sente"
                    className="min-h-[60px]"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.dores.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        onClick={() => setEditingPersona({ ...editingPersona, dor_principal: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desejo */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Heart className="h-3 w-3 text-pink-400/70" /> Desejo</Label>
                  <Textarea
                    value={editingPersona.desejo || ""}
                    onChange={(e) => setEditingPersona({ ...editingPersona, desejo: e.target.value })}
                    placeholder="O que essa persona deseja profundamente"
                    className="min-h-[60px]"
                  />
                </div>

                {/* Objeções */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-amber-400/70" /> Objeções</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newObjecao}
                      onChange={(e) => setNewObjecao(e.target.value)}
                      placeholder="Adicionar objeção"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("objecoes", newObjecao))}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => addToArray("objecoes", newObjecao)}>+</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {((editingPersona.objecoes as string[]) || []).map((o, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10" onClick={() => removeFromArray("objecoes", i)}>
                        {o} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Gatilhos de confiança */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-accent/70" /> Gatilhos de confiança</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newGatilho}
                      onChange={(e) => setNewGatilho(e.target.value)}
                      placeholder="Adicionar gatilho"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("gatilhos_confianca", newGatilho))}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => addToArray("gatilhos_confianca", newGatilho)}>+</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.gatilhos.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        onClick={() => addToArray("gatilhos_confianca", s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {((editingPersona.gatilhos_confianca as string[]) || []).map((g, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10" onClick={() => removeFromArray("gatilhos_confianca", i)}>
                        {g} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Linguagem ideal */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Linguagem ideal</Label>
                  <Textarea
                    value={editingPersona.linguagem_ideal || ""}
                    onChange={(e) => setEditingPersona({ ...editingPersona, linguagem_ideal: e.target.value })}
                    placeholder="Como essa persona prefere ser abordada (tom, vocabulário)"
                    className="min-h-[60px]"
                  />
                </div>

                {/* CTA ideal */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Zap className="h-3 w-3 text-accent/70" /> CTA que funciona melhor</Label>
                  <Input
                    value={editingPersona.cta_ideal || ""}
                    onChange={(e) => setEditingPersona({ ...editingPersona, cta_ideal: e.target.value })}
                    placeholder="Ex: Agende sua avaliação"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.ctas.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        onClick={() => setEditingPersona({ ...editingPersona, cta_ideal: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar Persona
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
