import React, { useState } from "react";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Globe, RefreshCw, TrendingUp, Layout, Brain } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Tendencia {
  tendencia: string;
  origem: string;
  exemplo: string;
  adaptacao_brasil: string;
}
interface Formato {
  formato: string;
  descricao: string;
  por_que_funciona: string;
  ideia_carrossel: string;
}
interface Insight {
  insight: string;
  acao: string;
}
interface BenchmarkData {
  tendencias_globais: Tendencia[];
  formatos_inovadores: Formato[];
  insights: Insight[];
}

const BenchmarkPage = () => {
  const { profile } = useDoctor();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!profile?.especialidade) {
      toast.error("Configure sua especialidade no perfil primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-ideas", {
        body: { mode: "benchmark", especialidade: profile.especialidade },
      });
      if (error) throw error;
      setData(result as BenchmarkData);
    } catch (err: any) {
      toast.error(err.message || "Erro ao pesquisar benchmarks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Benchmark Internacional
          </h1>
          <p className="text-muted-foreground text-sm">
            Referências globais de conteúdo médico para inspirar seus carrosséis.
          </p>
        </div>

        <Button onClick={generate} disabled={loading} className="mb-8 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Pesquisando...</> : <><Globe className="h-4 w-4 mr-2" /> Pesquisar tendências globais</>}
        </Button>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
        )}

        {!loading && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Tendências */}
            {data.tendencias_globais?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" /> Tendências Globais
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.tendencias_globais.map((t, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground">{t.tendencia}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">{t.origem}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{t.exemplo}</p>
                      <p className="text-xs text-accent font-medium">🇧🇷 {t.adaptacao_brasil}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formatos */}
            {data.formatos_inovadores?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-accent" /> Formatos Inovadores
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.formatos_inovadores.map((f, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{f.formato}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{f.descricao}</p>
                      <p className="text-xs text-muted-foreground/70 mb-2">
                        <span className="font-medium">Por quê funciona:</span> {f.por_que_funciona}
                      </p>
                      <div className="bg-secondary/50 rounded-lg p-3 mt-2">
                        <p className="text-xs font-medium text-foreground">💡 Ideia de carrossel:</p>
                        <p className="text-xs text-muted-foreground">{f.ideia_carrossel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {data.insights?.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" /> Insights Estratégicos
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.insights.map((ins, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5">
                      <p className="text-sm font-medium text-foreground mb-2">{ins.insight}</p>
                      <p className="text-xs text-accent">{ins.acao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm">
              Descubra o que os melhores perfis médicos do mundo estão fazendo e adapte para o seu conteúdo.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BenchmarkPage;
