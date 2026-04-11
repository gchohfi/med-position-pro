import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Info } from "lucide-react";
import SlideRenderer, { type SlideData, type ArchetypeStyle } from "./SlideRenderer";
import {
  BENCHMARK_PRESETS,
  PRESET_LIST,
  comparePresets,
  type BenchmarkPresetId,
  type BenchmarkPreset,
} from "@/lib/benchmark-presets";
import { useIsMobile } from "@/hooks/use-mobile";

interface BenchmarkCompareModeProps {
  slides: SlideData[];
  currentSlide: number;
  onSlideChange: (i: number) => void;
  brandName?: string;
  brandHandle?: string;
  doctorImageUrl?: string;
  onSelectPreset: (id: BenchmarkPresetId) => void;
  activePresetId?: BenchmarkPresetId;
}

const PresetPicker: React.FC<{
  label: string;
  selected: BenchmarkPresetId;
  onChange: (id: BenchmarkPresetId) => void;
  exclude?: BenchmarkPresetId;
}> = ({ label, selected, onChange, exclude }) => (
  <div className="space-y-1.5">
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_LIST.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`h-8 px-3 rounded-lg text-xs font-medium transition-all border ${
            selected === p.id
              ? "bg-foreground text-background border-foreground shadow-sm"
              : p.id === exclude
              ? "bg-muted/30 text-muted-foreground/50 border-transparent cursor-not-allowed"
              : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
          }`}
          disabled={p.id === exclude}
        >
          <span className="mr-1">{p.icon}</span>
          {p.label}
        </button>
      ))}
    </div>
  </div>
);

const PresetColumn: React.FC<{
  preset: BenchmarkPreset;
  slide: SlideData;
  brandName?: string;
  brandHandle?: string;
  doctorImageUrl?: string;
  side: "A" | "B";
  onSelect: () => void;
  isActive: boolean;
}> = ({ preset, slide, brandName, brandHandle, doctorImageUrl, side, onSelect, isActive }) => (
  <div className="flex flex-col gap-3 flex-1 min-w-0">
    {/* Preset header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{preset.icon}</span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{preset.label}</h4>
          <p className="text-[11px] text-muted-foreground truncate">{preset.tagline}</p>
        </div>
      </div>
      {isActive && (
        <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
          <Check className="h-2.5 w-2.5" /> Ativo
        </Badge>
      )}
    </div>

    {/* Visual preview */}
    <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
      <div className="w-full" style={{ aspectRatio: "1080/1350", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            transform: "scale(0.25)",
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
          }}
        >
          <SlideRenderer
            slide={slide}
            visualSystem={preset.preferredVisualStyle as ArchetypeStyle}
            brandName={brandName}
            brandHandle={brandHandle}
            doctorImageUrl={doctorImageUrl}
          />
        </div>
      </div>
    </div>

    {/* Metadata chips */}
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground">
        Tom: {preset.behavior.hookStyle}
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground">
        CTA: {preset.behavior.ctaStyle}
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground">
        Texto: {preset.behavior.textDensity}
      </span>
    </div>

    {/* CTA */}
    <Button
      onClick={onSelect}
      variant={isActive ? "secondary" : "default"}
      size="sm"
      className="w-full text-xs h-9 rounded-lg"
      disabled={isActive}
    >
      {isActive ? (
        <>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Direção ativa
        </>
      ) : (
        <>
          <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
          Usar esta direção
        </>
      )}
    </Button>
  </div>
);

const BenchmarkCompareMode: React.FC<BenchmarkCompareModeProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  brandName,
  brandHandle,
  doctorImageUrl,
  onSelectPreset,
  activePresetId,
}) => {
  const isMobile = useIsMobile();
  const [presetA, setPresetA] = useState<BenchmarkPresetId>(activePresetId || "impacto_viral");
  const [presetB, setPresetB] = useState<BenchmarkPresetId>(
    activePresetId === "autoridade_premium" ? "educacao_sofisticada" : "autoridade_premium"
  );
  const [mobileTab, setMobileTab] = useState<"A" | "B">("A");

  const pA = BENCHMARK_PRESETS[presetA];
  const pB = BENCHMARK_PRESETS[presetB];
  const traits = comparePresets(pA, pB);
  const slide = slides[currentSlide];

  if (!slide) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5"
    >
      {/* Preset selectors */}
      <div className="grid grid-cols-2 gap-4">
        <PresetPicker label="Direção A" selected={presetA} onChange={setPresetA} />
        <PresetPicker label="Direção B" selected={presetB} onChange={setPresetB} />
      </div>

      {presetA === presetB && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Selecione presets diferentes para uma comparação útil.
          </p>
        </div>
      )}

      {/* Side-by-side preview */}
      {isMobile ? (
        /* Mobile: tabs */
        <div className="space-y-3">
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(["A", "B"] as const).map((side) => {
              const p = side === "A" ? pA : pB;
              return (
                <button
                  key={side}
                  onClick={() => setMobileTab(side)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    mobileTab === side
                      ? "bg-foreground text-background"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              );
            })}
          </div>
          <PresetColumn
            preset={mobileTab === "A" ? pA : pB}
            slide={slide}
            brandName={brandName}
            brandHandle={brandHandle}
            doctorImageUrl={doctorImageUrl}
            side={mobileTab}
            onSelect={() => onSelectPreset(mobileTab === "A" ? presetA : presetB)}
            isActive={(mobileTab === "A" ? presetA : presetB) === activePresetId}
          />
        </div>
      ) : (
        /* Desktop: side by side */
        <div className="flex gap-5">
          <PresetColumn
            preset={pA}
            slide={slide}
            brandName={brandName}
            brandHandle={brandHandle}
            doctorImageUrl={doctorImageUrl}
            side="A"
            onSelect={() => onSelectPreset(presetA)}
            isActive={presetA === activePresetId}
          />
          <div className="w-px bg-border shrink-0" />
          <PresetColumn
            preset={pB}
            slide={slide}
            brandName={brandName}
            brandHandle={brandHandle}
            doctorImageUrl={doctorImageUrl}
            side="B"
            onSelect={() => onSelectPreset(presetB)}
            isActive={presetB === activePresetId}
          />
        </div>
      )}

      {/* Slide dots */}
      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => onSlideChange(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentSlide
                ? "w-5 bg-foreground"
                : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Strategic comparison table */}
      {presetA !== presetB && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground">Comparação editorial</h4>
          </div>
          <div className="divide-y divide-border/30">
            {traits.map((t) => (
              <div key={t.label} className="grid grid-cols-[1fr_1fr_1fr] text-[11px] px-4 py-2 items-center gap-2">
                <span className="text-muted-foreground font-medium">{t.label}</span>
                <span className="text-foreground capitalize">{t.presetA}</span>
                <span className="text-foreground capitalize">{t.presetB}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info about editing */}
      <p className="text-[11px] text-muted-foreground/70 text-center">
        A edição de slides fica disponível no modo de visualização normal.
      </p>
    </motion.div>
  );
};

export default BenchmarkCompareMode;
