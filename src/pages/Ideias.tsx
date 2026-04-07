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
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Inspiração para Carrosséis
          </h1>
          <p className="text-muted-foreground text-sm">
            Ideias prontas para usar, baseadas em tendências reais e no seu perfil.
          </p>
        </div>

        <Button
          onClick={generate}
          disabled={loading}
          className="mb-8 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {loading ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Gerando ideias...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar ideias de carrossel</>
          )}
        </Button>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
        )}

        {!loading && ideias.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {ideias.map((ideia, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{ideia.titulo}</h3>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${urgenciaColors[ideia.urgencia] || ""}`}>
                    {ideia.urgencia}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{ideia.tese}</p>
                <p className="text-xs text-muted-foreground/70 mb-1">
                  <span className="font-medium">Objetivo:</span> {ideia.objetivo}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-3">
                  <span className="font-medium">Por quê agora:</span> {ideia.por_que}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{ideia.formato?.replace(/_/g, " ")}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs ml-auto"
                    onClick={() => useIdeia(ideia)}
                  >
                    Usar <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && ideias.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm">
              Clique em "Gerar ideias" para receber sugestões personalizadas de carrossel baseadas em tendências e no seu perfil.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Ideias;
