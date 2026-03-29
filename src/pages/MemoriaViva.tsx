import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Brain,
  Anchor,
  Mic,
  CheckCircle,
  XCircle,
  MapPin,
  Compass,
  AlertTriangle,
  Eye,
  Star,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Layout,
  FileText,
  Award,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Shuffle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface LivingMemory {
  positioning_anchor: string;
  tone_description: string;
  signature_phrases: string[];
  rejected_phrases: string[];
  strong_territories: string[];
  territories_to_explore: string[];
  saturated_territories: string[];
  visual_patterns?: string[];
  strategic_risks: string[];
  golden_patterns?: string[];
}

interface InspirationRef {
  id: string;
  category: string;
  title: string;
  segment: string | null;
  suggestion_reason: string | null;
  what_to_absorb: string | null;
  what_to_avoid: string | null;
  adherence_level: string;
  strategic_pattern: string | null;
  feedback: string | null;
  assimilated: boolean;
}

const ADHERENCE_COLORS: Record<string, string> = {
  alta: "bg-green-500/10 text-green-600",
  moderada: "bg-accent/10 text-accent",
  experimental: "bg-purple-500/10 text-purple-600",
};

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  layout: { label: "Direção visual", icon: Layout, color: "bg-blue-500/10 text-blue-600" },
  conteudo: { label: "Direção editorial", icon: FileText, color: "bg-accent/10 text-accent" },
  golden_case_starter: { label: "Caso-base sugerido", icon: Award, color: "bg-amber-500/10 text-amber-600" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
  }),
};

