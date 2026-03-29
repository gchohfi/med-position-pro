import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Target, Mic, Layers, BookOpen, Sparkles, ArrowRight, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

// Mock data — will be replaced by Supabase data from onboarding
const MOCK = {
  archetype: "A Especialista — autoridade técnica e profundidade",
  tone: "Direto e técnico",
  pillars: ["Educação em saúde", "Ciência e evidências", "Opinião e posicionamento"],
  opportunity: "Séries de carrosséis educativos sobre mitos da sua especialidade tendem a gerar alto engajamento neste mês.",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards = [
    { icon: Target, label: "Arquétipo predominante", value: MOCK.archetype },
    { icon: Mic, label: "Tom de voz", value: MOCK.tone },
    { icon: Layers, label: "Pilares editoriais", value: MOCK.pillars.join(" · ") },
    { icon: Sparkles, label: "Oportunidade estratégica do mês", value: MOCK.opportunity },
  ];

  const actions = [
    { label: "Gerar conteúdo", icon: PenTool, path: "/producao", primary: true },
    { label: "Analisar posicionamento", icon: Target, path: "#", disabled: true },
    { label: "Criar nova série", icon: BookOpen, path: "#", disabled: true },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Seu posicionamento
          </h1>
          <p className="text-muted-foreground mb-10">
            Visão estratégica do seu posicionamento atual.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <card.icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-foreground text-sm leading-relaxed">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.primary ? "default" : "outline"}
              className={`rounded-xl ${action.primary ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
              onClick={() => !action.disabled && navigate(action.path)}
              disabled={action.disabled}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
              {action.primary && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
