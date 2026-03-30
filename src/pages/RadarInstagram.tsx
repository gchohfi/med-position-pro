import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  Instagram,
  Plus,
  Trash2,
  TrendingUp,
  Eye,
  Palette,
  BarChart3,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Loader2,
  Users,
  Target,
  BookOpen,
  Calendar,
  PenTool,
  Lightbulb,
  Radar,
  X,
  UserPlus,
  Crown,
  AlertTriangle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

/* ─── Interfaces ─── */
interface TrackedProfile {
  id: string;
  username: string;
  profile_type: "own" | "competitor";
  display_name: string | null;
  bio: string | null;
  followers_count: number | null;
  media_count: number | null;
  last_synced_at: string | null;
}

interface TrendItem {
  title: string;
  description: string;
  format_type: string;
  relevance: "alta" | "media" | "baixa";
  examples: string;
}

interface CompetitorInsight {
  username: string;
  strengths: string;
  weaknesses: string;
  signature_pattern: string;
  what_to_absorb: string;
  what_to_avoid: string;
}

interface PerformanceAnalysis {
  overall_assessment: string;
  top_performing_formats: string;
  underperforming_areas: string;
  engagement_patterns: string;
  growth_opportunities: string;
}

interface VisualSuggestion {
  suggestion_type: string;
  title: string;
  description: string;
  inspiration_source: string;
  adaptation_note: string;
}

interface ContentPatterns {
  what_works: string;
  what_fails: string;
  emerging_formats: string;
  optimal_frequency: string;
  best_hooks: string;
}

interface RecommendationItem {
  title: string;
  insight: string;
  action: string;
  priority: "alta" | "media" | "baixa";
  module: string;
}

interface IntelData {
  summary: string | null;
  trends: TrendItem[];
  competitor_insights: CompetitorInsight[];
  performance_analysis: PerformanceAnalysis | null;
  visual_suggestions: VisualSuggestion[];
  content_patterns: ContentPatterns | null;
  recommendations: RecommendationItem[];
  citations: string[];
  updated_at: string | null;
}

/* ─── Constants ─── */
const MODULE_ICONS: Record<string, any> = {
  estrategia: Lightbulb,
  series: BookOpen,
  calendario: Calendar,
  producao: PenTool,
  radar: Radar,
};

const MODULE_PATHS: Record<string, string> = {
  estrategia: "/estrategia",
  series: "/series",
  calendario: "/calendario",
  producao: "/producao",
  radar: "/radar",
};

const MODULE_LABELS: Record<string, string> = {
  estrategia: "Estratégia",
  series: "Séries",
  calendario: "Calendário",
  producao: "Criação",
  radar: "Radar",
};

const FORMAT_LABELS: Record<string, string> = {
  carrossel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
  post_unico: "Post único",
  collab: "Collab",
  misto: "Misto",
};

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  layout: "Layout",
  paleta: "Paleta de cores",
  tipografia: "Tipografia",
  formato: "Formato",
  estilo_foto: "Estilo fotográfico",
};

