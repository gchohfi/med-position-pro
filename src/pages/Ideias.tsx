import React, { useState } from "react";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

interface Ideia {
  titulo: string;
  tese: string;
  objetivo: string;
  formato: string;
  por_que: string;
  urgencia: string;
}

const urgenciaColors: Record<string, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baixa: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const Ideias = () => {
  const { profile } = useDoctor();
  const navigate = useNavigate();
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!profile?.especialidade) {
      toast.error("Configure sua especialidade no perfil primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: {
          mode: "inspiracao",
          especialidade: profile.especialidade,
          publico_alvo: profile.publico_alvo,
          tom_de_voz: profile.tom_de_voz,
          pilares: profile.diferenciais,
        },
      });
      if (error) throw error;
      setIdeias(data?.ideias || []);
      if (!data?.ideias?.length) toast.info("Nenhuma ideia gerada. Tente novamente.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar ideias.");
    } finally {
      setLoading(false);
    }
  };

  const useIdeia = (ideia: Ideia) => {
    navigate("/carrossel", { state: { tema: ideia.tese, titulo: ideia.titulo } });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="font-heading text-title tracking-tight text-foreground">
              Inspiração para Carrosséis
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Ideias prontas baseadas em tendências reais e no seu perfil.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            size="sm"
            className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Gerando…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Gerar ideias</>
            )}
          </Button>
        </div>

        {loading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface-card p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        )}

        {!loading && ideias.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {ideias.map((ideia, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="surface-card p-5 hover:shadow-premium-md hover:border-accent/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[13px] font-medium text-foreground leading-snug">{ideia.titulo}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${urgenciaColors[ideia.urgencia] || ""}`}>
                    {ideia.urgencia}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{ideia.tese}</p>
                <p className="text-xs text-muted-foreground/60 mb-1">
                  <span className="font-medium text-muted-foreground/80">Objetivo:</span> {ideia.objetivo}
                </p>
                <p className="text-xs text-muted-foreground/60 mb-3">
                  <span className="font-medium text-muted-foreground/80">Timing:</span> {ideia.por_que}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/50 bg-secondary px-2 py-0.5 rounded-sm">
                    {ideia.formato?.replace(/_/g, " ")}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs ml-auto gap-1"
                    onClick={() => useIdeia(ideia)}
                  >
                    Usar <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && ideias.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/25 mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Clique em "Gerar ideias" para receber sugestões personalizadas.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Ideias;
