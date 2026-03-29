import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  Sparkles,
  Copy,
  FileText,
  Video,
  Type,
  Calendar,
  Link2,
  Target,
  Layers,
  Compass,
  BookOpen,
  Megaphone,
  Shuffle,
  Heart,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Image,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ImageUpload from "@/components/ImageUpload";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import { mapContentToSlides } from "@/components/carousel/mapContentToSlides";
import type { SlideData } from "@/components/carousel/SlideRenderer";

const CONTENT_TYPES = [
  { value: "educativo", label: "Educativo", icon: BookOpen, desc: "Ensinar com profundidade" },
  { value: "manifesto", label: "Manifesto", icon: Megaphone, desc: "Defender uma posição" },
  { value: "hibrido", label: "Híbrido", icon: Shuffle, desc: "Educar e posicionar" },
  { value: "conexao", label: "Conexão", icon: Heart, desc: "Aproximar e humanizar" },
  { value: "conversao", label: "Conversão", icon: TrendingUp, desc: "Gerar ação direta" },
];

const OUTPUT_SECTIONS = [
  "Gancho",
  "Quebra de percepção",
  "Explicação / visão",
  "Método / lógica",
  "Manifesto",
  "Fechamento",
];

const LOADING_MESSAGES = [
  "Analisando estratégia…",
  "Definindo estrutura narrativa…",
  "Construindo posicionamento…",
];

interface StrategicContext {
  archetype: string | null;
  macro_objetivo: string | null;
  pillar: string | null;
}

type TransformFormat = "carrossel" | "reels" | "legenda";

interface TransformResult {
  format: TransformFormat;
  data: any;
}

