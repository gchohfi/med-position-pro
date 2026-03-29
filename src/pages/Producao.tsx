import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

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

  // Load strategic context from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setContextLoading(true);
      try {
        const [posRes, diagRes] = await Promise.all([
          supabase.from("positioning").select("archetype, pillars").eq("user_id", user.id).maybeSingle(),
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

  // Pre-fill from query params
  useEffect(() => {
    const obj = searchParams.get("objetivo");
    if (obj) setObjetivo(obj);
  }, [searchParams]);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      toast.success("Conteúdo estruturado com base no seu posicionamento.");
    } catch (err: any) {
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copySection = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
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

            {/* Tese */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Tese central
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Qual é a ideia que você quer defender?
              </p>
              <Textarea
                value={tese}
                onChange={(e) => setTese(e.target.value)}
                placeholder="Ex: O problema não é o produto. É a lógica."
                className="rounded-xl resize-none min-h-[72px] text-sm"
              />
            </div>

            {/* Percepção */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Percepção desejada
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Como você quer que a médica seja percebida após esse conteúdo?
              </p>
              <Textarea
                value={percepcao}
                onChange={(e) => setPercepcao(e.target.value)}
                placeholder="Ex: Ela sabe exatamente o que está fazendo"
                className="rounded-xl resize-none min-h-[72px] text-sm"
              />
            </div>

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
                <Button variant="outline" className="rounded-xl" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Transformar em carrossel
                </Button>
                <Button variant="outline" className="rounded-xl" disabled>
                  <Video className="mr-2 h-4 w-4" />
                  Gerar roteiro de reels
                </Button>
                <Button variant="outline" className="rounded-xl" disabled>
                  <Type className="mr-2 h-4 w-4" />
                  Gerar legenda
                </Button>
                <Button variant="outline" className="rounded-xl" disabled>
                  <Calendar className="mr-2 h-4 w-4" />
                  Salvar no calendário
                </Button>
                <Button variant="outline" className="rounded-xl" disabled>
                  <Link2 className="mr-2 h-4 w-4" />
                  Vincular a uma série
                </Button>
              </div>
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
