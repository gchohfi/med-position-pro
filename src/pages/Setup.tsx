import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { toast } from "sonner";
import type { DoctorProfile, Especialidade, Plataforma } from "@/types/doctor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const especialidades: Especialidade[] = [
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Oftalmologia",
  "Nutrologia",
  "Endocrinologia",
  "Cirurgia Plástica",
  "Psiquiatria",
  "Medicina Estética",
  "Outra",
];

const plataformaOptions: { value: Plataforma; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
];

const Setup = () => {
  const { profile, setProfile } = useDoctor();

  const [form, setForm] = useState<DoctorProfile>(
    profile || {
      nome: "",
      especialidade: "Outra",
      subespecialidade: "",
      crm: "",
      cidade: "",
      estado: "",
      plataformas: [],
      publico_alvo: "",
      tom_de_voz: "",
      diferenciais: [],
      objetivos: [],
    }
  );

  const updateField = <K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlataforma = (p: Plataforma) => {
    setForm((prev) => ({
      ...prev,
      plataformas: prev.plataformas.includes(p)
        ? prev.plataformas.filter((x) => x !== p)
        : [...prev.plataformas, p],
    }));
  };

  const handleSave = () => {
    if (!form.nome || !form.crm || !form.especialidade) {
      toast.error("Preencha pelo menos nome, CRM e especialidade.");
      return;
    }
    setProfile(form);
    toast.success("Perfil médico salvo com sucesso!");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Setup do Perfil Médico</h1>
        <p className="text-muted-foreground">
          Configure seu perfil para que os agentes de IA produzam conteúdo personalizado.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  placeholder="Dr(a). Nome Sobrenome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={form.crm}
                  onChange={(e) => updateField("crm", e.target.value)}
                  placeholder="CRM/UF 123456"
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select
                  value={form.especialidade}
                  onValueChange={(v) => updateField("especialidade", v as Especialidade)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub">Subespecialidade</Label>
                <Input
                  id="sub"
                  value={form.subespecialidade || ""}
                  onChange={(e) => updateField("subespecialidade", e.target.value)}
                  placeholder="Ex: Dermatologia Estética"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => updateField("cidade", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) => updateField("estado", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plataformas</Label>
              <div className="flex flex-wrap gap-4">
                {plataformaOptions.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.plataformas.includes(p.value)}
                      onCheckedChange={() => togglePlataforma(p.value)}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico">Público-alvo</Label>
              <Textarea
                id="publico"
                value={form.publico_alvo}
                onChange={(e) => updateField("publico_alvo", e.target.value)}
                placeholder="Descreva seu público ideal: faixa etária, gênero, interesses..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tom">Tom de voz</Label>
              <Textarea
                id="tom"
                value={form.tom_de_voz}
                onChange={(e) => updateField("tom_de_voz", e.target.value)}
                placeholder="Ex: Acessível, didático, com pitadas de humor..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diferenciais">Diferenciais (separados por vírgula)</Label>
              <Textarea
                id="diferenciais"
                value={form.diferenciais.join(", ")}
                onChange={(e) =>
                  updateField(
                    "diferenciais",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Referência em laser, atendimento humanizado, pós-doutorado"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivos">Objetivos (separados por vírgula)</Label>
              <Textarea
                id="objetivos"
                value={form.objetivos.join(", ")}
                onChange={(e) =>
                  updateField(
                    "objetivos",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Aumentar autoridade, captar pacientes, lançar curso"
                rows={2}
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-4" size="lg">
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Setup;
