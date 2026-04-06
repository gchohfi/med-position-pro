import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Link, Loader2, Search } from "lucide-react";
import type { PautaResult } from "@/hooks/useCarrossel";

interface ResearchPanelProps {
  researchOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  pautas: PautaResult[];
  searchLoading: boolean;
  onSearch: () => void;
  onSelectPauta: (p: PautaResult) => void;
  scraperUrl: string;
  onScraperUrlChange: (v: string) => void;
  scraperLoading: boolean;
  onScrape: () => void;
}

const ResearchPanel: React.FC<ResearchPanelProps> = ({
  researchOpen,
  onToggle,
  searchQuery,
  onSearchQueryChange,
  pautas,
  searchLoading,
  onSearch,
  onSelectPauta,
  scraperUrl,
  onScraperUrlChange,
  scraperLoading,
  onScrape,
}) => {
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Pesquisar Pautas e Extrair Links
          </CardTitle>
          {researchOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      {researchOpen && (
        <CardContent className="space-y-5 pt-0">
          <div className="space-y-2">
            <Label className="font-medium">Pesquisar Pautas</Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Ex: acne adulta, tratamento laser, microbioma"
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
              <Button onClick={onSearch} disabled={searchLoading} size="sm">
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {pautas.length > 0 && (
              <div className="grid gap-2 mt-2">
                {pautas.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectPauta(p)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.resumo}
                    </p>
                    {p.fonte && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Fonte: {p.fonte}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Transformar um Link
            </Label>
            <div className="flex gap-2">
              <Input
                value={scraperUrl}
                onChange={(e) => onScraperUrlChange(e.target.value)}
                placeholder="https://artigo-ou-post.com/..."
                type="url"
              />
              <Button onClick={onScrape} disabled={scraperLoading} size="sm">
                {scraperLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Extrair"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ResearchPanel;
