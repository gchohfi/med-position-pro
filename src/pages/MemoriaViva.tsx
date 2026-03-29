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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) loadMemory();
  }, [user]);

  const loadMemory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("living_memory")
      .select("memory")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data?.memory && Object.keys(data.memory as object).length > 1) {
      setMemory(data.memory as unknown as LivingMemory);
    }
    setLoading(false);
  };

  const generateMemory = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-memory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
