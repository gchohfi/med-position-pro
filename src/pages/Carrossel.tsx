import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Layers, Loader2, RotateCcw } from "lucide-react";
import { useCarrossel } from "@/hooks/useCarrossel";
import SuggestionPanel from "@/components/carrossel/SuggestionPanel";
import ResearchPanel from "@/components/carrossel/ResearchPanel";
import RoteiroResults from "@/components/carrossel/RoteiroResults";

const Carrossel = () => {
  const navigate = useNavigate();
  const c = useCarrossel();

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Gerador de Carrossel</h1>
        </div>
        <p className="text-muted-foreground">
          Gere roteiros de carrossel com estrutura narrativa otimizada para
          Instagram medico.
        </p>

        {!c.isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil nao configurado</p>
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
            {/* Auto-suggestions */}
            {!c.roteiro && (
              <SuggestionPanel
                suggestions={c.suggestions}
                suggestionsLoading={c.suggestionsLoading}
                suggestionsLoaded={c.suggestionsLoaded}
                loading={c.loading}
                especialidade={c.profile?.especialidade}
                onRefresh={c.loadSuggestions}
                onGenerate={c.handleGenerateFromSuggestion}
                onSelect={c.handleSelectSuggestion}
              />
            )}

            {/* Research panel */}
            {!c.roteiro && (
              <ResearchPanel
                researchOpen={c.researchOpen}
                onToggle={() => c.setResearchOpen(!c.researchOpen)}
                searchQuery={c.searchQuery}
                onSearchQueryChange={c.setSearchQuery}
                pautas={c.pautas}
                searchLoading={c.searchLoading}
                onSearch={c.handleSearch}
                onSelectPauta={c.handleSelectPauta}
                scraperUrl={c.scraperUrl}
                onScraperUrlChange={c.setScraperUrl}
                scraperLoading={c.scraperLoading}
                onScrape={c.handleScrape}
              />
            )}

            {/* Brief form */}
            <Card id="brief-form">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tese">Tese central do carrossel</Label>
                  <Textarea
                    id="tese"
                    value={c.tese}
                    onChange={(e) => c.setTese(e.target.value)}
                    placeholder="Ex: A maioria dos pacientes com acne usa o produto errado no primeiro mes de tratamento."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivo">Objetivo do carrossel</Label>
                  <Textarea
                    id="objetivo"
                    value={c.objetivo}
                    onChange={(e) => c.setObjetivo(e.target.value)}
                    placeholder="Ex: Educar e gerar salvamentos. Publico: mulheres 25-40 com acne adulta."
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={c.handleGenerate}
                    disabled={c.loading || !c.tese.trim()}
                  >
                    {c.loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Roteiro...
                      </>
                    ) : (
                      "Gerar Carrossel"
                    )}
                  </Button>
                  {c.roteiro && (
                    <Button variant="outline" onClick={c.handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Novo Roteiro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {c.roteiro && (
              <RoteiroResults
                roteiro={c.roteiro}
                slideDataList={c.slideDataList}
                warnings={c.warnings}
                quality={c.quality}
                nutrologaReview={c.nutrologaReview}
                visualQuality={c.visualQuality}
                visualStyle={c.visualStyle}
                viewMode={c.viewMode}
                onViewModeChange={c.setViewMode}
                feedback={c.feedback}
                onFeedbackChange={c.setFeedback}
                rewriteLoading={c.rewriteLoading}
                onRewrite={c.handleRewrite}
                brandName={c.profile?.nome}
                brandHandle={c.profile?.bio_instagram}
                doctorImageUrl={c.profile?.foto_url}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrossel;
