import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, name);
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (forgotSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm text-center"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Mail className="h-4 w-4 text-foreground" />
          </div>
          <h1 className="font-heading text-2xl text-foreground mb-2">E-mail enviado</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Se uma conta existir com <span className="text-foreground">{email}</span>, você receberá um link para redefinir sua senha.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowForgot(false); setForgotSent(false); }}
          >
            Voltar para login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="font-heading text-2xl text-foreground mb-2">Redefinir senha</h1>
            <p className="text-muted-foreground text-sm">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 text-sm">
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
          </form>

          <button
            className="flex items-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowForgot(false)}
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-secondary/50 border-r border-border/40 px-12">
        <div className="max-w-md">
          <span className="font-heading text-3xl text-foreground">Medshift</span>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Uma plataforma que entende seu posicionamento antes de criar qualquer conteúdo.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="font-heading text-2xl text-foreground mb-1">
              {isSignUp ? "Crie sua conta" : "Bem-vinda de volta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? "Comece a construir seu posicionamento estratégico."
                : "Continue de onde parou."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Nome completo</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dra. Maria Silva"
                  required
                  className="h-10"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-10"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Senha</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 text-sm mt-1">
              {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
            <button
              className="text-foreground hover:underline font-medium"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>

          <button
            className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate("/")}
          >
            ← Voltar ao início
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;