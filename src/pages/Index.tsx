import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/40">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <span className="font-heading text-2xl text-foreground tracking-tight">Medshift</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/auth")}
          >
            Entrar
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <div className="container max-w-3xl mx-auto">
          <motion.p
            className="text-sm tracking-widest uppercase text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Plataforma de posicionamento médico
          </motion.p>
          <motion.h1
            className="font-heading text-display-sm md:text-display text-foreground leading-[1.1] mb-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Posicione-se com inteligência antes de criar qualquer conteúdo
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Transforme seu Instagram em um ativo estratégico de autoridade, diferenciação e conversão.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-sm font-medium rounded-lg"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Começar diagnóstico
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Gratuito para começar</span>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Como funciona */}
      <section className="py-28 px-6">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm tracking-widest uppercase text-muted-foreground mb-3">Processo</p>
            <h2 className="font-heading text-display-sm text-foreground">
              Três etapas para um posicionamento claro
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Diagnóstico",
                desc: "Entendemos quem você é, o que comunica e como é percebida no mercado.",
              },
              {
                step: "02",
                title: "Estratégia",
                desc: "Definimos posicionamento, tom de voz e pilares editoriais com precisão.",
              },
              {
                step: "03",
                title: "Conteúdo",
                desc: "Geramos conteúdo estratégico alinhado ao seu posicionamento e objetivos.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                <h3 className="font-heading text-2xl text-foreground mt-2 mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-border/40" />

      {/* Para quem é */}
      <section className="py-28 px-6">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm tracking-widest uppercase text-muted-foreground mb-3">Para quem</p>
            <h2 className="font-heading text-display-sm text-foreground max-w-2xl">
              Para médicas que valorizam estratégia antes da execução
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "Desejam se diferenciar no mercado",
              "Buscam autoridade e reconhecimento",
              "Querem conteúdo com profundidade",
              "Valorizam estratégia antes da execução",
            ].map((text, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-4 py-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <span className="text-foreground">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-border/40" />

      {/* O que entrega */}
      <section className="py-28 px-6">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm tracking-widest uppercase text-muted-foreground mb-3">Entregas</p>
            <h2 className="font-heading text-display-sm text-foreground">
              O que a plataforma entrega
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {[
              {
                title: "Diagnóstico de posicionamento",
                desc: "Análise profunda de como você é percebida e onde estão as oportunidades.",
              },
              {
                title: "Definição de público ideal",
                desc: "Clareza sobre quem você realmente quer atrair e converter.",
              },
              {
                title: "Estratégia editorial",
                desc: "Pilares de conteúdo, tom de voz e arquétipo alinhados ao seu posicionamento.",
              },
              {
                title: "Conteúdo estratégico",
                desc: "Produção guiada por tese, percepção e objetivo — nunca aleatória.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <h3 className="font-heading text-xl text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-border/40" />

      {/* CTA Final */}
      <section className="py-28 px-6">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-display-sm text-foreground mb-6">
              Pronta para posicionar com inteligência?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Comece com um diagnóstico estratégico do seu posicionamento atual.
            </p>
            <Button
              size="lg"
              className="h-12 px-8 text-sm font-medium rounded-lg"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Começar agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/40">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-heading text-lg text-foreground">Medshift</span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;