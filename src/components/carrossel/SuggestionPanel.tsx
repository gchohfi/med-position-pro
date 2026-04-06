import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { TopicSuggestion } from "@/hooks/useCarrossel";

const formatoBadge: Record<string, string> = {
  mitos_verdades: "Mitos vs Verdades",
  passo_a_passo: "Passo a Passo",
  dados_impacto: "Dados de Impacto",
  comparativo: "Comparativo",
  erros_comuns: "Erros Comuns",
  explicacao: "Explicacao",
  dica_pratica: "Dica Pratica",
  alerta: "Alerta",
};

const urgenciaCor: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baixa: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface SuggestionPanelProps {
  suggestions: TopicSuggestion[];
  suggestionsLoading: boolean;
  suggestionsLoaded: boolean;
  loading: boolean;
  especialidade?: string;
  onRefresh: () => void;
  onGenerate: (s: TopicSuggestion) => void;
  onSelect: (s: TopicSuggestion) => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestions,
  suggestionsLoading,
  suggestionsLoaded,
  loading,
  especialidade,
  onRefresh,
  onGenerate,
  onSelect,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Sugestoes para voce</h2>
          {suggestionsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {suggestionsLoaded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={suggestionsLoading}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Novas sugestoes
          </Button>
        )}
      </div>

      {suggestionsLoading && suggestions.length === 0 && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Buscando tendencias reais para {especialidade}...
            </p>
            <p className="text-xs text-muted-foreground/60">
              Perplexity + Claude analisando dados atuais
            </p>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {suggestions.map((s, i) => (
            <Card
              key={i}
              className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
            >
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">
                    {s.titulo}
                  </h3>
                  <Badge
                    className={`text-[10px] shrink-0 ${urgenciaCor[s.urgencia] ?? ""}`}
                  >
                    {s.urgencia}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {s.tese}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {formatoBadge[s.formato] ?? s.formato}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    {s.por_que?.slice(0, 40)}
                    {(s.por_que?.length ?? 0) > 40 ? "..." : ""}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerate(s);
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Gerar Carrossel
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(s);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default SuggestionPanel;
