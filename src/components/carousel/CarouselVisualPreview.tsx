import React, { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  Pencil,
  ChevronRight,
  Download,
  Cloud,
  Maximize2,
  Minimize2,
  Loader2,
  X,
  RefreshCw,
  Columns2,
  Eye,
  Check,
} from "lucide-react";
import SlideRenderer, { type SlideData, type ArchetypeStyle, VISUAL_SYSTEMS } from "./SlideRenderer";
import SlideEditor from "./SlideEditor";
import BenchmarkCompareMode from "./BenchmarkCompareMode";
import type { BenchmarkPresetId } from "@/lib/benchmark-presets";

/** Convert a data-URL to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface CarouselVisualPreviewProps {
  slides: SlideData[];
  brandColors?: { bg: string; text: string; accent: string };
  brandName?: string;
  brandHandle?: string;
  archetype?: string | null;
  contentType?: string;
  doctorImageUrl?: string;
  visualStyle?: ArchetypeStyle;
  contentOutputId?: string | null;
  activePresetId?: BenchmarkPresetId;
  onPresetChange?: (id: BenchmarkPresetId) => void;
  onRegenerate?: () => void;
  onClose?: () => void;
  onSlidesChange?: (slides: SlideData[]) => void;
}

const CAROUSEL_LOADING_MESSAGES = [
  "Estruturando layout visual…",
  "Aplicando direção estética…",
  "Gerando slides…",
];

const CarouselVisualPreview: React.FC<CarouselVisualPreviewProps> = ({
  slides,
  brandName,
  brandHandle,
  contentType,
  doctorImageUrl,
  visualStyle,
  contentOutputId,
  activePresetId,
  onPresetChange,
  onRegenerate,
  onClose,
  onSlidesChange,
}) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [styleOverride, setStyleOverride] = useState<ArchetypeStyle | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [exportedSlide, setExportedSlide] = useState<number | null>(null);
  const activeStyle: ArchetypeStyle = styleOverride ?? visualStyle ?? "editorial_black_gold";

  const handleSlideEdit = (index: number, updated: SlideData) => {
    const newSlides = [...slides];
    newSlides[index] = updated;
    onSlidesChange?.(newSlides);
    setEditingIndex(null);
  };
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const exportSlide = useCallback(
    async (index: number) => {
      const el = slideRefs.current[index];
      if (!el) return;
      try {
        const dataUrl = await toPng(el, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          cacheBust: true,
        });
        const link = document.createElement("a");
        link.download = `slide-${index + 1}.png`;
        link.href = dataUrl;
        link.click();
        setExportedSlide(index);
        setTimeout(() => setExportedSlide(null), 2000);
      } catch (err) {
        toast.error("Erro ao exportar slide.");
        console.error(err);
      }
    },
    []
  );

  const exportAll = useCallback(async () => {
    setExporting(true);
    const uploadedUrls: { slide: number; url: string; path: string }[] = [];
    const failedUploads: number[] = [];
    let localDownloadCount = 0;

    try {
      for (let i = 0; i < slides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;

        let dataUrl: string;
        try {
          dataUrl = await toPng(el, {
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            cacheBust: true,
          });
        } catch (pngErr) {
          console.error(`Erro ao gerar PNG do slide ${i + 1}:`, pngErr);
          continue;
        }

        try {
          const link = document.createElement("a");
          link.download = `carrossel-slide-${i + 1}.png`;
          link.href = dataUrl;
          link.click();
          localDownloadCount++;
          await new Promise((r) => setTimeout(r, 300));
        } catch (dlErr) {
          console.warn(`Download local do slide ${i + 1} falhou:`, dlErr);
        }

        if (user) {
          try {
            const blob = dataUrlToBlob(dataUrl);
            const folderKey = contentOutputId ?? `temp-${Date.now()}`;
            const filePath = `${user.id}/carrossel/${folderKey}/slide-${i + 1}.png`;

            const { error: upErr } = await supabase.storage
              .from("user-assets")
              .upload(filePath, blob, { contentType: "image/png", upsert: true });
            if (upErr) throw upErr;

            const { data: publicData } = supabase.storage
              .from("user-assets")
              .getPublicUrl(filePath);

            uploadedUrls.push({ slide: i + 1, url: publicData.publicUrl, path: filePath });

            await supabase.from("uploaded_assets").insert({
              user_id: user.id,
              file_path: filePath,
              file_name: `carrossel-slide-${i + 1}.png`,
              category: "carousel_slide",
              linked_module: "carrossel",
              note: `Slide ${i + 1} do carrossel`,
            });
          } catch (uploadErr) {
            console.warn(`Upload do slide ${i + 1} falhou:`, uploadErr);
            failedUploads.push(i + 1);
          }
        }
      }

      if (contentOutputId && uploadedUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("content_outputs")
          .update({ carousel_slide_urls: uploadedUrls } as any)
          .eq("id", contentOutputId);
        if (updateError) {
          console.warn("Erro ao salvar URLs no content_outputs:", updateError);
        }
      }

      const total = slides.length;
      const saved = uploadedUrls.length;

      if (saved === total) {
        toast.success(`Todos os ${total} slides foram baixados e salvos na nuvem!`);
      } else if (saved > 0) {
        toast.warning(
          `Slides baixados! ${saved} de ${total} foram salvos na nuvem. Falhas nos slides: ${failedUploads.join(", ")}.`
        );
      } else {
        toast.info(
          `${localDownloadCount} slide${localDownloadCount !== 1 ? "s" : ""} baixado${localDownloadCount !== 1 ? "s" : ""} localmente. Não foi possível salvar na nuvem agora.`
        );
      }
    } catch (fatalErr) {
      console.error("Erro fatal no exportAll:", fatalErr);
      toast.error("Erro ao exportar carrossel. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }, [slides.length, user, contentOutputId]);

  const visualSystemEntries = Object.entries(VISUAL_SYSTEMS) as [ArchetypeStyle, typeof VISUAL_SYSTEMS[ArchetypeStyle]][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="overflow-hidden"
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-3 py-1">
            <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wide">
              {slides.length} slides
            </span>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <span className="text-[10px] text-muted-foreground/40">1080×1350</span>
          </div>
          {onPresetChange && (
            <button
              onClick={() => { setCompareMode(!compareMode); setEditingIndex(null); }}
              className={`h-7 px-3 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                compareMode
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {compareMode ? <Eye className="h-3 w-3" /> : <Columns2 className="h-3 w-3" />}
              {compareMode ? "Preview" : "Comparar"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="text-[11px] h-7 text-muted-foreground/40 hover:text-foreground rounded-full px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Regerar
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full text-muted-foreground/30 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Visual Style Selector ── */}
      {!compareMode && (
        <div className="flex items-center gap-1 mb-5">
          {visualSystemEntries.map(([key, sys]) => {
            const isActive = activeStyle === key;
            return (
              <button
                key={key}
                onClick={() => setStyleOverride(key)}
                title={sys.description}
                className={`relative flex items-center gap-2 h-8 px-3.5 rounded-full text-[11px] font-medium transition-all ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20"
                }`}
              >
                {/* Color swatch */}
                <span
                  className="w-2.5 h-2.5 rounded-full border border-border/20 shrink-0"
                  style={{ background: sys.colors.accent }}
                />
                {sys.label}
                {sys.premium && (
                  <span className={`text-[8px] uppercase tracking-wider font-bold ${isActive ? "text-background/60" : "text-accent/40"}`}>
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Preview Area ── */}
      <div>
        <AnimatePresence mode="wait">
          {compareMode && onPresetChange ? (
            <BenchmarkCompareMode
              key="compare"
              slides={slides}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
              brandName={brandName}
              brandHandle={brandHandle}
              doctorImageUrl={doctorImageUrl}
              onSelectPreset={(id) => {
                onPresetChange(id);
                setCompareMode(false);
                toast.success("Direção criativa aplicada.");
              }}
              activePresetId={activePresetId}
            />
          ) : (
            <motion.div key="normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center gap-6">
                {/* ── Hero Preview Frame ── */}
                <div
                  className="relative group"
                  style={{
                    maxWidth: expanded ? "100%" : 480,
                    width: "100%",
                    margin: "0 auto",
                  }}
                >
                  {/* Frame container with subtle shadow */}
                  <div className="rounded-2xl overflow-hidden bg-neutral-950/[0.03] dark:bg-white/[0.02] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)]">
                    <div
                      style={{
                        width: expanded ? 540 : 380,
                        height: expanded ? 675 : 475,
                        overflow: "hidden",
                        position: "relative",
                        margin: "0 auto",
                      }}
                    >
                      <div
                        style={{
                          transform: expanded ? "scale(0.5)" : "scale(0.352)",
                          transformOrigin: "top left",
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                      >
                        <SlideRenderer
                          slide={slides[currentSlide]}
                          visualSystem={activeStyle}
                          brandName={brandName}
                          brandHandle={brandHandle}
                          contentType={contentType}
                          doctorImageUrl={doctorImageUrl}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nav arrows — appear on hover */}
                  {currentSlide > 0 && (
                    <button
                      onClick={() => setCurrentSlide((p) => p - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/95 backdrop-blur-md rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 border border-border/10"
                    >
                      <ChevronLeft className="h-4 w-4 text-foreground" />
                    </button>
                  )}
                  {currentSlide < slides.length - 1 && (
                    <button
                      onClick={() => setCurrentSlide((p) => p + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/95 backdrop-blur-md rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 border border-border/10"
                    >
                      <ChevronRight className="h-4 w-4 text-foreground" />
                    </button>
                  )}

                  {/* Expand toggle — top right, subtle */}
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="absolute top-3 right-3 bg-background/70 backdrop-blur-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background border border-border/10"
                  >
                    {expanded ? (
                      <Minimize2 className="h-3 w-3 text-foreground/70" />
                    ) : (
                      <Maximize2 className="h-3 w-3 text-foreground/70" />
                    )}
                  </button>
                </div>

                {/* ── Slide Indicator ── */}
                <div className="flex flex-col items-center gap-3">
                  {/* Progress dots */}
                  <div className="flex items-center gap-1">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentSlide
                            ? "w-7 h-1.5 bg-accent"
                            : "w-1.5 h-1.5 bg-muted-foreground/10 hover:bg-muted-foreground/25"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Slide info row */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground/30 tabular-nums">
                      {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>
                    <div className="w-px h-3 bg-border/20" />
                    <span className="text-[10px] font-medium text-accent/50 uppercase tracking-[0.15em]">
                      {slides[currentSlide]?.label}
                    </span>
                    <div className="w-px h-3 bg-border/20" />
                    <button
                      onClick={() => setEditingIndex(editingIndex === currentSlide ? null : currentSlide)}
                      className={`text-[10px] font-medium flex items-center gap-1 transition-colors ${
                        editingIndex === currentSlide
                          ? "text-accent"
                          : "text-muted-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <Pencil className="h-2.5 w-2.5" />
                      {editingIndex === currentSlide ? "Fechar" : "Editar"}
                    </button>
                  </div>
                </div>

                {/* ── Inline Editor ── */}
                <AnimatePresence>
                  {editingIndex === currentSlide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-lg overflow-hidden"
                    >
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-4">
                        <SlideEditor
                          slide={slides[currentSlide]}
                          onSave={(updated) => handleSlideEdit(currentSlide, updated)}
                          onCancel={() => setEditingIndex(null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Thumbnail Filmstrip ── */}
              <div className="mt-8 relative">
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                <div className="flex gap-2 overflow-x-auto pb-2 px-2 justify-center scrollbar-none">
                  {slides.map((slide, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`group/thumb flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                        i === currentSlide
                          ? "ring-[1.5px] ring-accent ring-offset-2 ring-offset-background shadow-sm scale-100"
                          : "opacity-30 hover:opacity-70 scale-[0.96] hover:scale-100"
                      }`}
                      style={{ width: 60, height: 75 }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 75,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            transform: "scale(0.0556)",
                            transformOrigin: "top left",
                            position: "absolute",
                            top: 0,
                            left: 0,
                          }}
                        >
                          <SlideRenderer
                            slide={slide}
                            visualSystem={activeStyle}
                            brandName={brandName}
                            brandHandle={brandHandle}
                            contentType={contentType}
                            doctorImageUrl={doctorImageUrl}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Export Actions ── */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-border/10">
                <Button
                  onClick={() => exportSlide(currentSlide)}
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-8 text-muted-foreground/40 hover:text-foreground rounded-full px-4"
                >
                  {exportedSlide === currentSlide ? (
                    <Check className="h-3.5 w-3.5 mr-1.5 text-accent" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {exportedSlide === currentSlide ? "Baixado" : "Slide atual"}
                </Button>
                <div className="w-px h-4 bg-border/15" />
                <Button
                  onClick={exportAll}
                  disabled={exporting}
                  size="sm"
                  className="text-[11px] h-8 bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 shadow-sm"
                >
                  {exporting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Cloud className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {exporting ? "Exportando…" : "Exportar tudo"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden full-size slides for export */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
        aria-hidden
      >
        {slides.map((slide, i) => (
          <SlideRenderer
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            slide={slide}
            visualSystem={activeStyle}
            brandName={brandName}
            brandHandle={brandHandle}
            contentType={contentType}
            doctorImageUrl={doctorImageUrl}
          />
        ))}
      </div>
    </motion.div>
  );
};

export { CAROUSEL_LOADING_MESSAGES };
export default CarouselVisualPreview;