const MemoriaViva = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<LivingMemory | null>(null);
  const [inspirations, setInspirations] = useState<InspirationRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingInspirations, setGeneratingInspirations] = useState(false);
  const [inspTab, setInspTab] = useState<"all" | "layout" | "conteudo" | "golden_case_starter" | "assimilated">("all");

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [memRes, inspRes] = await Promise.all([
      supabase.from("living_memory").select("memory").eq("user_id", user!.id).maybeSingle(),
      supabase.from("inspiration_references").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    if (memRes.data?.memory && Object.keys(memRes.data.memory as object).length > 1) {
      setMemory(memRes.data.memory as unknown as LivingMemory);
    }
    setInspirations((inspRes.data as unknown as InspirationRef[]) || []);
    setLoading(false);
  };

  const generateMemory = async () => {
    setGenerating(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-memory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (response.status === 429) { toast.error("Limite de requisições."); return; }
      if (response.status === 402) { toast.error("Créditos esgotados."); return; }
      if (!response.ok) throw new Error("Erro");
      const data = await response.json();
      setMemory(data.living_memory);
      toast.success("Memória refinada com novos padrões.");
    } catch {
      toast.error("Erro ao gerar memória. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const generateInspirations = async () => {
    setGeneratingInspirations(true);
    try {
      const { data: { session: inspSession } } = await supabase.auth.getSession();
      const inspToken = inspSession?.access_token;
      if (!inspToken) throw new Error("Sessão expirada.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-inspirations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${inspToken}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (response.status === 429) { toast.error("Limite de requisições."); return; }
      if (response.status === 402) { toast.error("Créditos esgotados."); return; }
      if (!response.ok) throw new Error("Erro");
      toast.success("Direções sugeridas com base no seu posicionamento.");
      loadAll();
    } catch {
      toast.error("Erro ao gerar inspirações.");
    } finally {
      setGeneratingInspirations(false);
    }
  };

  const updateFeedback = async (ref: InspirationRef, feedback: string) => {
    const assimilated = feedback === "relevante" || feedback === "quero_adaptar";
    await supabase
      .from("inspiration_references")
      .update({ feedback, assimilated })
      .eq("id", ref.id);
    setInspirations((prev) =>
      prev.map((i) => (i.id === ref.id ? { ...i, feedback, assimilated } : i))
    );
    const msgs: Record<string, string> = {
      relevante: "Referência salva como relevante.",
      nao_relevante: "Referência marcada como não relevante.",
      quero_adaptar: "Referência salva para adaptação.",
      rejeitar: "Referência rejeitada.",
    };
    toast.success(msgs[feedback] || "Feedback registrado.");
  };

  // Filter inspirations
  const filteredInspirations = inspirations.filter((ref) => {
    if (ref.feedback === "rejeitar" || ref.feedback === "nao_relevante") return inspTab === "all";
    if (inspTab === "all") return true;
    if (inspTab === "assimilated") return ref.assimilated;
    return ref.category === inspTab;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!memory) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Memória Viva
            </h1>
            <p className="text-muted-foreground mb-10">
              O que o MEDSHIFT já aprendeu sobre sua marca.
            </p>
          </motion.div>

          {generating ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6">
                  <Skeleton className="h-5 w-48 mb-4" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Lendo padrões da sua marca…
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16">
              <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm mb-2 text-center max-w-sm">
                A memória estratégica se consolida conforme sua marca ganha repetição e coerência.
              </p>
              <Button
                onClick={generateMemory}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 mt-4"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar memória estratégica
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  const sections = [
    {
      icon: Anchor,
      title: "Sua assinatura estratégica",
      color: "bg-accent/10 text-accent",
      content: <p className="text-sm text-foreground leading-relaxed">{memory.positioning_anchor}</p>,
    },
    {
      icon: Mic,
      title: "O que já está claro no seu tom",
      color: "bg-accent/10 text-accent",
      content: <p className="text-sm text-foreground leading-relaxed">{memory.tone_description}</p>,
    },
    {
      icon: CheckCircle,
      title: "Vocabulário que fortalece sua marca",
      color: "bg-green-500/10 text-green-600",
      content: (
        <div className="flex flex-wrap gap-2">
          {memory.signature_phrases.map((p, i) => (
            <span key={i} className="text-xs bg-green-500/10 text-green-700 px-2.5 py-1 rounded-full">"{p}"</span>
          ))}
        </div>
      ),
    },
    {
      icon: XCircle,
      title: "O que evitar repetir",
      color: "bg-red-500/10 text-red-500",
      content: (
        <div className="flex flex-wrap gap-2">
          {memory.rejected_phrases.map((p, i) => (
            <span key={i} className="text-xs bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full line-through opacity-70">"{p}"</span>
          ))}
        </div>
      ),
    },
    {
      icon: MapPin,
      title: "Territórios que já são seus",
      color: "bg-blue-500/10 text-blue-600",
      content: (
        <ul className="space-y-1.5">
          {memory.strong_territories.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: Compass,
      title: "Espaços ainda pouco explorados",
      color: "bg-amber-500/10 text-amber-600",
      content: (
        <ul className="space-y-1.5">
          {memory.territories_to_explore.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: AlertTriangle,
      title: "Riscos estratégicos",
      color: "bg-red-500/10 text-red-500",
      content: (
        <ul className="space-y-1.5">
          {memory.strategic_risks.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  if (memory.golden_patterns?.length) {
    sections.push({
      icon: Star,
      title: "Fórmulas que funcionam",
      color: "bg-accent/10 text-accent",
      content: (
        <ul className="space-y-1.5">
          {memory.golden_patterns!.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Star className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (memory.visual_patterns?.length) {
    sections.push({
      icon: Eye,
      title: "Padrões visuais e editoriais",
      color: "bg-accent/10 text-accent",
      content: (
        <div className="flex flex-wrap gap-2">
          {memory.visual_patterns!.map((v, i) => (
            <span key={i} className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-full">{v}</span>
          ))}
        </div>
      ),
    });
  }

  const assimilatedCount = inspirations.filter((r) => r.assimilated).length;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-2"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Memória Viva
            </h1>
            <p className="text-muted-foreground">
              O que o MEDSHIFT já aprendeu sobre sua marca.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={generateMemory}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground mb-8">
          Com o tempo, o MEDSHIFT passa a reconhecer padrões que fortalecem sua presença — e também aquilo que dilui sua marca.
        </p>

        <div className="space-y-5">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color.split(" ")[0]}`}>
                  <section.icon className={`h-4 w-4 ${section.color.split(" ")[1]}`} />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {section.title}
                </h3>
              </div>
              {section.content}
            </motion.div>
          ))}

          {/* ==================== INSPIRAÇÕES INTELIGENTES ==================== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mt-10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Inspirações Inteligentes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Referências alinhadas ao seu posicionamento — para traduzir, não copiar.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl shrink-0"
                onClick={generateInspirations}
                disabled={generatingInspirations}
              >
                {generatingInspirations ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                )}
                {inspirations.length > 0 ? "Novas direções" : "Gerar direções"}
              </Button>
            </div>

            {/* Assimilated count */}
            {assimilatedCount > 0 && (
              <div className="bg-green-500/5 rounded-xl border border-green-500/15 px-4 py-2.5 mb-4 flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-green-700">
                  {assimilatedCount} referência{assimilatedCount > 1 ? "s" : ""} assimilada{assimilatedCount > 1 ? "s" : ""} à sua identidade estratégica
                </span>
              </div>
            )}

            {/* Filters */}
            {inspirations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { key: "all" as const, label: "Todas" },
                  { key: "layout" as const, label: "Visuais" },
                  { key: "conteudo" as const, label: "Editoriais" },
                  { key: "golden_case_starter" as const, label: "Casos-base" },
                  { key: "assimilated" as const, label: "Assimiladas" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setInspTab(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      inspTab === f.key
                        ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {generatingInspirations && inspirations.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border p-5">
                    <Skeleton className="h-4 w-40 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                  Buscando referências com aderência estratégica…
                </p>
              </div>
            )}

            {/* Empty state */}
            {!generatingInspirations && inspirations.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Você ainda não definiu referências.
                </p>
                <p className="text-xs text-muted-foreground">
                  O MEDSHIFT pode sugerir direções alinhadas ao seu posicionamento.
                </p>
              </div>
            )}

            {/* Reference cards */}
            {filteredInspirations.length > 0 && (
              <div className="space-y-3">
                {filteredInspirations.map((ref, i) => {
                  const catMeta = CATEGORY_META[ref.category] || CATEGORY_META.conteudo;
                  const adhColor = ADHERENCE_COLORS[ref.adherence_level] || ADHERENCE_COLORS.moderada;
                  const isRejected = ref.feedback === "rejeitar" || ref.feedback === "nao_relevante";

                  return (
                    <motion.div
                      key={ref.id}
                      className={`bg-card rounded-2xl border p-5 shadow-sm transition-colors ${
                        isRejected ? "border-border/50 opacity-50" : ref.assimilated ? "border-green-500/20" : "border-border"
                      }`}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${adhColor}`}>
                            Aderência {ref.adherence_level}
                          </span>
                          {ref.assimilated && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600">
                              Assimilada
                            </span>
                          )}
                        </div>
                        {ref.segment && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{ref.segment}</span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-foreground mb-2">{ref.title}</h4>

                      {ref.suggestion_reason && (
                        <div className="mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Motivo da sugestão</span>
                          <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{ref.suggestion_reason}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {ref.what_to_absorb && (
                          <div className="bg-green-500/5 rounded-xl px-3 py-2">
                            <span className="text-[10px] text-green-600 uppercase tracking-wide font-medium">O que absorver</span>
                            <p className="text-xs text-foreground/80 mt-0.5">{ref.what_to_absorb}</p>
                          </div>
                        )}
                        {ref.what_to_avoid && (
                          <div className="bg-red-500/5 rounded-xl px-3 py-2">
                            <span className="text-[10px] text-red-500 uppercase tracking-wide font-medium">O que evitar</span>
                            <p className="text-xs text-foreground/80 mt-0.5">{ref.what_to_avoid}</p>
                          </div>
                        )}
                      </div>

                      {ref.strategic_pattern && (
                        <div className="mt-3 bg-muted/50 rounded-xl px-3 py-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Padrão estratégico</span>
                          <p className="text-xs text-foreground/80 mt-0.5">{ref.strategic_pattern}</p>
                        </div>
                      )}

                      {/* Feedback actions */}
                      {!isRejected && (
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50">
                          <Button
                            variant={ref.feedback === "relevante" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-lg text-xs h-7 px-2.5"
                            onClick={() => updateFeedback(ref, "relevante")}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Relevante
                          </Button>
                          <Button
                            variant={ref.feedback === "quero_adaptar" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-lg text-xs h-7 px-2.5"
                            onClick={() => updateFeedback(ref, "quero_adaptar")}
                          >
                            <Shuffle className="h-3 w-3 mr-1" />
                            Adaptar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-xs h-7 px-2.5 text-muted-foreground"
                            onClick={() => updateFeedback(ref, "nao_relevante")}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Não relevante
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-xs h-7 px-2.5 text-destructive"
                            onClick={() => updateFeedback(ref, "rejeitar")}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex flex-wrap gap-3 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={() => navigate("/estrategia")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Revisar direção estratégica
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate("/producao")}
            >
              Usar memória na próxima peça
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MemoriaViva;
