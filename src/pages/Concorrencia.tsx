import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, Loader2, RotateCcw } from "lucide-react";

const Concorrencia = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();
  const [concorrentes, setConcorrentes] = useState("");

  const { text, loading, error, start, reset } = useStreamingResponse({
    functionName: "agent-concorrencia",
    onComplete: () => {},
    onError: (err) => console.error("Erro na análise:", err),
  });

  const handleAnalyze = () => {
    if (!profile) return;
    start({ profile, concorrentes });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Eye className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Análise de Concorrência</h1>
        </div>
        <p className="text-muted-foreground">
          Analise perfis concorrentes e descubra oportunidades de diferenciação.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de analisar concorrentes.
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
                  <Label htmlFor="concorrentes">Concorrentes para analisar</Label>
                  <Textarea
                    id="concorrentes"
                    value={concorrentes}
                    onChange={(e) => setConcorrentes(e.target.value)}
                    placeholder="Liste os perfis ou nomes de concorrentes (um por linha ou separados por vírgula). Ex: @dra.fulana, @dr.ciclano"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAnalyze} disabled={loading || !concorrentes.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      "Analisar Concorrência"
                    )}
                  </Button>
                  {text && !loading && (
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Nova Análise
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-500/50">
                <CardContent className="py-4 text-red-600">
                  Erro na análise: {error}
                </CardContent>
              </Card>
            )}

            {text && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {text}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Concorrencia;
