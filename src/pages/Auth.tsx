import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            {isSignUp ? "Crie sua conta" : "Bem-vinda de volta"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp
              ? "Comece a construir seu posicionamento estratégico."
              : "Continue de onde parou."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dra. Maria Silva"
                required
                className="h-11 rounded-xl"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
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
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
          <button
            className="text-accent hover:underline font-medium"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>

        <button
          className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          ← Voltar ao início
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
