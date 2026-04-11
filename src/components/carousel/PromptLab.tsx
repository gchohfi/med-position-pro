/**
 * Prompt Lab — Creative laboratory for carousel variations.
 * Generates 2-4 strategic interpretations of the same briefing.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FlaskConical,
  Sparkles,
  Check,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { PRESET_LIST, getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";
import { avaliarQualidadeRoteiro, type TravessIARoteiro, travessiaToSlideData } from "@/types/carousel";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import SlideRenderer, { type ArchetypeStyle } from "@/components/carousel/SlideRenderer";

/* ── Variation axis config ────────────────── */

export interface VariationAxis {
  presetId: BenchmarkPresetId;
  hookIntensity: number;    // 1-5
  didatismo: number;        // 1-5
  sofisticacao: number;     // 1-5
}

export interface LabVariation {
  axis: VariationAxis;
  roteiro: TravessIARoteiro;
  slides: SlideData[];
  qualityScore: number;
  summary: string;
}

interface PromptLabProps {
  onGenerate: (axes: VariationAxis[]) => Promise<TravessIARoteiro[]>;
  onSelectVariation: (variation: LabVariation) => void;
  loading?: boolean;
  brandName?: string;
  brandHandle?: string;
  doctorImageUrl?: string;
}

const DEFAULT_AXES: VariationAxis[] = [
  { presetId: "autoridade_premium", hookIntensity: 3, didatismo: 3, sofisticacao: 5 },
  { presetId: "impacto_viral", hookIntensity: 5, didatismo: 2, sofisticacao: 3 },
];

const intensityLabels = ["", "Sutil", "Leve", "Médio", "Alto", "Máximo"];
const hookIcons = ["", "🌊", "🌤️", "⚡", "🔥", "💥"];

