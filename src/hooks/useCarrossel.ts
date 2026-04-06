import { useState, useEffect, useCallback } from "react";
import { useDoctor } from "@/contexts/DoctorContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TravessIARoteiro,
  travessiaToSlideData,
  validarRoteiro,
  avaliarQualidadeRoteiro,
  type CarouselQualityReport,
  simularRevisaoNutrologa,
  type NutrologaReviewReport,
  validarVisualAntiMediocridade,
  type VisualQualityReport,
  type PreferredVisualStyle,
} from "@/types/carousel";
import type { SlideData } from "@/components/carousel/SlideRenderer";

export interface TopicSuggestion {
  titulo: string;
  tese: string;
  objetivo: string;
  formato: string;
  por_que: string;
  urgencia: string;
}

export interface PautaResult {
  titulo: string;
  resumo: string;
  tese_sugerida?: string;
  objetivo_sugerido?: string;
  fonte?: string;
}

export function useCarrossel() {
  const { profile, isConfigured } = useDoctor();
  const location = useLocation();

  // Auto-suggestions
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // Brief form
  const [tese, setTese] = useState("");
  const [objetivo, setObjetivo] = useState("");

  // Research panel
  const [researchOpen, setResearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pautas, setPautas] = useState<PautaResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Scraper
  const [scraperUrl, setScraperUrl] = useState("");
  const [scraperLoading, setScraperLoading] = useState(false);

  // Roteiro
  const [roteiro, setRoteiro] = useState<TravessIARoteiro | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [quality, setQuality] = useState<CarouselQualityReport | null>(null);
  const [nutrologaReview, setNutrologaReview] = useState<NutrologaReviewReport | null>(null);
  const [visualQuality, setVisualQuality] = useState<VisualQualityReport | null>(null);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");
  const [loading, setLoading] = useState(false);

  // View toggle
  const [viewMode, setViewMode] = useState<"texto" | "visual">("visual");

  // Rewrite feedback
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Pre-fill from navigation state
  useEffect(() => {
    if (location.state?.tese) {
      setTese(location.state.tese);
      if (location.state?.objetivo) setObjetivo(location.state.objetivo);
    }
  }, [location.state]);

  const applyRoteiro = useCallback((parsed: TravessIARoteiro) => {
    setRoteiro(parsed);
    const slides = parsed.slides.map((s) =>
      travessiaToSlideData(s, parsed.slides.length),
    );
    setSlideDataList(slides);
    const avisos = validarRoteiro(parsed);
    setWarnings(avisos);
    setQuality(avaliarQualidadeRoteiro(parsed));
    setNutrologaReview(simularRevisaoNutrologa(parsed));
    setVisualQuality(validarVisualAntiMediocridade(parsed));
    setVisualStyle(parsed.preferredVisualStyle || profile?.skill?.estilo_visual?.preferredVisualStyle || "editorial_black_gold");
    if (avisos.length > 0) {
      toast.warning(`Roteiro gerado com ${avisos.length} aviso(s).`);
    } else {
      toast.success("Roteiro gerado com sucesso!");
    }
  }, [profile?.skill?.estilo_visual?.preferredVisualStyle]);

  const loadSuggestions = useCallback(async () => {
    if (!profile || suggestionsLoading) return;
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "suggest-carousel-topics",
        {
          body: {
            especialidade: profile.especialidade,
            subespecialidade: profile.subespecialidade ?? "",
            publico_alvo: profile.publico_alvo ?? "",
            tom_de_voz: profile.tom_de_voz ?? "",
            pilares: profile.objetivos ?? [],
          },
        },
      );
      if (error) throw error;
      const result = data as { sugestoes?: TopicSuggestion[] };
      if (result.sugestoes && result.sugestoes.length > 0) {
        setSuggestions(result.sugestoes);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar sugestoes:", err);
    } finally {
      setSuggestionsLoading(false);
      setSuggestionsLoaded(true);
    }
  }, [profile, suggestionsLoading]);

  // Suggestions are loaded on demand via loadSuggestions() — no auto-load
  // This avoids triggering edge function calls on page mount which fail
  // if ANTHROPIC_API_KEY is not configured.

  const handleSelectSuggestion = useCallback((s: TopicSuggestion) => {
    setTese(s.tese);
    setObjetivo(s.objetivo);
    toast.success(`Tema selecionado: ${s.titulo}`);
    document.getElementById("brief-form")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleGenerateFromSuggestion = useCallback(async (s: TopicSuggestion) => {
    setTese(s.tese);
    setObjetivo(s.objetivo);
    if (!profile) return;
    setLoading(true);
    setRoteiro(null);
    setSlideDataList([]);
    setWarnings([]);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          profile,
          tese: s.tese,
          objetivo: s.objetivo,
          action: "generate",
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
    } catch (err: unknown) {
      console.error("Erro ao gerar carrossel:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  }, [profile, applyRoteiro]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um tema para pesquisar.");
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "agent-pesquisador",
        { body: { query: searchQuery, profile } },
      );
      if (error) throw error;
      const results = (data?.pautas || data?.results || data || []) as PautaResult[];
      setPautas(results);
      if (results.length === 0) toast.info("Nenhuma pauta encontrada.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao pesquisar pautas.");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, profile]);

  const handleSelectPauta = useCallback((pauta: PautaResult) => {
    if (pauta.tese_sugerida) setTese(pauta.tese_sugerida);
    else setTese(pauta.titulo);
    if (pauta.objetivo_sugerido) setObjetivo(pauta.objetivo_sugerido);
    toast.success("Pauta selecionada!");
  }, []);

  const handleScrape = useCallback(async () => {
    if (!scraperUrl.trim()) {
      toast.error("Informe a URL para extrair.");
      return;
    }
    setScraperLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-scraper", {
        body: { url: scraperUrl },
      });
      if (error) throw error;
      const extractedTese = data?.tese || data?.titulo || data?.content || "";
      if (extractedTese) {
        setTese(extractedTese);
        toast.success("Conteudo extraido!");
      } else {
        toast.warning("Nao foi possivel extrair conteudo relevante.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao extrair conteudo do link.");
    } finally {
      setScraperLoading(false);
    }
  }, [scraperUrl]);

  const handleGenerate = useCallback(async () => {
    if (!profile) return;
    if (!tese.trim()) {
      toast.error("Informe a tese central do carrossel.");
      return;
    }
    setLoading(true);
    setRoteiro(null);
    setSlideDataList([]);
    setWarnings([]);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: { profile, tese, objetivo, action: "generate", skill: profile?.skill },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  }, [profile, tese, objetivo, applyRoteiro]);

  const handleRewrite = useCallback(async () => {
    if (!roteiro || !feedback.trim()) {
      toast.error("Escreva o que deseja mudar no roteiro.");
      return;
    }
    setRewriteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          action: "rewrite",
          roteiro: roteiro.slides,
          feedback,
          profile,
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
      setFeedback("");
      toast.success("Roteiro reescrito!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao reescrever roteiro.");
    } finally {
      setRewriteLoading(false);
    }
  }, [roteiro, feedback, profile, applyRoteiro]);

  const handleReset = useCallback(() => {
    setRoteiro(null);
    setSlideDataList([]);
    setWarnings([]);
    setQuality(null);
    setNutrologaReview(null);
    setVisualQuality(null);
    setTese("");
    setObjetivo("");
    setFeedback("");
  }, []);

  return {
    // Context
    profile,
    isConfigured,
    // Suggestions
    suggestions,
    suggestionsLoading,
    suggestionsLoaded,
    loadSuggestions,
    handleSelectSuggestion,
    handleGenerateFromSuggestion,
    // Brief form
    tese,
    setTese,
    objetivo,
    setObjetivo,
    // Research
    researchOpen,
    setResearchOpen,
    searchQuery,
    setSearchQuery,
    pautas,
    searchLoading,
    handleSearch,
    handleSelectPauta,
    scraperUrl,
    setScraperUrl,
    scraperLoading,
    handleScrape,
    // Roteiro
    roteiro,
    slideDataList,
    warnings,
    quality,
    nutrologaReview,
    visualQuality,
    visualStyle,
    loading,
    handleGenerate,
    handleRewrite,
    handleReset,
    // View
    viewMode,
    setViewMode,
    // Rewrite
    feedback,
    setFeedback,
    rewriteLoading,
  };
}
