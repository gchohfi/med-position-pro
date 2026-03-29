import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  {
    key: "specialty",
    question: "Qual é a sua especialidade médica?",
    microcopy: "Queremos entender sua área de atuação para personalizar seu posicionamento.",
    type: "select" as const,
    options: [
      "Dermatologia", "Ginecologia", "Pediatria", "Psiquiatria", "Nutrologia",
      "Endocrinologia", "Cardiologia", "Oftalmologia", "Cirurgia Plástica", "Medicina Estética", "Outra"
    ],
  },
  {
    key: "target_audience",
    question: "Vamos entender quem você realmente quer atrair.",
    microcopy: "Descreva o perfil de paciente ou público ideal que você deseja alcançar.",
    type: "textarea" as const,
  },
  {
    key: "archetype",
    question: "Qual arquétipo mais representa como você deseja ser percebida?",
    microcopy: "Não existe certo ou errado. Escolha o que mais ressoa com sua essência profissional.",
    type: "select" as const,
    options: [
      "A Especialista — autoridade técnica e profundidade",
      "A Mentora — acolhimento e orientação",
      "A Inovadora — vanguarda e novas abordagens",
      "A Líder — visão estratégica e inspiração",
      "A Humanista — empatia e conexão genuína",
    ],
  },
  {
    key: "tone",
    question: "Como você gostaria de se comunicar com seu público?",
    microcopy: "Escolha o tom que reflete como deseja ser percebida.",
    type: "select" as const,
    options: [
      "Acolhedor e educativo",
      "Direto e técnico",
      "Inspirador e motivacional",
      "Provocativo e instigante",
      "Leve e acessível",
    ],
  },
  {
    key: "pillars",
    question: "Quais pilares editoriais sustentam sua comunicação?",
    microcopy: "Escolha até 3 pilares que darão direção ao seu conteúdo.",
    type: "multiselect" as const,
    options: [
      "Educação em saúde", "Bastidores da profissão", "Opinião e posicionamento",
      "Casos e resultados", "Estilo de vida", "Ciência e evidências", "Conexão pessoal",
    ],
  },
  {
    key: "goals",
    question: "Qual é o seu principal objetivo com o Instagram hoje?",
    microcopy: "Entender seu objetivo nos ajuda a direcionar toda a estratégia.",
    type: "textarea" as const,
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const setValue = (value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  };

  const currentValue = answers[current.key];
  const canProceed = current.type === "multiselect"
    ? Array.isArray(currentValue) && currentValue.length > 0
    : !!currentValue;

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile specialty
      await supabase.from("profiles").update({
        specialty: answers.specialty as string,
      }).eq("id", user.id);

      // Upsert positioning
      await supabase.from("positioning").upsert({
        user_id: user.id,
        archetype: answers.archetype as string,
        tone: answers.tone as string,
        pillars: answers.pillars as string[],
        target_audience: answers.target_audience as string,
        goals: answers.goals as string,
      });

      // Mark onboarding complete
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);

      toast.success("Posicionamento definido com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container max-w-2xl mx-auto px-6 py-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Passo {step + 1} de {STEPS.length}</span>
          <span className="font-heading text-lg font-semibold text-foreground">MedPositioning</span>
        </div>
        <Progress value={progress} className="h-1.5 mb-12 rounded-full" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full max-w-xl"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-3">
              {current.question}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{current.microcopy}</p>

            {current.type === "select" && (
              <div className="grid gap-3">
                {current.options!.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setValue(opt)}
                    className={`text-left px-5 py-4 rounded-2xl border transition-all text-sm ${
                      currentValue === opt
                        ? "border-accent bg-accent/10 text-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-accent/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {current.type === "multiselect" && (
              <div className="grid gap-3">
                {current.options!.map((opt) => {
                  const selected = Array.isArray(currentValue) && currentValue.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        const arr = Array.isArray(currentValue) ? [...currentValue] : [];
                        if (selected) {
                          setValue(arr.filter((v) => v !== opt));
                        } else if (arr.length < 3) {
                          setValue([...arr, opt]);
                        }
                      }}
                      className={`text-left px-5 py-4 rounded-2xl border transition-all text-sm ${
                        selected
                          ? "border-accent bg-accent/10 text-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-accent/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground mt-1">Selecione até 3 pilares</p>
              </div>
            )}

            {current.type === "textarea" && (
              <Textarea
                value={(currentValue as string) || ""}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Escreva aqui..."
                className="min-h-[120px] rounded-2xl resize-none text-sm"
              />
            )}

            <div className="flex items-center justify-between mt-10">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={next}
                disabled={!canProceed || saving}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-6"
              >
                {step === STEPS.length - 1 ? (saving ? "Salvando..." : "Finalizar") : "Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
