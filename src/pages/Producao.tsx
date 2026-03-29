import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Copy, FileText, Video, Type, Calendar, Link2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const CONTENT_TYPES = [
  { value: "educativo", label: "Educativo" },
  { value: "manifesto", label: "Manifesto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "conexao", label: "Conexão" },
  { value: "conversao", label: "Conversão" },
];

const OUTPUT_SECTIONS = [
  "Gancho",
  "Quebra de percepção",
  "Explicação / visão",
  "Método / lógica",
  "Manifesto",
  "Fechamento",
];

const Producao = () => {
  const { user } = useAuth();
  const [tipo, setTipo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tese, setTese] = useState("");
  const [percepcao, setPercepcao] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<Record<string, string> | null>(null);

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

      // Stream SSE
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

      // Parse structured output
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

      // Fallback if parsing fails — just put everything in Gancho
      if (Object.values(sections).every((v) => !v)) {
        sections["Gancho"] = fullContent;
      }

      setOutput(sections);
      toast.success("Conteúdo estruturado com base no seu posicionamento");
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

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Produção de Conteúdo
          </h1>
          <p className="text-muted-foreground mb-10">
            Defina o direcionamento estratégico para gerar seu conteúdo.
          </p>
        </motion.div>

        {/* Strategic Input */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm mb-8">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-6">
            Definição estratégica do conteúdo
          </h2>

          <div className="space-y-6">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tipo do conteúdo</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setTipo(ct.value)}
                    className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                      tipo === ct.value
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Objetivo do conteúdo
              </label>
              <Textarea
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="O que este conteúdo precisa alcançar?"
                className="rounded-xl resize-none min-h-[80px] text-sm"
              />
            </div>

            {/* Tese */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Tese central
              </label>
              <Textarea
                value={tese}
                onChange={(e) => setTese(e.target.value)}
                placeholder="Qual é a ideia central que sustenta este conteúdo?"
                className="rounded-xl resize-none min-h-[80px] text-sm"
              />
            </div>

            {/* Percepção */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Percepção desejada
              </label>
              <Textarea
                value={percepcao}
                onChange={(e) => setPercepcao(e.target.value)}
                placeholder="Como você quer que o público se sinta após consumir este conteúdo?"
                className="rounded-xl resize-none min-h-[80px] text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!allFilled || loading}
              className="w-full h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Estruturando raciocínio estratégico…" : "Gerar conteúdo estratégico"}
            </Button>
          </div>
        </div>

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
              <p className="text-center text-sm text-muted-foreground">
                Estruturando raciocínio estratégico…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence>
          {output && !loading && (
            <motion.div
              className="space-y-4 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {OUTPUT_SECTIONS.map((section) => (
                <div
                  key={section}
                  className="bg-card rounded-2xl border border-border p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-base font-semibold text-foreground">{section}</h3>
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
                </div>
              ))}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button variant="outline" className="rounded-xl" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar carrossel
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
              Defina o direcionamento estratégico para gerar seu conteúdo
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Producao;
