import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CarouselRoteiro } from "@/types/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Layers, Loader2, RotateCcw } from "lucide-react";

const Carrossel = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  const [tese, setTese] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [roteiro, setRoteiro] = useState<CarouselRoteiro | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!profile) return;
    if (!tese.trim()) {
      toast.error("Informe a tese central do carrossel.");
      return;
    }

    setLoading(true);
    setRoteiro(null);

    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: { profile, tese, objetivo },
      });

      if (error) throw error;

      const parsed = data as CarouselRoteiro;
      setRoteiro(parsed);
      toast.success("Roteiro gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar carrossel:", err);
      toast.error(err.message || "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoteiro(null);
    setTese("");
    setObjetivo("");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Gerador de Carrossel</h1>
        </div>
        <p className="text-muted-foreground">
          Gere roteiros de carrossel com estrutura narrativa otimizada para Instagram médico.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de gerar carrosseis.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tese">Tese central do carrossel</Label>
                  <Textarea
                    id="tese"
                    value={tese}
                    onChange={(e) => setTese(e.target.value)}
                    placeholder="Ex: A maioria dos pacientes com acne usa o produto errado no primeiro mês de tratamento."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivo">Objetivo do carrossel</Label>
                  <Textarea
                    id="objetivo"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Ex: Educar e gerar salvamentos. Público: mulheres 25-40 com acne adulta."
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleGenerate} disabled={loading || !tese.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Roteiro...
                      </>
                    ) : (
                      "Gerar Carrossel"
                    )}
                  </Button>
                  {roteiro && (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Novo Roteiro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {roteiro && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{roteiro.titulo_carrossel}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Tese:</strong> {roteiro.tese_central}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Tom:</strong> {roteiro.tom} | <strong>Objetivo:</strong> {roteiro.objetivo}
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {roteiro.slides.map((slide) => (
                    <Card key={slide.numero}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center">
                              {slide.numero}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {slide.papel}
                            </Badge>
                          </div>
                          <div className="flex-1 space-y-1">
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
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Legenda e Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{roteiro.legenda}</p>
                    <div className="flex flex-wrap gap-1">
                      {roteiro.hashtags.map((h) => (
                        <Badge key={h} variant="secondary" className="text-xs">
                          {h.startsWith("#") ? h : `#${h}`}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm">
                      <strong>CTA Final:</strong> {roteiro.cta_final}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrossel;
