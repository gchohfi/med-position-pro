import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";

const STEPS = [
  {
    key: "welcome",
    question: "Bem-vinda ao MEDSHIFT.",
    microcopy:
      "Vamos construir juntos a base da sua direção estratégica. Cada resposta ajuda o sistema a entender sua marca, seu público e o território que você quer ocupar.",
    detail: "Esse processo leva cerca de 3 minutos e substitui semanas de planejamento manual.",
    type: "intro" as const,
  },
  {
    key: "specialty",
    question: "Qual é a sua especialidade?",
    microcopy:
      "Sua área de atuação define o território editorial e o universo de referências que o MEDSHIFT vai usar para guiar suas decisões.",
    type: "select" as const,
    options: [
      "Dermatologia",
      "Ginecologia",
      "Pediatria",
      "Psiquiatria",
      "Nutrologia",
      "Endocrinologia",
      "Cardiologia",
      "Oftalmologia",
      "Cirurgia Plástica",
      "Medicina Estética",
      "Outra",
    ],
  },
  {
    key: "target_audience",
    question: "Quem você realmente quer atrair?",
    microcopy:
      "Descreva o perfil de paciente ou público ideal. Quanto mais específica, mais precisa será a sua direção estratégica.",
    placeholder:
      "Ex: Mulheres de 30–50 anos, classe A/B, que buscam tratamentos de prevenção e rejuvenescimento com abordagem natural e sem exageros estéticos.",
    type: "textarea" as const,
  },
  {
    key: "archetype",
    question: "Como você quer ser percebida?",
    microcopy:
      "Cada arquétipo define um estilo de presença. Não existe certo ou errado — escolha o que mais ressoa com sua essência.",
    type: "archetype" as const,
    options: [
      {
        value: "A Especialista — autoridade técnica e profundidade",
        label: "A Especialista",
        desc: "Autoridade técnica, profundidade clínica, confiança pela competência.",
      },
      {
        value: "A Mentora — acolhimento e orientação",
        label: "A Mentora",
        desc: "Acolhimento, orientação, proximidade com cuidado.",
      },
      {
        value: "A Inovadora — vanguarda e novas abordagens",
        label: "A Inovadora",
        desc: "Vanguarda, novas abordagens, curiosidade científica.",
      },
      {
        value: "A Líder — visão estratégica e inspiração",
        label: "A Líder",
        desc: "Visão ampla, inspiração, liderança do segmento.",
      },
      {
        value: "A Humanista — empatia e conexão genuína",
        label: "A Humanista",
        desc: "Empatia profunda, conexão genuína, escuta ativa.",
      },
    ],
  },
  {
    key: "tone",
    question: "Qual tom define sua comunicação?",
    microcopy:
      "O tom é o que torna sua voz reconhecível. Ele permeia cada peça, cada frase, cada decisão editorial.",
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
    question: "Quais pilares sustentam sua comunicação?",
    microcopy:
      "Pilares editoriais são os territórios que você vai ocupar de forma recorrente. Escolha até 3 que dão direção ao seu conteúdo.",
    type: "multiselect" as const,
    options: [
      "Educação em saúde",
      "Bastidores da profissão",
      "Opinião e posicionamento",
      "Casos e resultados",
      "Estilo de vida",
      "Ciência e evidências",
      "Conexão pessoal",
    ],
  },
  {
    key: "goals",
    question: "O que você quer alcançar com sua presença digital?",
    microcopy:
      "Seu objetivo principal guia toda a estratégia — do diagnóstico à produção. Seja específica.",
    placeholder:
      "Ex: Quero me tornar referência em dermatologia estética na minha cidade e atrair pacientes de alto ticket que valorizam cuidado personalizado.",
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
  const totalReal = STEPS.length - 1; // exclude intro
  const progressStep = step === 0 ? 0 : step;
  const progress = (progressStep / totalReal) * 100;

  const setValue = (value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  };

  const currentValue = answers[current.key];

  const canProceed =
    current.type === "intro"
      ? true
      : current.type === "multiselect"
        ? Array.isArray(currentValue) && currentValue.length > 0
        : !!currentValue;

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ specialty: answers.specialty as string })
        .eq("id", user.id);

      await supabase.from("positioning").upsert({
        user_id: user.id,
        archetype: answers.archetype as string,
        tone: answers.tone as string,
        pillars: answers.pillars as string[],
        target_audience: answers.target_audience as string,
        goals: answers.goals as string,
      });

      await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      toast.success("Direção estratégica definida. Seu sistema está pronto.");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading text-base font-semibold tracking-tight text-foreground">
            MEDSHIFT
          </span>
          {step > 0 && (
            <span className="text-xs text-muted-foreground">
              {step} de {totalReal}
            </span>
          )}
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalReal }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                i < step
                  ? "bg-accent"
                  : i === step
                    ? "bg-accent/60"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Intro step */}
            {current.type === "intro" && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-8"
                >
                  <Sparkles className="h-7 w-7 text-accent" />
                </motion.div>
                <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4 leading-tight">
                  {current.question}
                </h1>
                <p className="text-muted-foreground leading-relaxed mb-3 max-w-md mx-auto">
                  {current.microcopy}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-10">
                  {(current as any).detail}
                </p>
                <Button
                  onClick={next}
                  className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-sm"
                >
                  Começar minha direção estratégica
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Select step */}
            {current.type === "select" && (
              <>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
                  {current.question}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {current.microcopy}
                </p>
                <div className="grid gap-2.5">
                  {current.options!.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setValue(opt)}
                      className={`group text-left px-5 py-4 rounded-xl border transition-all duration-200 text-sm flex items-center justify-between ${
                        currentValue === opt
                          ? "border-accent bg-accent/8 text-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/3"
                      }`}
                    >
                      <span>{opt}</span>
                      {currentValue === opt && (
                        <Check className="h-4 w-4 text-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Archetype step */}
            {current.type === "archetype" && (
              <>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
                  {current.question}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {current.microcopy}
                </p>
                <div className="grid gap-3">
                  {(current as any).options!.map((opt: any) => (
                    <button
                      key={opt.value}
                      onClick={() => setValue(opt.value)}
                      className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                        currentValue === opt.value
                          ? "border-accent bg-accent/8 shadow-sm"
                          : "border-border bg-card hover:border-accent/40 hover:bg-accent/3"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        {currentValue === opt.value && (
                          <Check className="h-4 w-4 text-accent shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Multiselect step */}
            {current.type === "multiselect" && (
              <>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
                  {current.question}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {current.microcopy}
                </p>
                <div className="grid gap-2.5">
                  {current.options!.map((opt) => {
                    const selected =
                      Array.isArray(currentValue) && currentValue.includes(opt);
                    const atLimit =
                      Array.isArray(currentValue) && currentValue.length >= 3;
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          const arr = Array.isArray(currentValue)
                            ? [...currentValue]
                            : [];
                          if (selected) {
                            setValue(arr.filter((v) => v !== opt));
                          } else if (!atLimit) {
                            setValue([...arr, opt]);
                          }
                        }}
                        className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 text-sm flex items-center justify-between ${
                          selected
                            ? "border-accent bg-accent/8 text-foreground shadow-sm"
                            : atLimit
                              ? "border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed"
                              : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/3"
                        }`}
                      >
                        <span>{opt}</span>
                        {selected && (
                          <Check className="h-4 w-4 text-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {Array.isArray(currentValue) && currentValue.length > 0
                    ? `${currentValue.length} de 3 selecionados`
                    : "Selecione até 3 pilares"}
                </p>
              </>
            )}

            {/* Textarea step */}
            {current.type === "textarea" && (
              <>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
                  {current.question}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {current.microcopy}
                </p>
                <Textarea
                  value={(currentValue as string) || ""}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={(current as any).placeholder || "Escreva aqui..."}
                  className="min-h-[140px] rounded-xl resize-none text-sm border-border focus:border-accent/50 bg-card"
                />
              </>
            )}

            {/* Navigation */}
            {current.type !== "intro" && (
              <div className="flex items-center justify-between mt-10">
                <Button
                  variant="ghost"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step <= 1}
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={next}
                  disabled={!canProceed || saving}
                  className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-6 h-11"
                >
                  {isLastStep
                    ? saving
                      ? "Finalizando…"
                      : "Ativar meu sistema"
                    : "Continuar"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