const Producao = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tipo, setTipo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tese, setTese] = useState("");
  const [percepcao, setPercepcao] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [output, setOutput] = useState<Record<string, string> | null>(null);
  const [context, setContext] = useState<StrategicContext>({
    archetype: null,
    macro_objetivo: null,
    pillar: null,
  });
  const [contextLoading, setContextLoading] = useState(true);
  const [transforming, setTransforming] = useState<TransformFormat | null>(null);
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [visualSlides, setVisualSlides] = useState<SlideData[] | null>(null);
  const [generatingVisual, setGeneratingVisual] = useState(false);

  // Load strategic context from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setContextLoading(true);
      try {
        const [posRes, diagRes] = await Promise.all([
          supabase.from("positioning").select("archetype, pillars").eq("user_id", user.id).maybeSingle(),
          supabase.from("diagnosis_outputs").select("estrategia").eq("user_id", user.id).maybeSingle(),
        ]);
        const pos = posRes.data;
        const diag = diagRes.data;
        const estrategia = diag?.estrategia as Record<string, any> | null;
        setContext({
          archetype: pos?.archetype || null,
          macro_objetivo: estrategia?.macro_objetivo || null,
          pillar: pos?.pillars?.[0] || null,
        });
      } catch {
        // ignore
      } finally {
        setContextLoading(false);
      }
    };
    load();
  }, [user]);

  // Pre-fill from query params
  useEffect(() => {
    const obj = searchParams.get("objetivo");
    if (obj) setObjetivo(obj);
  }, [searchParams]);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const allFilled = tipo && objetivo.trim() && tese.trim() && percepcao.trim();

  const handleGenerate = async () => {
    if (!allFilled) return;
    setLoading(true);
    setOutput(null);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ tipo, objetivo, tese, percepcao }),
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
        return;
      }
      if (response.status === 402) {
        toast.error("Créditos esgotados. Adicione créditos para continuar.");
        return;
      }
      if (!response.ok || !response.body) {
        throw new Error("Erro na geração");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const sections: Record<string, string> = {};
      for (let i = 0; i < OUTPUT_SECTIONS.length; i++) {
        const sectionName = OUTPUT_SECTIONS[i];
        const nextSection = OUTPUT_SECTIONS[i + 1];
        const regex = new RegExp(
          `(?:#+\\s*)?${sectionName.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")}[:\\s]*\\n?([\\s\\S]*?)${
            nextSection
              ? `(?=(?:#+\\s*)?${nextSection.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")})`
              : "$"
          }`,
          "i"
        );
        const match = fullContent.match(regex);
        sections[sectionName] = match ? match[1].trim() : "";
      }

      if (Object.values(sections).every((v) => !v)) {
        sections["Gancho"] = fullContent;
      }

      setOutput(sections);

      // Save to DB
      try {
        const { error } = await supabase.from("content_outputs").insert({
          user_id: user!.id,
          content_type: tipo,
          title: tese.slice(0, 120) || objetivo.slice(0, 120),
          strategic_input: { objetivo, tese, percepcao, tipo } as any,
          generated_content: sections as any,
        });
        if (error) console.error("Erro ao salvar:", error);
      } catch {}

      logStrategicEvent(STRATEGIC_EVENTS.CONTENT_GENERATED, "producao", { content_type: tipo });
      toast.success("Conteúdo estruturado e salvo no seu acervo.");
    } catch (err: any) {
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransform = async (format: TransformFormat) => {
    if (!output) return;
    setTransforming(format);
    setTransformResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transform-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            format,
            content: output,
            strategic_input: { tipo, objetivo, tese, percepcao },
          }),
        }
      );

      if (!res.ok) throw new Error("Erro na transformação");
      const data = await res.json();
      setTransformResult({ format, data: data.result });
      toast.success(
        format === "carrossel"
          ? "Carrossel estruturado com sucesso."
          : format === "reels"
            ? "Roteiro de reels gerado."
            : "Legenda completa gerada."
      );
    } catch {
      toast.error("Erro ao transformar conteúdo. Tente novamente.");
    } finally {
      setTransforming(null);
    }
  };

  const copySection = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleGenerateVisualCarousel = () => {
    if (!output) return;
    setGeneratingVisual(true);
    setVisualSlides(null);
    // Small delay to show loading state
    setTimeout(() => {
      try {
        const slides = mapContentToSlides(output);
        if (slides.length === 0) {
          toast.error("Conteúdo insuficiente para gerar slides.");
          return;
        }
        setVisualSlides(slides);
        toast.success("Carrossel pronto para publicação!");
      } catch {
        toast.error("Erro ao gerar carrossel visual.");
      } finally {
        setGeneratingVisual(false);
      }
    }, 1500);
  };

  const copyAll = () => {
    if (!output) return;
    const full = OUTPUT_SECTIONS.map((s) => `${s}\n${output[s] || "—"}`).join("\n\n");
    navigator.clipboard.writeText(full);
    toast.success("Conteúdo completo copiado!");
  };

  const hasContext = context.archetype || context.macro_objetivo || context.pillar;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Laboratório de Conteúdo Estratégico
          </h1>
          <p className="text-muted-foreground mb-8">
            Nenhum conteúdo pode ser criado sem intenção estratégica definida.
          </p>
        </motion.div>

        {/* LAYER 1 — Strategic Context */}
        {!contextLoading && hasContext && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-5 mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-medium">
              Baseado na sua estratégia atual
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {context.archetype && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  <span className="text-muted-foreground">Arquétipo:</span>
                  <span className="font-medium">{context.archetype}</span>
                </div>
              )}
              {context.macro_objetivo && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Compass className="h-3.5 w-3.5 text-accent" />
                  <span className="text-muted-foreground">Objetivo:</span>
                  <span className="font-medium">{context.macro_objetivo}</span>
                </div>
              )}
              {context.pillar && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  <span className="text-muted-foreground">Pilar ativo:</span>
                  <span className="font-medium">{context.pillar}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* LAYER 2 — Strategic Definition */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
            Qual é a intenção deste conteúdo?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Defina classificação, tese e estratégia antes de gerar.
          </p>

          <div className="space-y-6">
            {/* Tipo — Visual Cards */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Tipo do conteúdo
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setTipo(ct.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      tipo === ct.value
                        ? "border-accent bg-accent/10 text-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:bg-accent/5"
                    }`}
                  >
                    <ct.icon className={`h-5 w-5 ${tipo === ct.value ? "text-accent" : ""}`} />
                    <span className="text-xs font-medium">{ct.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{ct.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Objetivo do conteúdo
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Qual função esse conteúdo precisa cumprir agora?
              </p>
              <Textarea
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ex: Aumentar autoridade sobre rinoplastia estrutural"
                className="rounded-xl resize-none min-h-[72px] text-sm"
              />
            </div>

            {/* Tese */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Tese central
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Qual é a ideia que você quer defender?
              </p>
              <Textarea
                value={tese}
                onChange={(e) => setTese(e.target.value)}
                placeholder="Ex: O problema não é o produto. É a lógica."
                className="rounded-xl resize-none min-h-[72px] text-sm"
              />
            </div>

            {/* Percepção */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Percepção desejada
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Como você quer que a médica seja percebida após esse conteúdo?
              </p>
              <Textarea
                value={percepcao}
                onChange={(e) => setPercepcao(e.target.value)}
                placeholder="Ex: Ela sabe exatamente o que está fazendo"
                className="rounded-xl resize-none min-h-[72px] text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!allFilled || loading}
              className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-medium text-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? LOADING_MESSAGES[loadingMsgIndex] : "Gerar conteúdo estratégico"}
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="space-y-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {OUTPUT_SECTIONS.map((s) => (
                <div key={s} className="bg-card rounded-2xl border border-border p-6">
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                {LOADING_MESSAGES[loadingMsgIndex]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LAYER 3 — Output */}
        <AnimatePresence>
          {output && !loading && (
            <motion.div
              className="space-y-4 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Strategic Summary */}
              <div className="bg-accent/5 rounded-2xl border border-accent/15 p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">
                  Resumo estratégico
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground">
                  <span>
                    <span className="text-muted-foreground">Tipo:</span>{" "}
                    <span className="font-medium capitalize">{tipo}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Tese:</span>{" "}
                    <span className="font-medium">"{tese}"</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Objetivo:</span>{" "}
                    <span className="font-medium">{objetivo}</span>
                  </span>
                </div>
              </div>

              {/* Section Title */}
              <div className="flex items-center justify-between pt-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Estrutura do conteúdo
                </h2>
                <button
                  onClick={copyAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copiar tudo
                </button>
              </div>

              {OUTPUT_SECTIONS.map((section, i) => (
                <motion.div
                  key={section}
                  className="bg-card rounded-2xl border border-border p-6 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {section}
                      </h3>
                    </div>
                    <button
                      onClick={() => copySection(output[section] || "")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {output[section] || "—"}
                  </p>
                </motion.div>
              ))}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleTransform("carrossel")}
                  disabled={!!transforming}
                >
                  {transforming === "carrossel" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {transforming === "carrossel" ? "Gerando…" : "Transformar em carrossel"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleTransform("reels")}
                  disabled={!!transforming}
                >
                  {transforming === "reels" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="mr-2 h-4 w-4" />
                  )}
                  {transforming === "reels" ? "Gerando…" : "Gerar roteiro de reels"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleTransform("legenda")}
                  disabled={!!transforming}
                >
                  {transforming === "legenda" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Type className="mr-2 h-4 w-4" />
                  )}
                  {transforming === "legenda" ? "Gerando…" : "Gerar legenda"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Image className="mr-2 h-4 w-4" />
                  {showUpload ? "Fechar upload" : "Adicionar referência visual"}
                </Button>
              </div>

              {/* Image Upload */}
              <AnimatePresence>
                {showUpload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <ImageUpload linkedModule="producao" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transform Result */}
              <AnimatePresence>
                {transformResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-card rounded-2xl border border-accent/15 shadow-sm overflow-hidden"
                  >
                    <div className="bg-accent/5 px-6 py-4 flex items-center justify-between border-b border-accent/10">
                      <div className="flex items-center gap-2">
                        {transformResult.format === "carrossel" && <FileText className="h-4 w-4 text-accent" />}
                        {transformResult.format === "reels" && <Video className="h-4 w-4 text-accent" />}
                        {transformResult.format === "legenda" && <Type className="h-4 w-4 text-accent" />}
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          {transformResult.format === "carrossel" && "Carrossel estruturado"}
                          {transformResult.format === "reels" && "Roteiro de reels"}
                          {transformResult.format === "legenda" && "Legenda completa"}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(transformResult.data, null, 2));
                          toast.success("Resultado copiado!");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar tudo
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Carousel slides */}
                      {transformResult.format === "carrossel" && transformResult.data.slides && (
                        <div className="space-y-3">
                          {transformResult.data.slides.map((slide: any, i: number) => (
                            <div key={i} className="border border-border rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                  {slide.slide_number || i + 1}
                                </span>
                                <span className="text-[10px] uppercase tracking-wide text-accent font-medium">
                                  {slide.type}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-foreground mb-1">
                                {slide.headline}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">{slide.body}</p>
                              {slide.visual_direction && (
                                <p className="text-[11px] text-muted-foreground/70 italic">
                                  🎨 {slide.visual_direction}
                                </p>
                              )}
                            </div>
                          ))}
                          {transformResult.data.caption && (
                            <div className="bg-muted/30 rounded-xl p-4">
                              <p className="text-xs font-medium text-foreground mb-1">Legenda sugerida</p>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{transformResult.data.caption}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reels script */}
                      {transformResult.format === "reels" && (
                        <div className="space-y-3">
                          {transformResult.data.hook && (
                            <div className="border border-accent/20 rounded-xl p-4 bg-accent/3">
                              <p className="text-[10px] uppercase tracking-wide text-accent font-medium mb-1">Hook · Primeiros 3s</p>
                              <p className="text-sm font-medium text-foreground">{transformResult.data.hook.text}</p>
                              {transformResult.data.hook.visual_cue && (
                                <p className="text-[11px] text-muted-foreground/70 mt-1 italic">🎬 {transformResult.data.hook.visual_cue}</p>
                              )}
                            </div>
                          )}
                          {transformResult.data.sections?.map((section: any, i: number) => (
                            <div key={i} className="border border-border rounded-xl p-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{section.section}</span>
                                {section.duration && <span className="text-[10px] text-muted-foreground">{section.duration}</span>}
                              </div>
                              <p className="text-sm text-foreground">{section.text}</p>
                              {section.on_screen_text && (
                                <p className="text-[11px] text-accent mt-1">📝 {section.on_screen_text}</p>
                              )}
                              {section.visual_cue && (
                                <p className="text-[11px] text-muted-foreground/70 mt-1 italic">🎬 {section.visual_cue}</p>
                              )}
                            </div>
                          ))}
                          {transformResult.data.cta && (
                            <div className="border border-accent/20 rounded-xl p-4 bg-accent/3">
                              <p className="text-[10px] uppercase tracking-wide text-accent font-medium mb-1">CTA Final</p>
                              <p className="text-sm font-medium text-foreground">{transformResult.data.cta.text}</p>
                            </div>
                          )}
                          {transformResult.data.caption && (
                            <div className="bg-muted/30 rounded-xl p-4">
                              <p className="text-xs font-medium text-foreground mb-1">Legenda</p>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{transformResult.data.caption}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caption */}
                      {transformResult.format === "legenda" && (
                        <div className="space-y-3">
                          {transformResult.data.hook && (
                            <div className="border border-accent/20 rounded-xl p-4 bg-accent/3">
                              <p className="text-[10px] uppercase tracking-wide text-accent font-medium mb-1">Hook (primeira linha visível)</p>
                              <p className="text-sm font-semibold text-foreground">{transformResult.data.hook}</p>
                            </div>
                          )}
                          {transformResult.data.body && (
                            <div className="border border-border rounded-xl p-4">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Corpo da legenda</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{transformResult.data.body}</p>
                            </div>
                          )}
                          {transformResult.data.cta && (
                            <div className="border border-accent/20 rounded-xl p-4 bg-accent/3">
                              <p className="text-[10px] uppercase tracking-wide text-accent font-medium mb-1">CTA</p>
                              <p className="text-sm font-medium text-foreground">{transformResult.data.cta}</p>
                            </div>
                          )}
                          {transformResult.data.hashtags && (
                            <div className="bg-muted/30 rounded-xl p-4">
                              <p className="text-xs font-medium text-foreground mb-2">Hashtags</p>
                              <div className="flex flex-wrap gap-1.5">
                                {transformResult.data.hashtags.map((h: string, i: number) => (
                                  <span key={i} className="text-xs text-accent bg-accent/8 px-2 py-0.5 rounded-md">
                                    #{h.replace(/^#/, "")}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!output && !loading && (
          <div className="text-center py-16">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Antes de criar, defina a intenção estratégica.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Producao;
