import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Loader2, RotateCcw } from "lucide-react";

const AnalisePerfil = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  const { text, loading, error, start, reset } = useStreamingResponse({
    functionName: "agent-analise-perfil",
    onComplete: () => {},
    onError: (err) => console.error("Erro na análise:", err),
  });

  const handleGenerate = () => {
    if (!profile) return;
    start({ profile });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Análise de Perfil</h1>
        </div>
        <p className="text-muted-foreground">
          Análise completa do seu perfil médico, presença digital e oportunidades de posicionamento.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Vá ao Setup para configurar seu perfil médico antes de gerar análises.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando Análise...
                  </>
                ) : (
                  "Gerar Análise"
                )}
              </Button>
              {text && !loading && (
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nova Análise
                </Button>
              )}
            </div>

            {error && (
              <Card className="border-red-500/50">
                <CardContent className="py-4 text-red-600">
                  Erro ao gerar análise: {error}
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

export default AnalisePerfil;
