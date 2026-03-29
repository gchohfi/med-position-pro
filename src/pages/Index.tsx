import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Lightbulb, PenTool, CheckCircle2, Users, TrendingUp, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <span className="font-heading text-xl font-semibold text-foreground tracking-tight">MedPositioning</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Uma plataforma que entende seu posicionamento antes de criar qualquer conteúdo
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Transforme seu Instagram em um ativo estratégico de autoridade, diferenciação e conversão.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              size="lg"
              className="h-13 px-8 text-base font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Começar diagnóstico
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-24 px-6">
        <div className="container max-w-5xl mx-auto">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            Como funciona
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Diagnóstico", desc: "Entendemos quem você é, o que comunica e como é percebida no mercado." },
              { icon: Lightbulb, title: "Estratégia", desc: "Definimos seu posicionamento, tom de voz e pilares editoriais com precisão." },
              { icon: PenTool, title: "Conteúdo", desc: "Geramos conteúdo estratégico alinhado ao seu posicionamento e objetivos." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-card rounded-2xl border border-border p-8 text-center shadow-sm hover:shadow-md transition-shadow"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            Para quem é
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            Para médicas que desejam construir um posicionamento forte, autoral e estratégico no Instagram — sem depender de fórmulas genéricas.
          </motion.p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              "Desejam se diferenciar no mercado",
              "Buscam autoridade e reconhecimento",
              "Querem conteúdo com profundidade",
              "Valorizam estratégia antes da execução",
            ].map((text, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 bg-card rounded-xl border border-border p-4"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 2}
              >
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-sm text-foreground">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* O que entrega */}
      <section className="py-24 px-6">
        <div className="container max-w-5xl mx-auto">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            O que a plataforma entrega
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Target, title: "Diagnóstico de posicionamento", desc: "Análise profunda de como você é percebida e onde estão as oportunidades." },
              { icon: Users, title: "Definição de público ideal", desc: "Clareza sobre quem você realmente quer atrair e converter." },
              { icon: TrendingUp, title: "Estratégia editorial", desc: "Pilares de conteúdo, tom de voz e arquétipo alinhados ao seu posicionamento." },
              { icon: Shield, title: "Conteúdo estratégico", desc: "Produção guiada por tese, percepção e objetivo — nunca aleatória." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-card rounded-2xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            Pronta para posicionar com inteligência?
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground mb-10 leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            Comece com um diagnóstico estratégico do seu posicionamento atual.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
          >
            <Button
              size="lg"
              className="h-13 px-8 text-base font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Começar agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MedPositioning. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
