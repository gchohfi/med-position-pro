import React, { useState } from "react";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Radar as RadarIcon, RefreshCw, Target, Eye, Zap } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Concorrente {
  tipo_perfil: string;
  estrategia: string;
  ponto_fraco: string;
}
interface Lacuna {
  tema: string;
  oportunidade: string;
  potencial: string;
}
interface Diferencial {
  diferencial: string;
  como_aplicar: string;
  impacto_esperado: string;
}
interface RadarData {
  panorama: string;
  concorrentes_referencia: Concorrente[];
  lacunas: Lacuna[];
  diferenciais_sugeridos: Diferencial[];
}

const RadarPage = () => {
  const { profile } = useDoctor();
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!profile?.especialidade) {
      toast.error("Configure sua especialidade no perfil primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-ideas", {
        body: { mode: "radar", especialidade: profile.especialidade, publico_alvo: profile.publicoAlvo },
      });
      if (error) throw error;
      setData(result as RadarData);
    } catch (err: any) {
      toast.error(err.message || "Erro ao analisar concorrência.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Radar de Concorrentes
          </h1>
          <p className="text-muted-foreground text-sm">
            Análise inteligente do cenário competitivo na sua especialidade.
          </p>
        </div>

        <Button onClick={generate} disabled={loading} className="mb-8 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analisando...</> : <><RadarIcon className="h-4 w-4 mr-2" /> Analisar concorrência</>}
        </Button>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          </div>
        )}

        {!loading && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Panorama */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-accent" /> Panorama
              </h2>
              <p className="text-sm text-muted-foreground">{data.panorama}</p>
            </div>

            {/* Concorrentes */}
            {data.concorrentes_referencia?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" /> Perfis de Referência
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.concorrentes_referencia.map((c, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-2">{c.tipo_perfil}</h3>
                      <p className="text-xs text-muted-foreground mb-1"><span className="font-medium text-emerald-600">✓ Estratégia:</span> {c.estrategia}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-medium text-red-500">✗ Ponto fraco:</span> {c.ponto_fraco}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lacunas */}
            {data.lacunas?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" /> Lacunas de Conteúdo
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.lacunas.map((l, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground">{l.tema}</h3>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${l.potencial === "alto" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {l.potencial}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{l.oportunidade}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diferenciais */}
            {data.diferenciais_sugeridos?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3">Diferenciais Sugeridos</h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.diferenciais_sugeridos.map((d, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{d.diferencial}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{d.como_aplicar}</p>
                      <p className="text-xs text-accent font-medium">{d.impacto_esperado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center py-16 text-center">
            <RadarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm">
              Clique para analisar o cenário competitivo da sua especialidade e descobrir oportunidades.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default RadarPage;
