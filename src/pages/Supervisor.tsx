import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  TrendingUp,
  Zap,
  Layers,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const modules = [
  {
    label: "Análise de Perfil",
    icon: Users,
    path: "/analise-perfil",
    description: "Análise completa do seu perfil médico e presença digital.",
  },
  {
    label: "Concorrência",
    icon: Eye,
    path: "/concorrencia",
    description: "Análise de concorrentes e benchmarking no Instagram médico.",
  },
  {
    label: "Tendências",
    icon: TrendingUp,
    path: "/tendencias",
    description: "Tendências de conteúdo médico e oportunidades de pauta.",
  },
  {
    label: "Estratégia IA",
    icon: Zap,
    path: "/estrategia-ia",
    description: "Estratégia de conteúdo personalizada com IA generativa.",
  },
  {
    label: "Carrossel",
    icon: Layers,
    path: "/carrossel",
    description: "Geração de roteiros de carrossel com estrutura narrativa.",
  },
  {
    label: "Métricas",
    icon: BarChart3,
    path: "/metricas",
    description: "Registro e análise de métricas de desempenho dos posts.",
  },
];

const Supervisor = () => {
  const { isConfigured } = useDoctor();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supervisor - IA Squad Médico</h1>
            <p className="text-muted-foreground mt-1">
              Central de comando dos agentes de inteligência artificial.
            </p>
          </div>
          <Badge
            variant={isConfigured ? "default" : "destructive"}
            className="flex items-center gap-1 px-3 py-1"
          >
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Perfil Configurado
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                Perfil Pendente
              </>
            )}
          </Badge>
        </div>

        {!isConfigured && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil médico não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup para que os agentes possam gerar conteúdo personalizado.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Card key={mod.path} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <mod.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{mod.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>{mod.description}</CardDescription>
                <Button
                  className="w-full"
                  onClick={() => navigate(mod.path)}
                  disabled={!isConfigured && mod.path !== "/setup"}
                >
                  Iniciar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Supervisor;