const PromptLab: React.FC<PromptLabProps> = ({
  onGenerate,
  onSelectVariation,
  loading = false,
  brandName,
  brandHandle,
  doctorImageUrl,
}) => {
  const [axes, setAxes] = useState<VariationAxis[]>(DEFAULT_AXES);
  const [variations, setVariations] = useState<LabVariation[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const variationCount = axes.length;

  const addAxis = () => {
    if (axes.length >= 4) return;
    const available = PRESET_LIST.find(
      (p) => !axes.some((a) => a.presetId === p.id)
    );
    setAxes([
      ...axes,
      {
        presetId: (available?.id ?? "educacao_sofisticada") as BenchmarkPresetId,
        hookIntensity: 3,
        didatismo: 3,
        sofisticacao: 3,
      },
    ]);
  };

  const removeAxis = (idx: number) => {
    if (axes.length <= 2) return;
    setAxes(axes.filter((_, i) => i !== idx));
  };

  const updateAxis = (idx: number, patch: Partial<VariationAxis>) => {
    setAxes(axes.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setVariations([]);
    setSelectedIdx(null);
    try {
      const roteiros = await onGenerate(axes);
      const results: LabVariation[] = roteiros.map((r, i) => {
        const slides = r.slides.map((s) => travessiaToSlideData(s, r.slides.length));
        const q = avaliarQualidadeRoteiro(r);
        return {
          axis: axes[i] ?? axes[0],
          roteiro: r,
          slides,
          qualityScore: q.score,
          summary: buildSummary(axes[i] ?? axes[0], r),
        };
      });
      setVariations(results);
    } catch {
      // error handled in parent
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    onSelectVariation(variations[idx]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Prompt Lab
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Teste {variationCount} direções criativas do mesmo briefing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {axes.length < 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addAxis}
              className="text-xs h-7"
            >
              + Variação
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || loading}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 gap-1.5"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Gerando {variationCount} versões…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Gerar variações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Axes configuration */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${variationCount}, 1fr)` }}>
        {axes.map((axis, i) => {
          const preset = getPreset(axis.presetId);
          return (
            <div
              key={i}
              className="bg-card rounded-xl border border-border/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-xs font-semibold text-foreground">
                    Variação {String.fromCharCode(65 + i)}
                  </span>
                </div>
                {axes.length > 2 && (
                  <button
                    onClick={() => removeAxis(i)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Preset selector */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Preset</Label>
                <Select
                  value={axis.presetId}
                  onValueChange={(v) => updateAxis(i, { presetId: v as BenchmarkPresetId })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_LIST.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hook intensity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">Intensidade do gancho</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {hookIcons[axis.hookIntensity]} {intensityLabels[axis.hookIntensity]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[axis.hookIntensity]}
                  onValueChange={([v]) => updateAxis(i, { hookIntensity: v })}
                  className="py-1"
                />
              </div>

              {/* Didatismo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">Didatismo</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {intensityLabels[axis.didatismo]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[axis.didatismo]}
                  onValueChange={([v]) => updateAxis(i, { didatismo: v })}
                  className="py-1"
                />
              </div>

              {/* Sofisticação */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">Sofisticação</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {intensityLabels[axis.sofisticacao]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[axis.sofisticacao]}
                  onValueChange={([v]) => updateAxis(i, { sofisticacao: v })}
                  className="py-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Generating state */}
      {generating && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">
            Gerando {variationCount} interpretações criativas…
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Cada variação aplica um eixo estratégico diferente ao mesmo briefing
          </p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {variations.length > 0 && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-foreground">
                {variations.length} variações geradas
              </h4>
              <span className="text-[11px] text-muted-foreground">
                — escolha a que melhor se encaixa
              </span>
            </div>

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${variations.length}, 1fr)` }}
            >
              {variations.map((v, i) => {
                const preset = getPreset(v.axis.presetId);
                const isSelected = selectedIdx === i;
                const style = preset.preferredVisualStyle as ArchetypeStyle;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-card rounded-xl border overflow-hidden transition-all ${
                      isSelected
                        ? "border-accent shadow-md ring-1 ring-accent/20"
                        : "border-border/60 hover:border-accent/30"
                    }`}
                  >
                    {/* Mini preview */}
                    <div className="relative bg-muted/20 flex items-center justify-center p-3">
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{ width: 140, height: 175, position: "relative" }}
                      >
                        <div
                          style={{
                            transform: "scale(0.1296)",
                            transformOrigin: "top left",
                            position: "absolute",
                            top: 0,
                            left: 0,
                          }}
                        >
                          <SlideRenderer
                            slide={v.slides[0]}
                            visualSystem={style}
                            brandName={brandName}
                            brandHandle={brandHandle}
                            doctorImageUrl={doctorImageUrl}
                          />
                        </div>
                      </div>
                      {/* Quality badge */}
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 text-[10px] font-mono"
                      >
                        {v.qualityScore}/100
                      </Badge>
                    </div>

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{preset.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-foreground truncate">
                            {v.roteiro.titulo_carrossel}
                          </h5>
                          <p className="text-[10px] text-muted-foreground">
                            {preset.label} · {v.slides.length} slides
                          </p>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {v.summary}
                      </p>

                      {/* Axis badges */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[9px] h-5">
                          {hookIcons[v.axis.hookIntensity]} Gancho {intensityLabels[v.axis.hookIntensity]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-5">
                          {preset.behavior.ctaStyle}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-5">
                          {preset.behavior.textDensity}
                        </Badge>
                      </div>

                      {/* CTA */}
                      {v.roteiro.cta_final && (
                        <p className="text-[10px] text-accent italic truncate">
                          "{v.roteiro.cta_final}"
                        </p>
                      )}

                      {/* Action */}
                      <Button
                        onClick={() => handleSelect(i)}
                        size="sm"
                        className={`w-full h-8 text-xs gap-1.5 ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted/50 text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3" />
                            Selecionada
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            Usar esta versão
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {variations.length === 0 && !generating && (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground/70">
            Configure os eixos acima e gere para comparar direções criativas
          </p>
        </div>
      )}
    </motion.div>
  );
};

/* ── Helpers ───────────────────────────── */

function buildSummary(axis: VariationAxis, roteiro: TravessIARoteiro): string {
  const preset = getPreset(axis.presetId);
  const hookLabel = axis.hookIntensity >= 4 ? "gancho forte" : axis.hookIntensity >= 3 ? "gancho equilibrado" : "gancho sutil";
  const toneLabel = preset.behavior.editorialTone.split(".")[0].toLowerCase();
  return `${toneLabel}. ${hookLabel}, densidade ${preset.behavior.textDensity}. ${roteiro.slides.length} slides.`;
}

export default PromptLab;
