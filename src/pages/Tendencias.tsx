import AppLayout from "@/components/AppLayout";
import { ROUTES } from "@/lib/routes";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import { useDoctor } from "@/contexts/DoctorContext";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Loader2, RotateCcw, Sparkles, LayoutTemplate } from "lucide-react";

const Tendencias = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  const { text, loading, error, start, reset } = useStreamingResponse({
    functionName: "agent-tendencias",
    onComplete: () => {},
    onError: (err) => console.error("Erro ao buscar tendências:", err),
  });

  const handleFetch = () => {
    if (!profile) return;
    start({ profile, especialidade: profile.especialidade });
  };

  const handleUsarNoCarrossel = () => {
    navigate("/carrossel");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Tendências</h1>
            <p className="text-muted-foreground text-sm">
              Dados em tempo real via Perplexity + análise Claude
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Descubra tendências de conteúdo médico com dados reais do Instagram — atualizados para abril de 2026.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de buscar tendências.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handleFetch} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pesquisando tendências reais...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Buscar Tendências
                  </>
                )}
              </Button>
              {text && !loading && (
                <>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Nova Busca
                  </Button>
                  <Button variant="secondary" onClick={handleUsarNoCarrossel}>
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    Usar tema no Carrossel
                  </Button>
                </>
              )}
            </div>

            {/* Source badge while loading */}
            {loading && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  Buscando dados reais no Perplexity...
                </Badge>
              </div>
            )}

            {/* Error */}
            {error && (
              <Card className="border-red-500/50">
                <CardContent className="py-4 text-red-600">
                  Erro ao buscar tendências: {error}
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {text && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">Tendências Identificadas</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Abril 2026
                    </Badge>
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      Dados em tempo real
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SimpleMarkdown content={text} className="text-foreground" />
                  {!loading && (
                    <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={handleUsarNoCarrossel}>
                        <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
                        Criar Carrossel com este tema
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.estrategiaIa)}>
                        Ver Estratégia de Conteúdo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Tendencias;
