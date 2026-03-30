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
import SuggestionCards from "@/components/SuggestionCards";

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
  const [loadedFromLibrary, setLoadedFromLibrary] = useState(false);
  const [loadedContentId, setLoadedContentId] = useState<string | null>(null);
  const [doctorPhotoUrl, setDoctorPhotoUrl] = useState<string | null>(null);

  // Suggestion system state
  const [suggestingFields, setSuggestingFields] = useState(false);
  const [teseOptions, setTeseOptions] = useState<{ angle: string; label: string; text: string }[]>([]);
  const [percepcaoOptions, setPercepcaoOptions] = useState<{ angle: string; label: string; text: string }[]>([]);
  const [selectedTeseIndex, setSelectedTeseIndex] = useState<number | null>(null);
  const [selectedPercepcaoIndex, setSelectedPercepcaoIndex] = useState<number | null>(null);
  const [editingTese, setEditingTese] = useState(false);
  const [editingPercepcao, setEditingPercepcao] = useState(false);
  const [previousTheses, setPreviousTheses] = useState<string[]>([]);
  const [previousPerceptions, setPreviousPerceptions] = useState<string[]>([]);

  // Load strategic context from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setContextLoading(true);
      try {
        const [posRes, diagRes] = await Promise.all([
          supabase.from("positioning").select("archetype, pillars, tone, target_audience, goals").eq("user_id", user.id).maybeSingle(),
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

  // Load previous theses/perceptions for variation
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const { data } = await supabase
          .from("content_outputs")
          .select("strategic_input")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data) {
          const theses = data
            .map((d) => (d.strategic_input as any)?.tese)
            .filter(Boolean);
          const perceptions = data
            .map((d) => (d.strategic_input as any)?.percepcao)
            .filter(Boolean);
          setPreviousTheses(theses);
          setPreviousPerceptions(perceptions);
        }
      } catch {}
    };
    loadHistory();
  }, [user]);

  // Generate AI suggestions for tese and percepção — now returns 3 options each
  const generateSuggestions = async () => {
    if (!tipo || !objetivo.trim()) {
      toast.error("Preencha o tipo e objetivo antes de gerar sugestões.");
      return;
    }
    setSuggestingFields(true);
    setTeseOptions([]);
    setPercepcaoOptions([]);
    setSelectedTeseIndex(null);
    setSelectedPercepcaoIndex(null);
    setEditingTese(false);
    setEditingPercepcao(false);
    setTese("");
    setPercepcao("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");

      // Gather rich context
      const [posRes, profileRes, seriesRes, calendarRes, memoryRes, radarRes] = await Promise.all([
        supabase.from("positioning").select("archetype, pillars, tone, target_audience, goals").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("specialty").eq("id", user!.id).maybeSingle(),
        supabase.from("series").select("name, strategic_role").eq("user_id", user!.id).eq("status", "ativa").limit(5),
        supabase.from("calendar_items").select("title, content_type").eq("user_id", user!.id).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(5),
        supabase.from("living_memory").select("memory").eq("user_id", user!.id).maybeSingle(),
        supabase.from("market_radar").select("signals, opportunities").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const pos = posRes.data;
      const activeSeries = seriesRes.data?.map((s) => `${s.name} (${s.strategic_role})`) || [];
      const calendarContext = calendarRes.data?.map((c) => `${c.title} (${c.content_type})`).join(", ") || "";
      const memory = memoryRes.data?.memory as Record<string, any> | null;
      const memoryHighlights = memory ? Object.values(memory).filter((v) => typeof v === "string").slice(0, 3) as string[] : [];
      const radar = radarRes.data;
      const radarSignals = radar?.signals ? (Array.isArray(radar.signals) ? radar.signals.slice(0, 3).map((s: any) => typeof s === "string" ? s : s?.title || "") : []) : [];

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tipo,
            objetivo,
            archetype: pos?.archetype || context.archetype,
            pillar: pos?.pillars?.[0] || context.pillar,
            tone: pos?.tone,
            targetAudience: pos?.target_audience,
            goals: pos?.goals,
            specialty: profileRes.data?.specialty,
            recentTheses: previousTheses,
            recentPerceptions: previousPerceptions,
            activeSeries,
            memoryHighlights,
            calendarContext,
            radarSignals,
          }),
        }
      );

      if (res.status === 429) {
        toast.error("Limite de requisições atingido. Tente novamente em instantes.");
        return;
      }
      if (res.status === 402) {
        toast.error("Créditos esgotados. Adicione créditos para continuar.");
        return;
      }
      if (!res.ok) throw new Error("Erro");

      const result = await res.json();

      if (result.teses?.length) {
        setTeseOptions(result.teses);
        setSelectedTeseIndex(0);
        setTese(result.teses[0].text);
      }
      if (result.percepcoes?.length) {
        setPercepcaoOptions(result.percepcoes);
        setSelectedPercepcaoIndex(0);
        setPercepcao(result.percepcoes[0].text);
      }

      toast.success("Opções estratégicas geradas. Escolha a direção.");
    } catch {
      toast.error("Erro ao gerar sugestões. Tente novamente.");
    } finally {
      setSuggestingFields(false);
    }
  };

  // Handle tese selection
  const handleTeseSelect = (index: number) => {
    setSelectedTeseIndex(index);
    setTese(teseOptions[index].text);
    setEditingTese(false);
  };

  // Handle percepcao selection
  const handlePercepcaoSelect = (index: number) => {
    setSelectedPercepcaoIndex(index);
    setPercepcao(percepcaoOptions[index].text);
    setEditingPercepcao(false);
  };

  // Pre-fill from query params OR load full piece from Biblioteca
  const autoTriggeredRef = React.useRef(false);
  const libraryLoadedRef = React.useRef(false);

  useEffect(() => {
    const contentId = searchParams.get("content_id");
    if (contentId && user && !libraryLoadedRef.current) {
      libraryLoadedRef.current = true;
      autoTriggeredRef.current = true; // skip auto-suggestions
      const loadFromLibrary = async () => {
        try {
          const { data } = await supabase
            .from("content_outputs")
            .select("*")
            .eq("id", contentId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (data) {
            const si = data.strategic_input as any;
            if (si?.tipo) setTipo(si.tipo);
            if (si?.objetivo) setObjetivo(si.objetivo);
            if (si?.tese) setTese(si.tese);
            if (si?.percepcao) setPercepcao(si.percepcao);
            const content = data.generated_content as Record<string, string> | null;
            if (content && typeof content === "object" && Object.values(content).some((v) => v)) {
              setOutput(content);
            }
            setLoadedFromLibrary(true);
            setLoadedContentId(data.id);
            toast.success("Peça carregada da sua biblioteca.");
          }
        } catch {
          toast.error("Erro ao carregar peça.");
        }
      };
      loadFromLibrary();
      return;
    }

    const obj = searchParams.get("objetivo");
    if (obj) setObjetivo(obj);
    const t = searchParams.get("tipo");
    if (t) setTipo(t);
  }, [searchParams, user]);

  // Auto-trigger suggestions when tipo + objetivo are ready (new pieces only)
  useEffect(() => {
    if (tipo && objetivo.trim() && !autoTriggeredRef.current && !contextLoading && teseOptions.length === 0 && !suggestingFields) {
      autoTriggeredRef.current = true;
      generateSuggestions();
    }
  }, [tipo, objetivo, contextLoading]);

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

      // Save to DB — update existing or create new
      try {
        if (loadedContentId) {
          const { error } = await supabase.from("content_outputs").update({
            content_type: tipo,
            title: tese.slice(0, 120) || objetivo.slice(0, 120),
            strategic_input: { objetivo, tese, percepcao, tipo } as any,
            generated_content: sections as any,
          }).eq("id", loadedContentId);
          if (error) console.error("Erro ao atualizar:", error);
        } else {
          const { error } = await supabase.from("content_outputs").insert({
            user_id: user!.id,
            content_type: tipo,
            title: tese.slice(0, 120) || objetivo.slice(0, 120),
            strategic_input: { objetivo, tese, percepcao, tipo } as any,
            generated_content: sections as any,
          });
          if (error) console.error("Erro ao salvar:", error);
        }
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
        const slides = mapContentToSlides(output, tipo);
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

        {/* Library loaded banner */}
        {loadedFromLibrary && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-4 mb-4 flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="h-4 w-4 text-accent shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Base carregada da sua biblioteca</p>
              <p className="text-xs text-muted-foreground">Todos os campos foram preenchidos. Edite o que desejar ou gere novamente.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground shrink-0"
              onClick={() => setLoadedFromLibrary(false)}
            >
              Fechar
            </Button>
          </motion.div>
        )}

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

            {/* Suggestion trigger */}
            {tipo && objetivo.trim() && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={generateSuggestions}
                  disabled={suggestingFields}
                  variant="outline"
                  className="rounded-xl text-xs h-9 border-accent/30 text-accent hover:bg-accent/5"
                >
                  {suggestingFields ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {suggestingFields
                    ? "Gerando opções…"
                    : teseOptions.length > 0
                      ? "Gerar novas opções"
                      : "Gerar direções estratégicas"}
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  O MEDSHIFT propõe — você decide.
                </span>
              </div>
            )}

            {/* Loading state for suggestions */}
            {suggestingFields && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {[1, 2].map((g) => (
                  <div key={g} className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl border border-border bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ))}
                <p className="text-center text-xs text-muted-foreground animate-pulse">
                  Analisando posicionamento e gerando opções…
                </p>
              </motion.div>
            )}

            {/* Tese cards */}
            {teseOptions.length > 0 && !suggestingFields && (
              <SuggestionCards
                title="Tese central"
                helperText="A tese define o posicionamento editorial da peça. Escolha uma direção e ajuste se necessário."
                options={teseOptions}
                selectedIndex={selectedTeseIndex}
                onSelect={handleTeseSelect}
                editingValue={tese}
                onEditChange={setTese}
                isEditing={editingTese}
                onToggleEdit={() => setEditingTese(!editingTese)}
              />
            )}

            {/* Tese manual fallback — shown when no suggestions generated */}
            {teseOptions.length === 0 && !suggestingFields && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Tese central
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  A tese define o posicionamento da peça. Use o botão acima para gerar direções.
                </p>
                <Textarea
                  value={tese}
                  onChange={(e) => setTese(e.target.value)}
                  placeholder="Ex: O problema não é o produto. É a lógica."
                  className="rounded-xl resize-none min-h-[72px] text-sm"
                />
              </div>
            )}

            {/* Percepção cards */}
            {percepcaoOptions.length > 0 && !suggestingFields && (
              <SuggestionCards
                title="Percepção desejada"
                helperText="Como o público deve perceber a médica após esse conteúdo? Escolha o tom."
                options={percepcaoOptions}
                selectedIndex={selectedPercepcaoIndex}
                onSelect={handlePercepcaoSelect}
                editingValue={percepcao}
                onEditChange={setPercepcao}
                isEditing={editingPercepcao}
                onToggleEdit={() => setEditingPercepcao(!editingPercepcao)}
              />
            )}

            {/* Percepção manual fallback */}
            {percepcaoOptions.length === 0 && !suggestingFields && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Percepção desejada
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Como o público deve perceber a médica após esse conteúdo?
                </p>
                <Textarea
                  value={percepcao}
                  onChange={(e) => setPercepcao(e.target.value)}
                  placeholder="Ex: Ela sabe exatamente o que está fazendo"
                  className="rounded-xl resize-none min-h-[72px] text-sm"
                />
              </div>
            )}

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
                {/* Visual Carousel — primary action */}
                <Button
                  onClick={handleGenerateVisualCarousel}
                  disabled={generatingVisual}
                  className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {generatingVisual ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="mr-2 h-4 w-4" />
                  )}
                  {generatingVisual ? "Gerando slides…" : "Gerar carrossel visual (PNG)"}
                </Button>
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

              {/* Visual Carousel Preview */}
              <AnimatePresence>
                {visualSlides && (
                  <CarouselVisualPreview
                    slides={visualSlides}
                    brandName="MEDSHIFT"
                    archetype={context.archetype}
                    contentType={tipo}
                    onRegenerate={handleGenerateVisualCarousel}
                    onClose={() => setVisualSlides(null)}
                    onSlidesChange={(updated) => setVisualSlides(updated)}
                  />
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