const PRIORITY_STYLES: Record<string, string> = {
  alta: "bg-red-500/10 text-red-600 border-red-500/20",
  media: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  baixa: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const LOADING_MESSAGES = [
  "Analisando tendências do Instagram no seu nicho…",
  "Estudando os perfis concorrentes monitorados…",
  "Identificando padrões visuais e de conteúdo…",
  "Gerando sugestões adaptadas à sua identidade…",
  "Compilando inteligência estratégica do Instagram…",
];

/* ─── Component ─── */
const RadarInstagram = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State — profiles
  const [profiles, setProfiles] = useState<TrackedProfile[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newProfileType, setNewProfileType] = useState<"own" | "competitor">("competitor");
  const [addingProfile, setAddingProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // State — analysis
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"trends" | "competitors" | "performance" | "visual" | "patterns">("trends");
  const [data, setData] = useState<IntelData>({
    summary: null,
    trends: [],
    competitor_insights: [],
    performance_analysis: null,
    visual_suggestions: [],
    content_patterns: null,
    recommendations: [],
    citations: [],
    updated_at: null,
  });

  /* ─── Effects ─── */
  useEffect(() => {
    if (user) {
      loadProfiles();
      loadAnalysis();
    }
  }, [user]);

  useEffect(() => {
    if (!generating) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((p) => (p + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  /* ─── Data loading ─── */
  const loadProfiles = async () => {
    const { data: tracked } = await supabase
      .from("instagram_tracked_profiles" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    if (tracked) setProfiles(tracked as unknown as TrackedProfile[]);
  };

  const loadAnalysis = async () => {
    setLoading(true);
    const { data: analysis } = await supabase
      .from("instagram_analyses" as any)
      .select("*")
      .eq("user_id", user!.id)
      .eq("analysis_type", "full")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis) {
      const raw = (analysis as any).raw_data || {};
      setData({
        summary: (analysis as any).summary,
        trends: ((analysis as any).trends as unknown as TrendItem[]) || [],
        competitor_insights: ((analysis as any).competitor_insights as unknown as CompetitorInsight[]) || [],
        performance_analysis: (analysis as any).performance_analysis as PerformanceAnalysis || null,
        visual_suggestions: ((analysis as any).visual_suggestions as unknown as VisualSuggestion[]) || [],
        content_patterns: (analysis as any).content_patterns as ContentPatterns || null,
        recommendations: ((analysis as any).recommendations as unknown as RecommendationItem[]) || [],
        citations: (raw.citations as string[]) || [],
        updated_at: (analysis as any).updated_at,
      });
    }
    setLoading(false);
  };

  /* ─── Profile management ─── */
  const addProfile = async () => {
    if (!newUsername.trim()) return;
    const clean = newUsername.trim().replace(/^@/, "");

    // Check limits
    const ownCount = profiles.filter((p) => p.profile_type === "own").length;
    const compCount = profiles.filter((p) => p.profile_type === "competitor").length;

    if (newProfileType === "own" && ownCount >= 1) {
      toast.error("Você já tem um perfil próprio cadastrado.");
      return;
    }
    if (newProfileType === "competitor" && compCount >= 5) {
      toast.error("Limite de 5 perfis concorrentes atingido.");
      return;
    }
    if (profiles.some((p) => p.username.toLowerCase() === clean.toLowerCase())) {
      toast.error("Este perfil já está sendo monitorado.");
      return;
    }

    setAddingProfile(true);
    try {
      const { error } = await supabase.from("instagram_tracked_profiles" as any).insert({
        user_id: user!.id,
        username: clean,
        profile_type: newProfileType,
      } as any);

      if (error) throw error;

      setNewUsername("");
      setShowAddForm(false);
      await loadProfiles();
      toast.success(`@${clean} adicionado como ${newProfileType === "own" ? "perfil próprio" : "concorrente"}.`);
    } catch (err: any) {
      toast.error("Erro ao adicionar perfil. Tente novamente.");
    } finally {
      setAddingProfile(false);
    }
  };

  const removeProfile = async (id: string, username: string) => {
    const { error } = await supabase
      .from("instagram_tracked_profiles" as any)
      .delete()
      .eq("id", id);
    if (!error) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast.success(`@${username} removido.`);
    }
  };

  /* ─── Generate analysis ─── */
  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");

      // The frontend sends whatever profile data it has; the Edge Function
      // also gathers context from Supabase + Perplexity independently.
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-instagram-intel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            competitor_profiles_data: profiles
              .filter((p) => p.profile_type === "competitor")
              .map((p) => ({
                username: p.username,
                followers_count: p.followers_count,
                media_count: p.media_count,
                bio: p.bio,
              })),
          }),
        }
      );

      if (!res.ok) throw new Error("Erro na geração");
      const result = await res.json();

      if (result.intel) {
        setData({
          summary: result.intel.summary,
          trends: result.intel.trends || [],
          competitor_insights: result.intel.competitor_insights || [],
          performance_analysis: result.intel.performance_analysis || null,
          visual_suggestions: result.intel.visual_suggestions || [],
          content_patterns: result.intel.content_patterns || null,
          recommendations: result.intel.recommendations || [],
          citations: result.intel.citations || [],
          updated_at: new Date().toISOString(),
        });
        logStrategicEvent("instagram_intel_generated", "instagram_radar");
        toast.success("Inteligência do Instagram gerada com sucesso.");
      }
    } catch {
      toast.error("Erro ao gerar análise. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const hasData = !!data.summary;
  const ownProfile = profiles.find((p) => p.profile_type === "own");
  const competitors = profiles.filter((p) => p.profile_type === "competitor");

  /* ─── Render ─── */
  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-5xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6">
                <Skeleton className="h-4 w-40 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl space-y-8">
        {/* ─── Header ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-1 flex items-center gap-2">
                <Instagram className="h-7 w-7 text-accent" />
                Radar Instagram
              </h1>
              <p className="text-muted-foreground">
                Monitore concorrentes, descubra tendências e receba sugestões visuais adaptadas ao seu estilo.
              </p>
            </div>
            <Button
              onClick={generateAnalysis}
              disabled={generating}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {generating ? "Analisando…" : hasData ? "Atualizar análise" : "Gerar análise"}
            </Button>
          </div>
          {data.updated_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Última análise:{" "}
              {new Date(data.updated_at).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </motion.div>

        {/* ─── Tracked Profiles Section ─── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-heading text-lg font-medium text-foreground">
                Perfis monitorados
              </h2>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {profiles.length} perfil{profiles.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <X className="mr-1.5 h-3 w-3" /> : <Plus className="mr-1.5 h-3 w-3" />}
              {showAddForm ? "Cancelar" : "Adicionar perfil"}
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <motion.div
              className="bg-card rounded-2xl border border-accent/20 p-5 mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Username do Instagram
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="usuario"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      onKeyDown={(e) => e.key === "Enter" && addProfile()}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewProfileType("own")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newProfileType === "own"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Crown className="inline h-3 w-3 mr-1" />
                      Meu perfil
                    </button>
                    <button
                      onClick={() => setNewProfileType("competitor")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newProfileType === "competitor"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Eye className="inline h-3 w-3 mr-1" />
                      Concorrente
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={addProfile}
                    disabled={addingProfile || !newUsername.trim()}
                    className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {addingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile cards */}
          {profiles.length === 0 ? (
            <div className="bg-muted/20 rounded-2xl border border-border p-8 text-center">
              <Instagram className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Nenhum perfil monitorado ainda.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Adicione seu perfil e até 5 concorrentes para começar a análise.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`bg-card rounded-2xl border p-4 shadow-sm ${
                    profile.profile_type === "own"
                      ? "border-accent/30 bg-accent/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          profile.profile_type === "own"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {profile.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          @{profile.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {profile.profile_type === "own" ? (
                            <span className="text-accent">Meu perfil</span>
                          ) : (
                            "Concorrente"
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeProfile(profile.id, profile.username)}
                      className="text-muted-foreground/50 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {profile.followers_count && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {profile.followers_count.toLocaleString("pt-BR")} seguidores
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ─── Generating state ─── */}
        {generating && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </motion.div>
        )}

        {/* ─── Empty state ─── */}
        {!hasData && !generating && (
          <motion.div
            className="flex flex-col items-center py-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Instagram className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Inteligência do Instagram em espera
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              {profiles.length === 0
                ? "Adicione perfis para monitorar e gere sua primeira análise de inteligência."
                : "Clique em gerar análise para receber insights sobre tendências, concorrentes e sugestões visuais."}
            </p>
            {profiles.length > 0 && (
              <Button
                onClick={generateAnalysis}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar primeira análise
              </Button>
            )}
          </motion.div>
        )}

        {/* ─── Data sections ─── */}
        {hasData && !generating && (
          <>
            {/* Summary */}
            <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <h2 className="font-heading text-lg font-medium text-foreground mb-3">
                Visão geral do Instagram
              </h2>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {data.summary}
                </p>
              </div>
            </motion.section>

            {/* Tab navigation */}
            <motion.div
              className="flex gap-1 bg-muted/30 rounded-xl p-1 overflow-x-auto"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1.5}
            >
              {[
                { key: "trends" as const, label: "Tendências", icon: TrendingUp },
                { key: "competitors" as const, label: "Concorrentes", icon: Eye },
                { key: "performance" as const, label: "Performance", icon: BarChart3 },
                { key: "visual" as const, label: "Visual", icon: Palette },
                { key: "patterns" as const, label: "Padrões", icon: Target },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* ─── Tab: Trends ─── */}
            {activeTab === "trends" && data.trends.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Tendências detectadas
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.trends.map((trend, i) => (
                    <div
                      key={i}
                      className={`bg-card rounded-2xl border p-5 shadow-sm ${
                        trend.relevance === "alta"
                          ? "border-accent/20 bg-accent/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground">{trend.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {FORMAT_LABELS[trend.format_type] || trend.format_type}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              trend.relevance === "alta"
                                ? "bg-accent/10 text-accent"
                                : trend.relevance === "media"
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {trend.relevance}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{trend.description}</p>
                      <div className="bg-muted/30 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-foreground/80">
                          <span className="text-accent font-medium">Exemplo: </span>
                          {trend.examples}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ─── Tab: Competitors ─── */}
            {activeTab === "competitors" && data.competitor_insights.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Análise de concorrentes
                  </h2>
                </div>
                <div className="space-y-4">
                  {data.competitor_insights.map((comp, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {comp.username[0]?.toUpperCase()}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">@{comp.username}</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                            Pontos fortes
                          </p>
                          <p className="text-xs text-foreground">{comp.strengths}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider mb-1">
                            Pontos fracos
                          </p>
                          <p className="text-xs text-foreground">{comp.weaknesses}</p>
                        </div>
                      </div>

                      <div className="mt-4 bg-muted/20 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                          Padrão visual/editorial
                        </p>
                        <p className="text-xs text-foreground">{comp.signature_pattern}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-accent/5 rounded-lg px-3 py-2 border border-accent/10">
                          <p className="text-[10px] text-accent font-medium mb-0.5">O que absorver</p>
                          <p className="text-xs text-foreground">{comp.what_to_absorb}</p>
                        </div>
                        <div className="bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/10">
                          <p className="text-[10px] text-red-500 font-medium mb-0.5">O que evitar</p>
                          <p className="text-xs text-foreground">{comp.what_to_avoid}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ─── Tab: Performance ─── */}
            {activeTab === "performance" && data.performance_analysis && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Análise de performance
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  <div>
                    <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                      Avaliação geral
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {data.performance_analysis.overall_assessment}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                      <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                        Formatos que mais performam
                      </p>
                      <p className="text-xs text-foreground">
                        {data.performance_analysis.top_performing_formats}
                      </p>
                    </div>
                    <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10">
                      <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider mb-1">
                        Áreas com baixa performance
                      </p>
                      <p className="text-xs text-foreground">
                        {data.performance_analysis.underperforming_areas}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                      Padrões de engajamento
                    </p>
                    <p className="text-xs text-foreground">
                      {data.performance_analysis.engagement_patterns}
                    </p>
                  </div>

                  <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                    <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                      Oportunidades de crescimento
                    </p>
                    <p className="text-xs text-foreground">
                      {data.performance_analysis.growth_opportunities}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ─── Tab: Visual Suggestions ─── */}
            {activeTab === "visual" && data.visual_suggestions.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Sugestões visuais
                  </h2>
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    adaptadas ao seu estilo
                  </span>
                </div>
                <div className="space-y-3">
                  {data.visual_suggestions.map((sug, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Palette className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">{sug.title}</h3>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {SUGGESTION_TYPE_LABELS[sug.suggestion_type] || sug.suggestion_type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{sug.description}</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="bg-muted/30 rounded-lg px-3 py-1.5 flex-1">
                              <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">Inspiração: </span>
                                {sug.inspiration_source}
                              </p>
                            </div>
                            <div className="bg-accent/5 rounded-lg px-3 py-1.5 border border-accent/10 flex-1">
                              <p className="text-[10px] text-foreground">
                                <span className="text-accent font-medium">Adaptação: </span>
                                {sug.adaptation_note}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ─── Tab: Content Patterns ─── */}
            {activeTab === "patterns" && data.content_patterns && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Padrões de conteúdo
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                      <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                        O que funciona
                      </p>
                      <p className="text-xs text-foreground">{data.content_patterns.what_works}</p>
                    </div>
                    <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10">
                      <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider mb-1">
                        O que não funciona
                      </p>
                      <p className="text-xs text-foreground">{data.content_patterns.what_fails}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-accent font-medium uppercase tracking-wider mb-1">
                      Formatos emergentes
                    </p>
                    <p className="text-xs text-foreground">{data.content_patterns.emerging_formats}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        Frequência ideal
                      </p>
                      <p className="text-xs text-foreground">{data.content_patterns.optimal_frequency}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        Melhores ganchos
                      </p>
                      <p className="text-xs text-foreground">{data.content_patterns.best_hooks}</p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ─── Recommendations (always visible) ─── */}
            {data.recommendations.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Próximos movimentos recomendados
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.recommendations.map((rec, i) => {
                    const Icon = MODULE_ICONS[rec.module] || Target;
                    return (
                      <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Icon className="h-3.5 w-3.5 text-accent" />
                              </div>
                              <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.baixa
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1.5">{rec.insight}</p>
                            <p className="text-xs text-foreground">{rec.action}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl shrink-0 text-xs"
                            onClick={() => navigate(MODULE_PATHS[rec.module] || "/estrategia")}
                          >
                            {MODULE_LABELS[rec.module] || "Abrir"}
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Citations */}
            {data.citations.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4}>
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram className="h-3 w-3" />
                    <span>{data.citations.length} fontes consultadas na pesquisa</span>
                  </summary>
                  <div className="mt-3 bg-muted/20 rounded-xl border border-border p-4 space-y-1.5">
                    {data.citations.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-muted-foreground hover:text-accent truncate transition-colors"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </details>
              </motion.section>
            )}

            {/* Footer */}
            <motion.div
              className="bg-muted/30 rounded-2xl border border-border p-4 flex items-center justify-between"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-xs text-muted-foreground">
                  Inteligência alimentada por pesquisa web em tempo real + análise estratégica com IA.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={generateAnalysis}
                disabled={generating}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Atualizar
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default RadarInstagram;
