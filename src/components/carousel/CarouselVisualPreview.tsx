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
  Palette,
  Columns2,
  Eye,
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
  brandColors,
  brandName,
  brandHandle,
  archetype,
  contentType,
  doctorImageUrl,
  visualStyle,
  contentOutputId,
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

        // 1. Gerar PNG
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

        // 2. Download local (sempre executa)
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

        // 3. Upload para Storage (isolado)
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

      // 4. Persistir URLs em content_outputs
      if (contentOutputId && uploadedUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("content_outputs")
          .update({ carousel_slide_urls: uploadedUrls } as any)
          .eq("id", contentOutputId);
        if (updateError) {
          console.warn("Erro ao salvar URLs no content_outputs:", updateError);
        }
      }

      // 5. Toast com 3 variantes
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-card rounded-2xl border border-accent/15 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-accent/5 px-6 py-4 flex items-center justify-between border-b border-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            Carrossel visual
          </h3>
          <span className="text-xs text-muted-foreground">
            {slides.length} slides · 1080×1350
          </span>
        </div>
        {/* Visual style toggle */}
        <div className="flex items-center gap-1.5 ml-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          {(Object.keys(VISUAL_SYSTEMS) as ArchetypeStyle[]).map((key) => (
            <button
              key={key}
              onClick={() => setStyleOverride(key)}
              title={VISUAL_SYSTEMS[key].description}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all ${
                activeStyle === key
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {VISUAL_SYSTEMS[key].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regerar
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="p-6">
        {/* Current slide preview (scaled down) */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={`relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center ${
              expanded ? "w-full" : ""
            }`}
            style={{
              maxWidth: expanded ? "100%" : 400,
              margin: "0 auto",
            }}
          >
            {/* Scaled preview */}
            <div
              style={{
                width: expanded ? 540 : 320,
                height: expanded ? 675 : 400,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  transform: expanded ? "scale(0.5)" : "scale(0.2963)",
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

            {/* Nav arrows */}
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((p) => p - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1.5 hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
            )}
            {currentSlide < slides.length - 1 && (
              <button
                onClick={() => setCurrentSlide((p) => p + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1.5 hover:bg-background transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            )}

            {/* Expand/collapse */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1.5 hover:bg-background transition-colors"
            >
              {expanded ? (
                <Minimize2 className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 text-foreground" />
              )}
            </button>
          </div>

          {/* Slide dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide
                    ? "w-6 bg-accent"
                    : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          {/* Slide info + edit button */}
          <div className="text-center flex flex-col items-center gap-2">
            <div>
              <p className="text-xs font-medium text-accent uppercase tracking-wide">
                {slides[currentSlide]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Slide {currentSlide + 1} de {slides.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingIndex(editingIndex === currentSlide ? null : currentSlide)}
              className="text-xs h-7 gap-1.5"
            >
              <Pencil className="h-3 w-3" />
              {editingIndex === currentSlide ? "Fechar editor" : "Editar texto"}
            </Button>
          </div>

          {/* Inline slide editor */}
          {editingIndex === currentSlide && (
            <SlideEditor
              slide={slides[currentSlide]}
              onSave={(updated) => handleSlideEdit(currentSlide, updated)}
              onCancel={() => setEditingIndex(null)}
            />
          )}
        </div>

        {/* Slide thumbnails */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentSlide
                  ? "border-accent shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              style={{ width: 64, height: 80 }}
            >
              <div
                style={{
                  width: 64,
                  height: 80,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    transform: "scale(0.0593)",
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
          <Button
            onClick={() => exportSlide(currentSlide)}
            variant="outline"
            className="rounded-xl text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar slide atual
          </Button>
          <Button
            onClick={exportAll}
            disabled={exporting}
            className="rounded-xl text-sm bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            {exporting ? "Exportando e salvando na nuvem…" : "Baixar e salvar na nuvem (PNG)"}
          </Button>
        </div>
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
