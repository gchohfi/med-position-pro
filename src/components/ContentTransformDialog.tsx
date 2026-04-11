import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Film, MessageSquare, Layers, Type,
  Crown, Heart, Zap, AlignLeft, Check, Loader2,
  ChevronRight,
} from "lucide-react";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import { PRESET_LIST, getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";

/* ── Transform formats ────────────────────────── */

const TRANSFORMS = [
  { id: "stories", label: "Stories", icon: Layers, desc: "Sequência de 5-8 stories interativos" },
  { id: "reel", label: "Reels", icon: Film, desc: "Roteiro de 30-60s com cortes" },
  { id: "legenda_alternativa", label: "Legenda Alt.", icon: AlignLeft, desc: "Ângulo diferente para o mesmo conteúdo" },
  { id: "post_unico", label: "Post Único", icon: Type, desc: "Uma imagem estática com legenda" },
  { id: "thread", label: "Thread", icon: MessageSquare, desc: "5-7 posts curtos em sequência" },
  { id: "versao_premium", label: "Premium", icon: Crown, desc: "Mais sofisticada e autoritativa" },
  { id: "versao_humana", label: "Humana", icon: Heart, desc: "Mais próxima e pessoal" },
  { id: "versao_engajadora", label: "Engajadora", icon: Zap, desc: "Hooks mais fortes e interação" },
] as const;

/* ── Props ────────────────────────────────────── */

interface ContentTransformDialogProps {
  sourceId: string;
  sourceTitle: string;
  sourceContent: any;
  strategicInput: any;
  originalPreset: string | null;
  children: React.ReactNode;
  onTransformComplete?: () => void;
}

/* ── Component ────────────────────────────────── */

export default function ContentTransformDialog({
  sourceId,
  sourceTitle,
  sourceContent,
  strategicInput,
  originalPreset,
  children,
  onTransformComplete,
}: ContentTransformDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [overridePreset, setOverridePreset] = useState<string>(originalPreset || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const reset = () => {
    setSelectedFormat(null);
    setResult(null);
    setOverridePreset(originalPreset || "");
  };

  const handleTransform = async () => {
    if (!selectedFormat) return;
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? key;

      const res = await fetch(`${supabaseUrl}/functions/v1/transform-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: key,
        },
        body: JSON.stringify({
          format: selectedFormat,
          source_content: sourceContent,
          strategic_input: strategicInput,
          benchmark_preset: overridePreset || originalPreset,
          source_id: sourceId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      setResult(data.result);
      toast.success("Transformação concluída e salva!");
      onTransformComplete?.();
    } catch (err: any) {
      toast.error(err.message || "Erro na transformação.");
    } finally {
      setLoading(false);
    }
  };

  const formatInfo = TRANSFORMS.find((t) => t.id === selectedFormat);
  const presetInfo = overridePreset ? getPreset(overridePreset as BenchmarkPresetId) : null;
  const origPresetInfo = originalPreset ? getPreset(originalPreset as BenchmarkPresetId) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-accent" />
            Transformar conteúdo
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            A partir de: <strong>{sourceTitle}</strong>
            {origPresetInfo && (
              <Badge variant="secondary" className="ml-2 text-[9px]">
                {origPresetInfo.icon} {origPresetInfo.label}
              </Badge>
            )}
          </p>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5 pt-2">
            {/* Format selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRANSFORMS.map((t) => {
                const Icon = t.icon;
                const active = selectedFormat === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedFormat(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      active
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border hover:border-accent/20"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected format description */}
            <AnimatePresence>
              {formatInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/50 rounded-xl p-3"
                >
                  <p className="text-xs text-foreground font-medium">{formatInfo.label}</p>
                  <p className="text-[11px] text-muted-foreground">{formatInfo.desc}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Override preset */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Benchmark preset</label>
              <Select value={overridePreset} onValueChange={setOverridePreset}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Manter original" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.icon} {p.label}
                      {p.id === originalPreset && " (original)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {overridePreset && overridePreset !== originalPreset && (
                <p className="text-[10px] text-accent">
                  ↳ Preset diferente do original — o tom será adaptado.
                </p>
              )}
            </div>

            {/* Generate */}
            <Button
              onClick={handleTransform}
              disabled={!selectedFormat || loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Transformando...
                </>
              ) : (
                <>
                  Transformar em {formatInfo?.label || "..."}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        ) : (
          /* ── Result ──────────────────── */
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">
                {formatInfo?.label} gerado com sucesso
              </span>
              {presetInfo && (
                <Badge variant="secondary" className="text-[9px]">
                  {presetInfo.icon} {presetInfo.label}
                </Badge>
              )}
            </div>

            {result.strategy_note && (
              <div className="bg-accent/5 border border-accent/15 rounded-xl p-3">
                <p className="text-[10px] font-medium text-accent mb-1">Nota estratégica</p>
                <p className="text-xs text-muted-foreground">{result.strategy_note}</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-4 max-h-[40vh] overflow-y-auto">
              <ResultRenderer format={selectedFormat!} result={result} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Nova transformação
              </Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground"
                onClick={() => { setOpen(false); reset(); }}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Result renderer ──────────────────────────── */

function ResultRenderer({ format, result }: { format: string; result: any }) {
  if (format === "stories" && result.stories) {
    return (
      <div className="space-y-3">
        {result.stories.map((s: any, i: number) => (
          <div key={i} className="border-l-2 border-accent/30 pl-3">
            <p className="text-[10px] text-accent font-medium mb-0.5">
              Story {s.story_number || i + 1} — {s.type}
            </p>
            <p className="text-xs text-foreground">{s.content}</p>
            {s.visual_cue && <p className="text-[10px] text-muted-foreground mt-0.5">🎨 {s.visual_cue}</p>}
            {s.interaction && <p className="text-[10px] text-accent/70 mt-0.5">💬 {s.interaction}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (format === "reel") {
    return (
      <div className="space-y-3">
        {result.hook && (
          <div className="bg-accent/5 rounded-lg p-2">
            <p className="text-[10px] font-medium text-accent">Hook ({result.duration_estimate})</p>
            <p className="text-xs">{result.hook.text}</p>
          </div>
        )}
        {result.sections?.map((s: any, i: number) => (
          <div key={i} className="border-l-2 border-border pl-3">
            <p className="text-[10px] text-muted-foreground">{s.section} — {s.duration}</p>
            <p className="text-xs">{s.text}</p>
            {s.on_screen_text && <p className="text-[10px] text-accent/70">📝 {s.on_screen_text}</p>}
          </div>
        ))}
        {result.cta && (
          <div className="bg-accent/5 rounded-lg p-2">
            <p className="text-[10px] font-medium text-accent">CTA</p>
            <p className="text-xs">{result.cta.text}</p>
          </div>
        )}
        {result.caption && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">Legenda</p>
            <p className="text-xs">{result.caption}</p>
          </div>
        )}
      </div>
    );
  }

  if (format === "thread" && result.posts) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium">{result.thread_title}</p>
        {result.posts.map((p: any, i: number) => (
          <div key={i} className="border-l-2 border-accent/30 pl-3">
            <p className="text-[10px] text-muted-foreground">{p.emoji} Post {p.post_number || i + 1}</p>
            <p className="text-xs">{p.content}</p>
          </div>
        ))}
      </div>
    );
  }

  if ((format === "versao_premium" || format === "versao_humana" || format === "versao_engajadora") && result.slides) {
    return (
      <div className="space-y-3">
        {result.slides.map((s: any, i: number) => (
          <div key={i} className="border-l-2 border-accent/30 pl-3">
            <p className="text-[10px] text-accent font-medium">Slide {s.numero || i + 1} — {s.papel}</p>
            <p className="text-xs font-medium">{s.titulo}</p>
            <p className="text-xs text-muted-foreground">{s.corpo}</p>
            {s.nota_visual && <p className="text-[10px] text-muted-foreground/70 mt-0.5">🎨 {s.nota_visual}</p>}
          </div>
        ))}
        {result.legenda && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">Legenda</p>
            <p className="text-xs">{result.legenda}</p>
          </div>
        )}
      </div>
    );
  }

  // Generic: legenda_alternativa, post_unico
  return (
    <div className="space-y-3">
      {result.angle && <p className="text-xs text-accent italic">{result.angle}</p>}
      {result.headline && <p className="text-sm font-semibold">{result.headline}</p>}
      {result.subheadline && <p className="text-xs text-muted-foreground">{result.subheadline}</p>}
      {result.hook && typeof result.hook === "string" && (
        <p className="text-xs font-medium">{result.hook}</p>
      )}
      {result.body && <p className="text-xs whitespace-pre-line">{result.body}</p>}
      {result.caption && (
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-1">Legenda</p>
          <p className="text-xs whitespace-pre-line">{result.caption}</p>
        </div>
      )}
      {result.cta && typeof result.cta === "string" && (
        <div className="bg-accent/5 rounded-lg p-2">
          <p className="text-[10px] font-medium text-accent">CTA</p>
          <p className="text-xs">{result.cta}</p>
        </div>
      )}
      {result.visual_direction && (
        <p className="text-[10px] text-muted-foreground">🎨 {result.visual_direction}</p>
      )}
      {result.hashtags && (
        <div className="flex flex-wrap gap-1">
          {result.hashtags.map((h: string, i: number) => (
            <Badge key={i} variant="outline" className="text-[9px]">{h}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
