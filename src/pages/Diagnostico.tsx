import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  Target,
  Shield,
  AlertTriangle,
  Shuffle,
  TrendingUp,
  BarChart3,
  Crown,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const MATURITY_LEVELS = [
  { key: "iniciante", label: "Iniciante", value: 25 },
  { key: "estruturando", label: "Estruturando", value: 50 },
  { key: "estrategico", label: "Estratégico", value: 75 },
  { key: "avancado", label: "Avançado", value: 100 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

interface Diagnosis {
  posicionamento_atual: string;
  forcas: string[];
  lacunas: string[];
  incoerencias: string[];
  oportunidades: string[];
  maturidade: string;
  arquetipo_principal: string;
  arquetipo_secundario: string;
  direcao_recomendada: { atual: string; ideal: string; gap: string };
}

const Diagnostico = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
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
        .select("diagnosis")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (diagData?.diagnosis && Object.keys(diagData.diagnosis as object).length > 1) {
        setDiagnosis(diagData.diagnosis as unknown as Diagnosis);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const generateDiagnosis = async () => {
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
            action: "diagnostico",
          }),
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições atingido. Tente novamente em instantes.");
        return;
      }
      if (response.status === 402) {
        toast.error("Créditos esgotados.");
        return;
      }
      if (!response.ok) throw new Error("Erro na geração");

      const data = await response.json();
      setDiagnosis(data.diagnosis);
      logStrategicEvent(STRATEGIC_EVENTS.DIAGNOSIS_GENERATED, "diagnostico");
      toast.success("Diagnóstico concluído com base nas suas respostas");
    } catch {
      toast.error("Erro ao gerar diagnóstico. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const maturityValue = MATURITY_LEVELS.find((m) => m.key === diagnosis?.maturidade)?.value || 0;

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
            Precisamos conhecer seu posicionamento antes de gerar o diagnóstico.
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

  if (!diagnosis) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
              Diagnóstico Estratégico
            </h1>
            <p className="text-muted-foreground mb-10">
              Análise baseada nas suas respostas e na lógica de posicionamento médico digital.
            </p>
          </motion.div>

          {generating ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6">
                  <Skeleton className="h-5 w-48 mb-4" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
              <p className="text-center text-sm text-muted-foreground pt-4">
                Analisando seu posicionamento…
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm mb-6">
                Gere sua análise estratégica personalizada
              </p>
              <Button
                onClick={generateDiagnosis}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar diagnóstico
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
              Diagnóstico Estratégico do Seu Posicionamento
            </h1>
            <p className="text-muted-foreground">
              Análise baseada nas suas respostas e na lógica de posicionamento médico digital.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={generateDiagnosis}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            Regerar
          </Button>
        </motion.div>

        <div className="space-y-5">
          {/* Posicionamento atual */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Posicionamento atual percebido
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {diagnosis.posicionamento_atual}
            </p>
          </motion.div>

          {/* Forças */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Forças do perfil
              </h3>
            </div>
            <ul className="space-y-2">
              {diagnosis.forcas.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Lacunas */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Lacunas estratégicas
              </h3>
            </div>
            <ul className="space-y-2">
              {diagnosis.lacunas.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Incoerências */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shuffle className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Incoerências
              </h3>
            </div>
            <ul className="space-y-2">
              {diagnosis.incoerencias.map((inc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {inc}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Oportunidades */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Oportunidades
              </h3>
            </div>
            <ul className="space-y-2">
              {diagnosis.oportunidades.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Maturidade Digital */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Maturidade digital
              </h3>
            </div>
            <Progress value={maturityValue} className="h-2.5 mb-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {MATURITY_LEVELS.map((level) => (
                <span
                  key={level.key}
                  className={`${level.key === diagnosis.maturidade ? "text-accent font-semibold" : ""}`}
                >
                  {level.label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Arquétipos */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Crown className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Arquétipo de Posicionamento
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Principal</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {diagnosis.arquetipo_principal}
                </p>
              </div>
              <div className="bg-background rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Secundário</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {diagnosis.arquetipo_secundario}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Direção Recomendada — Atual vs Ideal */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={7}
          >
            <h3 className="font-heading text-base font-semibold text-foreground mb-4">
              Direção recomendada
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-background rounded-xl border border-border p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Atual</span>
                <p className="text-sm text-foreground mt-2 leading-relaxed">
                  {diagnosis.direcao_recomendada.atual}
                </p>
              </div>
              <div className="bg-accent/5 rounded-xl border border-accent/20 p-4">
                <span className="text-xs text-accent uppercase tracking-wide font-medium">Ideal</span>
                <p className="text-sm text-foreground mt-2 leading-relaxed">
                  {diagnosis.direcao_recomendada.ideal}
                </p>
              </div>
            </div>
            <div className="bg-background rounded-xl border border-border p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Gap estratégico
              </span>
              <p className="text-sm text-foreground mt-2 leading-relaxed">
                {diagnosis.direcao_recomendada.gap}
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex justify-center pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={() => navigate("/estrategia-ia")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-8"
            >
              Ver estratégia
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Diagnostico;
