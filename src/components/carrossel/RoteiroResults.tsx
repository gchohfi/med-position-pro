import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, FileText, Loader2, RefreshCw } from "lucide-react";
import type {
  TravessIARoteiro,
  CarouselQualityReport,
  NutrologaReviewReport,
  VisualQualityReport,
  PreferredVisualStyle,
} from "@/types/carousel";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";

interface RoteiroResultsProps {
  roteiro: TravessIARoteiro;
  slideDataList: SlideData[];
  warnings: string[];
  quality: CarouselQualityReport | null;
  nutrologaReview: NutrologaReviewReport | null;
  visualQuality: VisualQualityReport | null;
  visualStyle: PreferredVisualStyle;
  viewMode: "texto" | "visual";
  onViewModeChange: (mode: "texto" | "visual") => void;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  rewriteLoading: boolean;
  onRewrite: () => void;
  brandName?: string;
  brandHandle?: string;
  doctorImageUrl?: string;
}

const RoteiroResults: React.FC<RoteiroResultsProps> = ({
  roteiro,
  slideDataList,
  warnings,
  quality,
  nutrologaReview,
  visualQuality,
  visualStyle,
  viewMode,
  onViewModeChange,
  feedback,
  onFeedbackChange,
  rewriteLoading,
  onRewrite,
  brandName,
  brandHandle,
  doctorImageUrl,
}) => {
  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3 space-y-1">
            <p className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avisos de validacao ({warnings.length})
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 ml-6">
                {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quality score */}
      {quality && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Qualidade estimada do carrossel</p>
              <Badge variant={quality.score >= 85 ? "default" : quality.score >= 70 ? "secondary" : "destructive"}>
                {quality.score}/100 · {quality.summary}
              </Badge>
            </div>
            {quality.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Pontos fortes</p>
                {quality.strengths.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                ))}
              </div>
            )}
            {quality.improvements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Melhorias sugeridas</p>
                {quality.improvements.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nutrologa review */}
      {nutrologaReview && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Simulacao: revisao de uma nutrologa</p>
              <Badge variant={nutrologaReview.parecer === "aprovado" ? "default" : "secondary"}>
                {nutrologaReview.parecer === "aprovado" ? "Aprovado para teste" : "Ajustar antes de publicar"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">• {nutrologaReview.headlineFeedback}</p>
            <p className="text-xs text-muted-foreground">• {nutrologaReview.scientificFeedback}</p>
            <p className="text-xs text-muted-foreground">• {nutrologaReview.practicalFeedback}</p>
            <p className="text-xs text-muted-foreground">• {nutrologaReview.ctaFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Visual anti-mediocrity */}
      {visualQuality && visualQuality.issues.length > 0 && (
        <Card className={`border-l-4 ${
          visualQuality.verdict === "premium" ? "border-l-emerald-500" :
          visualQuality.verdict === "bom" ? "border-l-blue-500" :
          visualQuality.verdict === "morno" ? "border-l-amber-500" : "border-l-red-500"
        }`}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Avaliacao Visual
              </p>
              <Badge variant={visualQuality.score >= 75 ? "default" : visualQuality.score >= 55 ? "secondary" : "destructive"}>
                {visualQuality.score}/100 · {visualQuality.verdict}
              </Badge>
            </div>
            {visualQuality.issues.filter(i => i.severity === "error").map((issue, idx) => (
              <p key={`e-${idx}`} className="text-xs text-red-600 dark:text-red-400 ml-1">
                {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                <span className="block text-muted-foreground mt-0.5 ml-2">{"\u2192"} {issue.suggestion}</span>
              </p>
            ))}
            {visualQuality.issues.filter(i => i.severity === "warning").map((issue, idx) => (
              <p key={`w-${idx}`} className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                <span className="block text-muted-foreground mt-0.5 ml-2">{"\u2192"} {issue.suggestion}</span>
              </p>
            ))}
            {visualQuality.issues.filter(i => i.severity === "opportunity").map((issue, idx) => (
              <p key={`o-${idx}`} className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                <span className="block text-muted-foreground mt-0.5 ml-2">{"\u2192"} {issue.suggestion}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Roteiro header */}
      <Card>
        <CardHeader>
          <CardTitle>{roteiro.titulo_carrossel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Tese:</strong> {roteiro.tese}
          </p>
          {roteiro.jornada && (
            <p className="text-sm text-muted-foreground">
              <strong>Jornada:</strong> {roteiro.jornada}
            </p>
          )}
        </CardContent>
      </Card>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "texto" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("texto")}
        >
          <FileText className="h-4 w-4 mr-1" />
          Texto
        </Button>
        <Button
          variant={viewMode === "visual" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("visual")}
        >
          <Eye className="h-4 w-4 mr-1" />
          Visual
        </Button>
      </div>

      {/* Text view */}
      {viewMode === "texto" && (
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
                      {slide.layout}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">
                      {slide.headline ||
                        slide.mini_titulo ||
                        slide.big_text ||
                        slide.turn_text ||
                        slide.conclusion ||
                        `Slide ${slide.numero}`}
                    </h4>
                    {slide.texto && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {slide.texto}
                      </p>
                    )}
                    {slide.opinion && (
                      <p className="text-sm text-muted-foreground italic">
                        {slide.opinion}
                      </p>
                    )}
                    {slide.stat_number && (
                      <p className="text-sm font-mono">
                        {slide.stat_number}
                        {slide.stat_unit && ` ${slide.stat_unit}`}
                      </p>
                    )}
                    {slide.e_dai && (
                      <p className="text-xs text-muted-foreground">
                        E dai: {slide.e_dai}
                      </p>
                    )}
                    {slide.pergunta_comentario && (
                      <p className="text-xs italic text-muted-foreground/70">
                        Pergunta: {slide.pergunta_comentario}
                      </p>
                    )}
                    {slide.img_query && (
                      <p className="text-xs italic text-muted-foreground/70">
                        Imagem: {slide.img_query}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Visual view */}
      {viewMode === "visual" && slideDataList.length > 0 && (
        <CarouselVisualPreview
          slides={slideDataList}
          brandName={brandName}
          brandHandle={brandHandle}
          doctorImageUrl={doctorImageUrl}
          visualStyle={visualStyle}
        />
      )}

      {/* Feedback / Rewrite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reescrever Roteiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="O que quer mudar no roteiro? Ex: Menos slides, tom mais informal, trocar o gancho..."
            rows={3}
          />
          <Button
            onClick={onRewrite}
            disabled={rewriteLoading || !feedback.trim()}
            variant="secondary"
          >
            {rewriteLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reescrevendo...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reescrever com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Legenda / Hashtags */}
      {roteiro.legenda && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legenda e Hashtags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">{roteiro.legenda}</p>
            {roteiro.hashtags && (
              <div className="flex flex-wrap gap-1">
                {roteiro.hashtags.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h.startsWith("#") ? h : `#${h}`}
                  </Badge>
                ))}
              </div>
            )}
            {roteiro.cta_final && (
              <p className="text-sm">
                <strong>CTA Final:</strong> {roteiro.cta_final}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoteiroResults;
