import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PostMetrics } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, BarChart3, Loader2, Plus, Trash2 } from "lucide-react";

const STORAGE_KEY = "medshift-metricas";

const emptyMetric = (): PostMetrics => ({
  id: crypto.randomUUID(),
  post_url: "",
  data_publicacao: new Date().toISOString().split("T")[0],
  tipo: "carrossel",
  alcance: 0,
  impressoes: 0,
  curtidas: 0,
  comentarios: 0,
  salvamentos: 0,
  compartilhamentos: 0,
});

const Metricas = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<PostMetrics[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState<PostMetrics>(emptyMetric());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  const { text, loading: analyzing, error, start, reset } = useStreamingResponse({
    functionName: "agent-metricas",
    onComplete: () => {},
    onError: (err) => console.error("Erro na análise:", err),
  });

  const updateForm = <K extends keyof PostMetrics>(key: K, value: PostMetrics[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = () => {
    if (!form.data_publicacao) {
      toast.error("Informe a data de publicação.");
      return;
    }
    setMetrics((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    setForm(emptyMetric());
    toast.success("Métrica adicionada!");
  };

  const handleRemove = (id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAnalyze = () => {
    if (!profile || metrics.length === 0) return;
    start({ profile, metrics });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Métricas</h1>
        </div>
        <p className="text-muted-foreground">
          Registre métricas dos seus posts e receba análise de desempenho por IA.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de usar métricas.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Métrica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>URL do post</Label>
                    <Input
                      value={form.post_url || ""}
                      onChange={(e) => updateForm("post_url", e.target.value)}
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de publicação</Label>
                    <Input
                      type="date"
                      value={form.data_publicacao}
                      onChange={(e) => updateForm("data_publicacao", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={(v) => updateForm("tipo", v as PostMetrics["tipo"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carrossel">Carrossel</SelectItem>
                        <SelectItem value="reels">Reels</SelectItem>
                        <SelectItem value="imagem">Imagem</SelectItem>
                        <SelectItem value="stories">Stories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(
                    [
                      ["alcance", "Alcance"],
                      ["impressoes", "Impressões"],
                      ["curtidas", "Curtidas"],
                      ["comentarios", "Comentários"],
                      ["salvamentos", "Salvamentos"],
                      ["compartilhamentos", "Compartilh."],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form[key]}
                        onChange={(e) => updateForm(key, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>

            {/* Table */}
            {metrics.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    Métricas Registradas ({metrics.length})
                  </CardTitle>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    size="sm"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      "Analisar"
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Alcance</TableHead>
                          <TableHead className="text-right">Curtidas</TableHead>
                          <TableHead className="text-right">Coment.</TableHead>
                          <TableHead className="text-right">Salv.</TableHead>
                          <TableHead className="text-right">Comp.</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="text-sm">{m.data_publicacao}</TableCell>
                            <TableCell className="text-sm capitalize">{m.tipo}</TableCell>
                            <TableCell className="text-right text-sm">{m.alcance.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{m.curtidas.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{m.comentarios.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{m.salvamentos.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{m.compartilhamentos.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(m.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis result */}
            {error && (
              <Card className="border-red-500/50">
                <CardContent className="py-4 text-red-600">
                  Erro na análise: {error}
                </CardContent>
              </Card>
            )}

            {text && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Desempenho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {text}
                  </div>
                  {!analyzing && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
                      Limpar Análise
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Metricas;
