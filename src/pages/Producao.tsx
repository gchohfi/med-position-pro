import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { CarouselSlide } from "@/types/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  PenTool,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Download,
} from "lucide-react";

interface Brief {
  tipo: string;
  objetivo: string;
  tese: string;
  percepcao: string;
  nivel_ousadia: number;
  territorio_visual: string;
  presenca_medica: string;
  cta: string;
  restricoes: string;
}

interface GeneratedSlide extends CarouselSlide {
  approved?: boolean;
}

interface CampaignResult {
  titulo: string;
  legenda: string;
  hashtags: string[];
  slides: GeneratedSlide[];
}

const emptyBrief = (): Brief => ({
  tipo: "educativo",
  objetivo: "",
  tese: "",
  percepcao: "",
  nivel_ousadia: 3,
  territorio_visual: "",
  presenca_medica: "casual",
  cta: "",
  restricoes: "",
});

const STEPS = ["Brief", "Campanha", "Aprovação", "Exportação"] as const;

const Producao = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const contentId = searchParams.get("content_id");

  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>(emptyBrief());
  const [campaign, setCampaign] = useState<CampaignResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Load existing content if editing from Biblioteca
  useEffect(() => {
    if (!contentId || !user) return;

    const loadExisting = async () => {
      setLoadingExisting(true);
      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", contentId)
          .single();

        if (error) throw error;
        if (!data) return;

        // Support both new slide_plan_json and legacy strategic_input/generated_content
        if (data.slide_plan_json) {
          const parsed = typeof data.slide_plan_json === "string"
            ? JSON.parse(data.slide_plan_json)
            : data.slide_plan_json;
          setCampaign(parsed);
          setStep(2); // Go to approval
        } else if (data.strategic_input || data.generated_content) {
          const input = data.strategic_input
            ? (typeof data.strategic_input === "string" ? JSON.parse(data.strategic_input) : data.strategic_input)
            : {};
          setBrief({
            ...emptyBrief(),
            ...input,
          });
          if (data.generated_content) {
            const content = typeof data.generated_content === "string"
              ? JSON.parse(data.generated_content)
              : data.generated_content;
            setCampaign(content);
            setStep(2);
          } else {
            setStep(0);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar conteúdo:", err);
        toast.error("Erro ao carregar conteúdo existente.");
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExisting();
  }, [contentId, user]);

  const updateBrief = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!brief.tese.trim() || !brief.objetivo.trim()) {
      toast.error("Preencha pelo menos a tese e o objetivo.");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign", {
        body: { brief, user_id: user?.id },
      });

      if (error) throw error;

      const result: CampaignResult = {
        titulo: data.titulo || "Campanha sem título",
        legenda: data.legenda || "",
        hashtags: data.hashtags || [],
        slides: (data.slides || data.slide_plan_json?.slides || []).map(
          (s: CarouselSlide) => ({ ...s, approved: true })
        ),
      };

      setCampaign(result);
      setStep(2);
      toast.success("Campanha gerada com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao gerar campanha:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar campanha.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSlideApproval = (index: number) => {
    if (!campaign) return;
    setCampaign({
      ...campaign,
      slides: campaign.slides.map((s, i) =>
        i === index ? { ...s, approved: !s.approved } : s
      ),
    });
  };

  const approvedSlides = campaign?.slides.filter((s) => s.approved) || [];

  const handleExport = async () => {
    if (!user || !campaign || saving) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        title: campaign.titulo,
        slide_plan_json: JSON.stringify({
          ...campaign,
          slides: approvedSlides,
        }),
        status: "approved",
      };

      if (contentId) {
        const { error } = await supabase
          .from("content_items")
          .update(payload)
          .eq("id", contentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_items").insert(payload);
        if (error) throw error;
      }

      toast.success("Campanha salva na Biblioteca!");
    } catch (err: unknown) {
      console.error("Erro ao salvar:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar campanha.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <PenTool className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Produção</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <Badge
                variant={i === step ? "default" : i < step ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  if (i < step || (i === 1 && step >= 1)) setStep(i);
                }}
              >
                {i + 1}. {label}
              </Badge>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* STEP 0: Brief */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Brief da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de conteúdo</Label>
                  <Select value={brief.tipo} onValueChange={(v) => updateBrief("tipo", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educativo">Educativo</SelectItem>
                      <SelectItem value="manifesto">Manifesto</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="conexao">Conexão</SelectItem>
                      <SelectItem value="conversao">Conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Presença médica</Label>
                  <Select
                    value={brief.presenca_medica}
                    onValueChange={(v) => updateBrief("presenca_medica", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="minima">Mínima</SelectItem>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Textarea
                  value={brief.objetivo}
                  onChange={(e) => updateBrief("objetivo", e.target.value)}
                  placeholder="O que você quer alcançar com esta campanha?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tese central</Label>
                <Textarea
                  value={brief.tese}
                  onChange={(e) => updateBrief("tese", e.target.value)}
                  placeholder="Qual é a mensagem principal que você quer transmitir?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Percepção desejada</Label>
                <Textarea
                  value={brief.percepcao}
                  onChange={(e) => updateBrief("percepcao", e.target.value)}
                  placeholder="Como o público deve se sentir ao ver este conteúdo?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Nível de ousadia: {brief.nivel_ousadia}</Label>
                <Slider
                  value={[brief.nivel_ousadia]}
                  onValueChange={([v]) => updateBrief("nivel_ousadia", v)}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservador</span>
                  <span>Ousado</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Território visual</Label>
                  <Input
                    value={brief.territorio_visual}
                    onChange={(e) => updateBrief("territorio_visual", e.target.value)}
                    placeholder="Ex: clean editorial, bold colorido"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA</Label>
                  <Input
                    value={brief.cta}
                    onChange={(e) => updateBrief("cta", e.target.value)}
                    placeholder="Ex: Salve para lembrar, Agende sua consulta"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Restrições</Label>
                <Textarea
                  value={brief.restricoes}
                  onChange={(e) => updateBrief("restricoes", e.target.value)}
                  placeholder="Termos proibidos, regulamentações CFM, limitações..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(1)}>
                  Gerar Campanha
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 1: Generating */}
        {step === 1 && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              {generating ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Gerando campanha com IA...</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Revise seu brief e clique para gerar a campanha.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Voltar ao Brief
                    </Button>
                    <Button onClick={handleGenerate}>
                      <Loader2 className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : "hidden"}`} />
                      Gerar Campanha
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Approval */}
        {step === 2 && campaign && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{campaign.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione os slides que deseja aprovar para a versão final.
                </p>
              </CardContent>
            </Card>

            {campaign.slides.map((slide, i) => (
              <Card
                key={i}
                className={slide.approved ? "border-green-500/30" : "opacity-60"}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={slide.approved}
                      onCheckedChange={() => toggleSlideApproval(i)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center">
                          {slide.numero}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {slide.papel}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{slide.titulo}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {slide.corpo}
                      </p>
                      {slide.nota_visual && (
                        <p className="text-xs italic text-muted-foreground/70">
                          Visual: {slide.nota_visual}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Regenerar
              </Button>
              <Button onClick={() => setStep(3)} disabled={approvedSlides.length === 0}>
                Exportar ({approvedSlides.length} slides)
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Export */}
        {step === 3 && campaign && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exportação - {campaign.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {approvedSlides.length} slide(s) aprovado(s) pronto(s) para exportação.
                </p>

                <div className="space-y-3">
                  {approvedSlides.map((slide) => (
                    <div
                      key={slide.numero}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Slide {slide.numero}: {slide.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">{slide.papel}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {campaign.legenda && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Legenda</Label>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {campaign.legenda}
                    </p>
                  </div>
                )}

                {campaign.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {campaign.hashtags.map((h) => (
                      <Badge key={h} variant="secondary" className="text-xs">
                        {h.startsWith("#") ? h : `#${h}`}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleExport} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Salvando..." : "Salvar na Biblioteca"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Producao;
