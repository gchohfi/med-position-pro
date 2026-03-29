import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Target,
  Users,
  Crown,
  Mic,
  Layers,
  Compass,
} from "lucide-react";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";

const STEP_ICONS: Record<string, any> = {
  specialty: Target,
  target_audience: Users,
  archetype: Crown,
  tone: Mic,
  pillars: Layers,
  goals: Compass,
};

const STEPS = [
  {
    key: "welcome",
    question: "Sua direção estratégica\ncomeça aqui.",
    microcopy:
      "O MEDSHIFT vai construir um sistema de posicionamento sob medida para você. Cada resposta refina a inteligência que guiará suas decisões editoriais.",
    detail: "Processo consultivo · 3 minutos · Substitui semanas de planejamento",
    type: "intro" as const,
  },
  {
    key: "specialty",
    question: "Qual é a sua especialidade médica?",
    microcopy:
      "Sua área de atuação define o território editorial, o universo de referências e o mapa competitivo que o MEDSHIFT vai monitorar.",
    contextHint: "Isso influencia: diagnóstico, radar de mercado, referências estratégicas",
    type: "select" as const,
    options: [
      "Dermatologia",
      "Ginecologia e Obstetrícia",
      "Pediatria",
      "Psiquiatria",
      "Nutrologia",
      "Endocrinologia",
      "Cardiologia",
      "Oftalmologia",
      "Cirurgia Plástica",
      "Medicina Estética",
      "Ortopedia",
      "Outra",
    ],
  },
  {
    key: "target_audience",
    question: "Quem você quer atrair\npara sua prática?",
    microcopy:
      "Quanto mais específica, mais precisa será a sua direção. Pense no perfil ideal — não no público genérico.",
    contextHint: "Isso influencia: tom, conteúdo, calendário, séries editoriais",
    placeholder:
      "Ex: Mulheres de 30–50 anos, classe A/B, que buscam tratamentos de prevenção e rejuvenescimento com abordagem natural e sem exageros estéticos.",
    type: "textarea" as const,
  },
  {
    key: "archetype",
    question: "Como você quer\nser percebida?",
    microcopy:
      "O arquétipo define a essência da sua presença. Ele guia tom, conteúdo e diferenciação — não é um rótulo, é uma direção.",
    contextHint: "Isso influencia: identidade editorial, voz, posicionamento competitivo",
    type: "archetype" as const,
    options: [
      {
        value: "A Especialista — autoridade técnica e profundidade",
        label: "A Especialista",
        desc: "Autoridade técnica, profundidade clínica, confiança pela competência.",
        emoji: "🔬",
      },
      {
        value: "A Mentora — acolhimento e orientação",
        label: "A Mentora",
        desc: "Acolhimento, orientação, proximidade com cuidado genuíno.",
        emoji: "🤝",
      },
      {
        value: "A Inovadora — vanguarda e novas abordagens",
        label: "A Inovadora",
        desc: "Vanguarda, novas abordagens, curiosidade científica.",
        emoji: "💡",
      },
      {
        value: "A Líder — visão estratégica e inspiração",
        label: "A Líder",
        desc: "Visão ampla, inspiração, liderança do segmento.",
        emoji: "👑",
      },
      {
        value: "A Humanista — empatia e conexão genuína",
        label: "A Humanista",
        desc: "Empatia profunda, escuta ativa, conexão que transforma.",
        emoji: "💛",
      },
    ],
  },
  {
    key: "tone",
    question: "Qual tom define\nsua comunicação?",
    microcopy:
      "O tom é o que torna sua voz reconhecível. Ele permeia cada peça, cada frase, cada decisão editorial do sistema.",
    contextHint: "Isso influencia: produção de conteúdo, séries, calendário",
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
    question: "Quais pilares sustentam\nsua comunicação?",
    microcopy:
      "Pilares editoriais são os territórios recorrentes do seu conteúdo. Eles garantem consistência e profundidade ao longo do tempo.",
    contextHint: "Isso influencia: equilíbrio do calendário, séries, mix editorial",
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
    question: "O que você quer alcançar\ncom sua presença digital?",
    microcopy:
      "Seu objetivo principal ancora toda a estratégia — do diagnóstico ao radar de mercado. Quanto mais claro, mais poderoso o sistema.",
    contextHint: "Isso influencia: diagnóstico, recomendações, evolução estratégica",
    placeholder:
      "Ex: Quero me tornar referência em dermatologia estética na minha cidade e atrair pacientes de alto ticket que valorizam cuidado personalizado.",
    type: "textarea" as const,
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = STEPS[step];
  const totalReal = STEPS.length - 1;

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

  // Auto-advance on single select after a brief moment
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    };
  }, [autoAdvanceTimer]);

  const handleSelect = (value: string) => {
    setValue(value);
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) {
        setDirection(1);
        setStep((s) => s + 1);
      }
    }, 400);
    setAutoAdvanceTimer(timer);
  };

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

      await logStrategicEvent(STRATEGIC_EVENTS.ONBOARDING_COMPLETED, "onboarding", {
        specialty: answers.specialty,
        archetype: answers.archetype,
      });
      toast.success("Direção estratégica definida. Seu sistema está pronto.");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    setDirection(1);
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const prev = () => {
    setDirection(-1);
    setStep(Math.max(0, step - 1));
  };

  const isLastStep = step === STEPS.length - 1;
  const StepIcon = STEP_ICONS[current.key];

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <span className="font-heading text-base font-semibold tracking-tight text-foreground">
            MEDSHIFT
          </span>
          {step > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground tabular-nums"
            >
              {step} de {totalReal}
            </motion.span>
          )}
        </div>
        {/* Progress bar — segmented */}
        <div className="flex gap-1">
          {Array.from({ length: totalReal }).map((_, i) => (
            <motion.div
              key={i}
              className="h-[3px] rounded-full flex-1"
              initial={false}
              animate={{
                backgroundColor:
                  i < step
                    ? "hsl(var(--accent))"
                    : i === step
                      ? "hsl(var(--accent) / 0.5)"
                      : "hsl(var(--border))",
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-28">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            {/* ─── Intro step ─── */}
            {current.type === "intro" && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-10"
                >
                  <Sparkles className="h-9 w-9 text-accent" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-heading text-3xl md:text-[2.5rem] font-semibold text-foreground mb-5 leading-[1.15] whitespace-pre-line"
                >
                  {current.question}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-muted-foreground leading-relaxed mb-4 max-w-md mx-auto"
                >
                  {current.microcopy}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                  className="text-xs text-muted-foreground/60 mb-12 tracking-wide"
                >
                  {(current as any).detail}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.4 }}
                >
                  <Button
                    onClick={next}
                    className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 px-10 h-13 text-sm font-medium shadow-lg shadow-accent/10"
                  >
                    Começar minha direção estratégica
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            )}

            {/* ─── Select step ─── */}
            {current.type === "select" && (
              <>
                <div className="flex items-start gap-4 mb-8">
                  {StepIcon && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <StepIcon className="h-5 w-5 text-accent" />
                    </motion.div>
                  )}
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-tight whitespace-pre-line">
                      {current.question}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      {current.microcopy}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  {current.options!.map((opt, i) => (
                    <motion.button
                      key={opt}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                      onClick={() => handleSelect(opt)}
                      className={`group text-left px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm flex items-center justify-between ${
                        currentValue === opt
                          ? "border-accent bg-accent/8 text-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/3"
                      }`}
                    >
                      <span>{opt}</span>
                      <motion.div
                        initial={false}
                        animate={{ scale: currentValue === opt ? 1 : 0, opacity: currentValue === opt ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-accent" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>

                {(current as any).contextHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[11px] text-muted-foreground/50 mt-4 italic"
                  >
                    {(current as any).contextHint}
                  </motion.p>
                )}
              </>
            )}

            {/* ─── Archetype step ─── */}
            {current.type === "archetype" && (
              <>
                <div className="flex items-start gap-4 mb-8">
                  {StepIcon && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <StepIcon className="h-5 w-5 text-accent" />
                    </motion.div>
                  )}
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-tight whitespace-pre-line">
                      {current.question}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      {current.microcopy}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5">
                  {(current as any).options!.map((opt: any, i: number) => (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.3 }}
                      onClick={() => handleSelect(opt.value)}
                      className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                        currentValue === opt.value
                          ? "border-accent bg-accent/8 shadow-sm"
                          : "border-border bg-card hover:border-accent/40 hover:bg-accent/3"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{opt.emoji}</span>
                          <span className="text-sm font-medium text-foreground">
                            {opt.label}
                          </span>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ scale: currentValue === opt.value ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="h-4 w-4 text-accent" />
                        </motion.div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 ml-9">
                        {opt.desc}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {(current as any).contextHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[11px] text-muted-foreground/50 mt-4 italic"
                  >
                    {(current as any).contextHint}
                  </motion.p>
                )}
              </>
            )}

            {/* ─── Multiselect step ─── */}
            {current.type === "multiselect" && (
              <>
                <div className="flex items-start gap-4 mb-8">
                  {StepIcon && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <StepIcon className="h-5 w-5 text-accent" />
                    </motion.div>
                  )}
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-tight whitespace-pre-line">
                      {current.question}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      {current.microcopy}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  {current.options!.map((opt, i) => {
                    const selected =
                      Array.isArray(currentValue) && currentValue.includes(opt);
                    const atLimit =
                      Array.isArray(currentValue) && currentValue.length >= 3;
                    return (
                      <motion.button
                        key={opt}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
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
                        className={`text-left px-5 py-3.5 rounded-xl border transition-all duration-200 text-sm flex items-center justify-between ${
                          selected
                            ? "border-accent bg-accent/8 text-foreground shadow-sm"
                            : atLimit && !selected
                              ? "border-border bg-card text-muted-foreground/40 cursor-not-allowed"
                              : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/3"
                        }`}
                      >
                        <span>{opt}</span>
                        <motion.div
                          initial={false}
                          animate={{ scale: selected ? 1 : 0 }}
                          transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
                        >
                          <Check className="h-4 w-4 text-accent" />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(currentValue) && currentValue.length > 0
                      ? `${currentValue.length} de 3 selecionados`
                      : "Selecione até 3 pilares"}
                  </p>
                  {(current as any).contextHint && (
                    <p className="text-[11px] text-muted-foreground/50 italic">
                      {(current as any).contextHint}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ─── Textarea step ─── */}
            {current.type === "textarea" && (
              <>
                <div className="flex items-start gap-4 mb-8">
                  {StepIcon && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <StepIcon className="h-5 w-5 text-accent" />
                    </motion.div>
                  )}
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-tight whitespace-pre-line">
                      {current.question}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      {current.microcopy}
                    </p>
                  </div>
                </div>

                <Textarea
                  value={(currentValue as string) || ""}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={(current as any).placeholder || "Escreva aqui..."}
                  className="min-h-[150px] rounded-xl resize-none text-sm border-border focus:border-accent/50 bg-card leading-relaxed"
                />

                {(current as any).contextHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[11px] text-muted-foreground/50 mt-3 italic"
                  >
                    {(current as any).contextHint}
                  </motion.p>
                )}
              </>
            )}

            {/* ─── Navigation ─── */}
            {current.type !== "intro" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center justify-between mt-10"
              >
                <Button
                  variant="ghost"
                  onClick={prev}
                  disabled={step <= 1}
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>

                {/* Only show continue for textarea/multiselect (select auto-advances) */}
                {(current.type === "textarea" || current.type === "multiselect") && (
                  <Button
                    onClick={next}
                    disabled={!canProceed || saving}
                    className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 px-7 h-11 shadow-md shadow-accent/10"
                  >
                    {isLastStep
                      ? saving
                        ? "Ativando seu sistema…"
                        : "Ativar meu sistema"
                      : "Continuar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* For select/archetype show continue only if selected (as fallback) */}
                {(current.type === "select" || current.type === "archetype") && canProceed && (
                  <Button
                    onClick={next}
                    variant="ghost"
                    className="rounded-xl text-accent hover:text-accent/80 text-sm"
                  >
                    Continuar
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
