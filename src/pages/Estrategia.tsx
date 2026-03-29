import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Compass,
  Layers,
  Mic,
  BarChart3,
  Film,
  Fingerprint,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const SOPHISTICATION_LEVELS = [
  { key: "basico", label: "Básico", value: 33 },
  { key: "intermediario", label: "Intermediário", value: 66 },
  { key: "premium", label: "Premium", value: 100 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

interface Pilar {
  nome: string;
  descricao: string;
  tipo_conteudo: string;
}

interface Estrategia {
  macro_objetivo: string;
  pilares_editoriais: Pilar[];
  tom_recomendado: string;
  nivel_sofisticacao: string;
  formatos_prioritarios: string[];
  diferenciacao: string;
}

const Estrategia_Page = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estrategia, setEstrategia] = useState<Estrategia | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user!.id)
        .single();

      if (!profile?.onboarding_complete) {
        setOnboardingComplete(false);
        setLoading(false);
        return;
      }

      const { data: diagData } = await supabase
        .from("diagnosis_outputs")
        .select("estrategia")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (diagData?.estrategia && Object.keys(diagData.estrategia as object).length > 1) {
        setEstrategia(diagData.estrategia as unknown as Estrategia);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const generateEstrategia = async () => {
    setGenerating(true);
    try {
      const { data: positioning } = await supabase
        .from("positioning")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("specialty")
        .eq("id", user!.id)
        .single();

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            positioning,
            specialty: profile?.specialty,
            action: "estrategia",
          }),
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições atingido.");
        return;
      }
      if (response.status === 402) {
        toast.error("Créditos esgotados.");
        return;
      }
      if (!response.ok) throw new Error("Erro");

      const data = await response.json();
      setEstrategia(data.estrategia);
      toast.success("Estratégia construída com base no seu diagnóstico");
    } catch {
      toast.error("Erro ao gerar estratégia. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const goToProducao = () => {
    if (!estrategia) return;
    const params = new URLSearchParams();
    if (estrategia.tom_recomendado) params.set("tom", estrategia.tom_recomendado);
    if (estrategia.pilares_editoriais?.[0]?.nome) params.set("pilar", estrategia.pilares_editoriais[0].nome);
    if (estrategia.macro_objetivo) params.set("objetivo", estrategia.macro_objetivo);
    navigate(`/producao?${params.toString()}`);
  };

  const sophisticationValue =
    SOPHISTICATION_LEVELS.find((s) => s.key === estrategia?.nivel_sofisticacao)?.value || 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!onboardingComplete) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
          <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-heading text-xl text-foreground mb-2">
            Complete seu onboarding primeiro
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Precisamos conhecer seu posicionamento antes de gerar a estratégia.
          </p>
          <Button
            onClick={() => navigate("/onboarding")}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Iniciar onboarding
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!estrategia) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Direcionamento Estratégico
            </h1>
            <p className="text-muted-foreground mb-10">
              Transformando diagnóstico em execução consistente.
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
              <p className="text-center text-sm text-muted-foreground pt-4">
                Construindo sua estratégia…
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm mb-6">
                Gere seu direcionamento estratégico personalizado
              </p>
              <Button
                onClick={generateEstrategia}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar estratégia
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-10"
        >
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Direcionamento Estratégico
            </h1>
            <p className="text-muted-foreground">
              Transformando diagnóstico em execução consistente.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={generateEstrategia}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            Regerar
          </Button>
        </motion.div>

        <div className="space-y-5">
          {/* Macro-objetivo */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Compass className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Macro-objetivo
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{estrategia.macro_objetivo}</p>
          </motion.div>

          {/* Pilares editoriais */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Pilares editoriais
              </h3>
            </div>
            <div className="space-y-4">
              {estrategia.pilares_editoriais.map((pilar, i) => (
                <div key={i} className="bg-background rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{pilar.nome}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{pilar.descricao}</p>
                  <span className="inline-block text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                    {pilar.tipo_conteudo}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tom recomendado */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Mic className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Tom recomendado
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{estrategia.tom_recomendado}</p>
          </motion.div>

          {/* Nível de sofisticação */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Nível de sofisticação
              </h3>
            </div>
            <Progress value={sophisticationValue} className="h-2.5 mb-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {SOPHISTICATION_LEVELS.map((level) => (
                <span
                  key={level.key}
                  className={`${level.key === estrategia.nivel_sofisticacao ? "text-accent font-semibold" : ""}`}
                >
                  {level.label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Formatos prioritários */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Film className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Formatos prioritários
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {estrategia.formatos_prioritarios.map((f, i) => (
                <span
                  key={i}
                  className="inline-block text-sm bg-accent/10 text-accent px-3 py-1.5 rounded-xl"
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Diferenciação estratégica */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Fingerprint className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Diferenciação estratégica
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{estrategia.diferenciacao}</p>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex justify-center pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={goToProducao}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-8"
            >
              Criar conteúdo com base nessa estratégia
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Estrategia_Page;
