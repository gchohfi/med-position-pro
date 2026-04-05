import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, KeyRound } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Senha atualizada com sucesso.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <KeyRound className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Link inválido
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Este link de redefinição expirou ou é inválido. Solicite um novo.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Voltar para login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Senha atualizada
          </h1>
          <p className="text-muted-foreground text-sm">
            Redirecionando para o painel…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            Nova senha
          </h1>
          <p className="text-muted-foreground text-sm">
            Defina uma nova senha para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Nova senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="h-11 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Confirmar senha
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              minLength={6}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            {loading ? "Atualizando…" : "Definir nova senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
