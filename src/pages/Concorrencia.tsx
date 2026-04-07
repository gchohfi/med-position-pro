import { useState } from "react";
import { ROUTES } from "@/lib/routes";
import AppLayout from "@/components/AppLayout";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import { useDoctor } from "@/contexts/DoctorContext";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Loader2, RotateCcw, Search, X, ExternalLink } from "lucide-react";

const Concorrencia = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();
  const [concorrentes, setConcorrentes] = useState("");
  const [discoveredHandles, setDiscoveredHandles] = useState<string[]>([]);
  const [acceptedHandles, setAcceptedHandles] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const { text, loading, error, start, reset } = useStreamingResponse({
    functionName: "agent-concorrencia",
    onComplete: () => {},
    onError: (err) => console.error("Erro na análise:", err),
  });

  const handleAnalyze = () => {
    if (!profile) return;
    // Merge textarea content + accepted handles into a single list
    const textHandles = concorrentes
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const allHandles = [...new Set([...acceptedHandles, ...textHandles])];
    start({ profile, concorrentes: allHandles });
  };

  const handleDiscover = async () => {
    if (!profile) return;
    setDiscovering(true);
    setDiscoverError(null);
    setDiscoveredHandles([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? supabaseKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/agent-concorrencia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({ profile, autoDiscover: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      if (data.discovered && Array.isArray(data.handles)) {
        setDiscoveredHandles(data.handles);
        // Auto-accept all discovered handles
        setAcceptedHandles(data.handles);
      } else {
        throw new Error("Resposta inesperada do servidor");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao descobrir concorrentes";
      setDiscoverError(msg);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleHandle = (handle: string) => {
    setAcceptedHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
    );
  };

  const removeAccepted = (handle: string) => {
    setAcceptedHandles((prev) => prev.filter((h) => h !== handle));
  };

  const handleReset = () => {
    reset();
    setDiscoveredHandles([]);
    setAcceptedHandles([]);
    setConcorrentes("");
    setDiscoverError(null);
  };

  const hasHandles =
    acceptedHandles.length > 0 ||
    concorrentes.split(/[\n,]+/).some((s) => s.trim().length > 0);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Eye className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Análise de Concorrência</h1>
            <p className="text-muted-foreground text-sm">
              Pesquisa real via Perplexity + análise Claude
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Analise perfis concorrentes com dados reais e descubra oportunidades de diferenciação.
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
            {/* Input card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Auto-discover button */}
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Concorrentes para analisar</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscover}
                    disabled={discovering || loading}
                  >
                    {discovering ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Descobrindo...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Descobrir Concorrentes Automaticamente
                      </>
                    )}
                  </Button>
                </div>

                {/* Discovery error */}
                {discoverError && (
                  <p className="text-sm text-red-600">{discoverError}</p>
                )}

                {/* Discovered handles as chips */}
                {discoveredHandles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Concorrentes encontrados — clique para selecionar/deselecionar:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {discoveredHandles.map((handle) => {
                        const accepted = acceptedHandles.includes(handle);
                        return (
                          <button
                            key={handle}
                            onClick={() => toggleHandle(handle)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors
                              ${accepted
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:border-primary"
                              }`}
                          >
                            {handle}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accepted handles preview */}
                {acceptedHandles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Selecionados para análise:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {acceptedHandles.map((handle) => (
                        <Badge key={handle} variant="secondary" className="gap-1 pr-1">
                          {handle}
                          <button
                            onClick={() => removeAccepted(handle)}
                            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual textarea */}
                <div className="space-y-2">
                  <Label htmlFor="concorrentes" className="text-sm text-muted-foreground">
                    Adicionar manualmente (opcional)
                  </Label>
                  <Textarea
                    id="concorrentes"
                    value={concorrentes}
                    onChange={(e) => setConcorrentes(e.target.value)}
                    placeholder="@dra.fulana, @dr.ciclano (um por linha ou separados por vírgula)"
                    rows={3}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleAnalyze} disabled={loading || !hasHandles}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando com dados reais...
                      </>
                    ) : (
                      "Analisar Concorrência"
                    )}
                  </Button>
                  {text && !loading && (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Nova Análise
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loading badge */}
            {loading && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  Pesquisando perfis no Perplexity...
                </Badge>
              </div>
            )}

            {/* Error */}
            {error && (
              <Card className="border-red-500/50">
                <CardContent className="py-4 text-red-600">
                  Erro na análise: {error}
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {text && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">Resultado da Análise</CardTitle>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/inspiracao")}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Ver Inspiração de Conteúdo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(ROUTES.estrategiaIa)}
                      >
                        Definir Estratégia de Diferenciação
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

export default Concorrencia;
