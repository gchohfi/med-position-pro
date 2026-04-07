import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent } from "@/lib/strategic-events";
import { isValidInstagramHandle, normalizeInstagramHandle } from "@/lib/inspiration";
import {
  Instagram,
  Plus,
  Trash2,
  TrendingUp,
  Eye,
  RefreshCw,
  Loader2,
  Users,
  Target,
  X,
  Crown,
  AlertTriangle,
  Shield,
  Compass,
  Zap,
  Check,
  ArrowRight,
  Radio,
  User,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

/* ─── Interfaces ─── */
interface TrackedProfile {
  id: string;
  username: string;
  profile_type: "own" | "competitor";
  display_name: string | null;
  bio: string | null;
  followers_count: number | null;
  media_count: number | null;
  last_synced_at: string | null;
}

interface IntelResult {
  narrativa_dominante: string;
  percepcao_transmitida: string;
  seu_perfil: {
    formatos_mais_usados: string[];
    sinais_autoridade: string[];
    sinais_comoditizacao: string[];
    excesso_atual: string;
    lacunas: string;
  };
  concorrentes: {
    narrativas_repetidas: string[];
    promessa_dominante: string;
    formatos_saturados: string[];
    angulos_mais_usados: string[];
    territorios_superexplorados: string[];
    espacos_pouco_ocupados: string[];
  };
  sinais_mercado: {
    reforcam_autoridade: string[];
    saturadas: string[];
    comoditizam: string[];
    white_space: string[];
    movimentos_recentes: string[];
  };
  direcao_recomendada: {
    reforcar: string[];
    evitar: string[];
    testar: string[];
    reposicionar: string[];
  };
  risco_atual: string;
  mudou_esta_semana: string[];
}

/* ─── Signal Tag ─── */
function SignalTag({
  label,
  type,
}: {
  label: string;
  type: "authority" | "saturated" | "commodity" | "whitespace" | "neutral";
}) {
  const colors = {
    authority: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    saturated: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    commodity: "bg-red-500/10 text-red-700 border-red-500/20",
    whitespace: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-block text-[11px] px-2.5 py-1 rounded-full border font-medium ${colors[type]}`}
    >
      {label}
    </span>
  );
}

/* ─── Direction Card ─── */
function DirectionCard({
  title,
  items,
  icon: Icon,
  accentColor,
  bgColor,
  borderColor,
}: {
  title: string;
  items: string[];
  icon: any;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accentColor}`} />
        <h4
          className={`text-[10px] font-semibold ${accentColor} uppercase tracking-wider`}
        >
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground flex items-start gap-2">
            <ArrowRight className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Loading Messages ─── */
const LOADING_MESSAGES = [
  "Analisando narrativas do mercado…",
  "Identificando saturação e white space…",
  "Classificando direções estratégicas…",
  "Comparando posicionamento vs concorrentes…",
  "Gerando julgamento estratégico…",
];

/* ─── Main Component ─── */
const RadarInstagram = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State — profiles
  const [profiles, setProfiles] = useState<TrackedProfile[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newProfileType, setNewProfileType] = useState<"own" | "competitor">(
    "competitor"
  );
  const [addingProfile, setAddingProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // State — analysis
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [intel, setIntel] = useState<IntelResult | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  /* ─── Effects ─── */
  useEffect(() => {
    if (user) {
      loadProfiles();
      loadAnalysis();
    }
  }, [user]);

  useEffect(() => {
    if (!generating) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((p) => (p + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  /* ─── Data loading ─── */
  const loadProfiles = async () => {
    const { data: tracked } = await supabase
      .from("instagram_tracked_profiles" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    if (tracked) {
      const normalized = (tracked as any[]).map((p) => ({
        ...p,
        username: normalizeInstagramHandle(String(p.username || "")),
      }));
      setProfiles(normalized as unknown as TrackedProfile[]);
    }
  };

  const loadAnalysis = async () => {
    setLoading(true);
    const { data: analysis } = await supabase
      .from("instagram_analyses" as any)
      .select("*")
      .eq("user_id", user!.id)
      .eq("analysis_type", "full")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis) {
      const raw = (analysis as any).raw_data || {};
      if (raw.full_result) {
        setIntel(raw.full_result as IntelResult);
        setUpdatedAt((analysis as any).updated_at);
      }
    }
    setLoading(false);
  };

  /* ─── Profile management ─── */
  const addProfile = async () => {
    if (!newUsername.trim()) return;
    const clean = normalizeInstagramHandle(newUsername);
    if (!isValidInstagramHandle(clean)) {
      toast.error("Username inválido. Digite apenas o @handle do Instagram.");
      return;
    }

    const ownCount = profiles.filter((p) => p.profile_type === "own").length;
    const compCount = profiles.filter(
      (p) => p.profile_type === "competitor"
    ).length;

    if (newProfileType === "own" && ownCount >= 1) {
      toast.error("Você já tem um perfil próprio cadastrado.");
      return;
    }
    if (newProfileType === "competitor" && compCount >= 5) {
      toast.error("Limite de 5 perfis concorrentes atingido.");
      return;
    }
    if (
      profiles.some(
        (p) => normalizeInstagramHandle(p.username).toLowerCase() === clean.toLowerCase()
      )
    ) {
      toast.error("Este perfil já está sendo monitorado.");
      return;
    }

    setAddingProfile(true);
    try {
      const { error } = await supabase
        .from("instagram_tracked_profiles" as any)
        .insert({
          user_id: user!.id,
          username: clean,
          profile_type: newProfileType,
        } as any);

      if (error) throw error;

      setNewUsername("");
      setShowAddForm(false);
      await loadProfiles();
      toast.success(
        `@${clean} adicionado como ${
          newProfileType === "own" ? "perfil próprio" : "concorrente"
        }.`
      );
    } catch (err: unknown) {
      console.error("Erro ao adicionar perfil:", err);
      toast.error("Erro ao adicionar perfil. Tente novamente.");
    } finally {
      setAddingProfile(false);
    }
  };

  const removeProfile = async (id: string, username: string) => {
    const { error } = await supabase
      .from("instagram_tracked_profiles" as any)
      .delete()
      .eq("id", id);
    if (!error) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast.success(`@${username} removido.`);
    }
  };

  /* ─── Generate analysis ─── */
  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? supabaseKey;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-instagram-intel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Erro na geração");
      }
      const result = await res.json();

      if (result.intel) {
        setIntel(result.intel as IntelResult);
        setUpdatedAt(new Date().toISOString());
        logStrategicEvent("instagram_intel_generated", "instagram_radar");
        toast.success("Radar de mercado atualizado.");
      }
    } catch (err: unknown) {
      console.error("Generate error:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar análise. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const ownProfile = profiles.find((p) => p.profile_type === "own");
  const competitors = profiles.filter((p) => p.profile_type === "competitor");

  /* ─── Render: Loading ─── */
  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-4xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <Skeleton className="h-4 w-40 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ─── Render: Main ─── */
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl space-y-8">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-1 flex items-center gap-2">
                <Radio className="h-7 w-7 text-accent" />
                Radar de Mercado
              </h1>
              <p className="text-muted-foreground text-sm">
                O que seu conteúdo reforça, o que o mercado repete e para onde
                mover seu posicionamento.
              </p>
            </div>
            <Button
              onClick={generateAnalysis}
              disabled={generating}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {generating
                ? "Analisando…"
                : intel
                ? "Atualizar radar"
                : "Gerar análise"}
            </Button>
          </div>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Última análise:{" "}
              {new Date(updatedAt).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </motion.div>

        {/* ─── Tracked Profiles ─── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-heading text-lg font-medium text-foreground">
                Perfis monitorados
              </h2>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {profiles.length} perfil{profiles.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? (
                <X className="mr-1.5 h-3 w-3" />
              ) : (
                <Plus className="mr-1.5 h-3 w-3" />
              )}
              {showAddForm ? "Cancelar" : "Adicionar perfil"}
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <motion.div
              className="bg-card rounded-2xl border border-accent/20 p-5 mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Username ou link do Instagram
                  </label>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="@usuario ou https://instagram.com/usuario"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      onKeyDown={(e) => e.key === "Enter" && addProfile()}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Tipo
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewProfileType("own")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newProfileType === "own"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Crown className="inline h-3 w-3 mr-1" />
                      Meu perfil
                    </button>
                    <button
                      onClick={() => setNewProfileType("competitor")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newProfileType === "competitor"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Users className="inline h-3 w-3 mr-1" />
                      Concorrente
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={addProfile}
                    disabled={addingProfile || !newUsername.trim()}
                    size="sm"
                    className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {addingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile list */}
          {profiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-card rounded-xl border border-border p-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          profile.profile_type === "own"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {profile.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          @{profile.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {profile.profile_type === "own" ? (
                            <span className="text-accent">Meu perfil</span>
                          ) : (
                            "Concorrente"
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeProfile(profile.id, profile.username)
                      }
                      className="text-muted-foreground/50 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ─── Generating state ─── */}
        {generating && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </motion.div>
        )}

        {/* ─── Empty state ─── */}
        {!intel && !generating && (
          <motion.div
            className="flex flex-col items-center py-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Radio className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Radar de mercado em espera
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              {profiles.length === 0
                ? "Adicione perfis para monitorar e gere sua primeira leitura estratégica."
                : "Clique em gerar análise para receber sua leitura de posicionamento."}
            </p>
            {profiles.length > 0 && (
              <Button
                onClick={generateAnalysis}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Zap className="mr-2 h-4 w-4" />
                Gerar primeira análise
              </Button>
            )}
          </motion.div>
        )}

        {/* ─── Analysis Results ─── */}
        {intel && !generating && (
          <>
            {/* 1. Narrativa Dominante */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-accent" />
                <h2 className="font-heading text-lg font-medium text-foreground">
                  Narrativa dominante atual
                </h2>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed">
                  {intel.narrativa_dominante}
                </p>
              </div>
            </motion.section>

            {/* 2. Percepção Transmitida */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1.5}
            >
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-accent" />
                <h2 className="font-heading text-lg font-medium text-foreground">
                  Percepção transmitida
                </h2>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed">
                  {intel.percepcao_transmitida}
                </p>
              </div>
            </motion.section>

            {/* 3. Seu Perfil */}
            {intel.seu_perfil && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Seu perfil
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  {/* Sinais de autoridade */}
                  {intel.seu_perfil.sinais_autoridade?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-2">
                        Sinais de autoridade
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {intel.seu_perfil.sinais_autoridade.map((s, i) => (
                          <SignalTag key={i} label={s} type="authority" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sinais de comoditização */}
                  {intel.seu_perfil.sinais_comoditizacao?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mb-2">
                        Sinais de comoditização
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {intel.seu_perfil.sinais_comoditizacao.map((s, i) => (
                          <SignalTag key={i} label={s} type="commodity" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Excesso e Lacunas */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {intel.seu_perfil.excesso_atual && (
                      <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-1">
                          Excesso atual
                        </p>
                        <p className="text-xs text-foreground">
                          {intel.seu_perfil.excesso_atual}
                        </p>
                      </div>
                    )}
                    {intel.seu_perfil.lacunas && (
                      <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                        <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-1">
                          Lacunas
                        </p>
                        <p className="text-xs text-foreground">
                          {intel.seu_perfil.lacunas}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Formatos mais usados */}
                  {intel.seu_perfil.formatos_mais_usados?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                        Formatos mais usados
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {intel.seu_perfil.formatos_mais_usados.map((f, i) => (
                          <SignalTag key={i} label={f} type="neutral" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 4. Concorrentes */}
            {intel.concorrentes && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2.5}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Leitura de mercado
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  {/* Promessa dominante */}
                  {intel.concorrentes.promessa_dominante && (
                    <div className="border-l-2 border-accent pl-4">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                        Promessa dominante do segmento
                      </p>
                      <p className="text-sm text-foreground italic">
                        "{intel.concorrentes.promessa_dominante}"
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Narrativas repetidas */}
                    {intel.concorrentes.narrativas_repetidas?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-2">
                          Narrativas mais repetidas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {intel.concorrentes.narrativas_repetidas.map(
                            (n, i) => (
                              <SignalTag key={i} label={n} type="saturated" />
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Espaços pouco ocupados */}
                    {intel.concorrentes.espacos_pouco_ocupados?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-2">
                          Espaços pouco ocupados
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {intel.concorrentes.espacos_pouco_ocupados.map(
                            (e, i) => (
                              <SignalTag key={i} label={e} type="whitespace" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Territórios superexplorados */}
                  {intel.concorrentes.territorios_superexplorados?.length >
                    0 && (
                    <div>
                      <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mb-2">
                        Territórios superexplorados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {intel.concorrentes.territorios_superexplorados.map(
                          (t, i) => (
                            <SignalTag key={i} label={t} type="commodity" />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 5. Sinais do Mercado */}
            {intel.sinais_mercado && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Sinais do mercado
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  {/* Reforçam autoridade */}
                  {intel.sinais_mercado.reforcam_autoridade?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-2">
                        Direções que reforçam autoridade
                      </p>
                      <ul className="space-y-1.5">
                        {intel.sinais_mercado.reforcam_autoridade.map(
                          (d, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground flex items-start gap-2"
                            >
                              <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                              <span>{d}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Saturadas */}
                  {intel.sinais_mercado.saturadas?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-2">
                        Direções saturadas
                      </p>
                      <ul className="space-y-1.5">
                        {intel.sinais_mercado.saturadas.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground flex items-start gap-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* White space */}
                  {intel.sinais_mercado.white_space?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-2">
                        White space estratégico
                      </p>
                      <ul className="space-y-1.5">
                        {intel.sinais_mercado.white_space.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground flex items-start gap-2"
                          >
                            <Compass className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Comoditizam */}
                  {intel.sinais_mercado.comoditizam?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mb-2">
                        Direções que comoditizam
                      </p>
                      <ul className="space-y-1.5">
                        {intel.sinais_mercado.comoditizam.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground flex items-start gap-2"
                          >
                            <X className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Movimentos recentes */}
                  {intel.sinais_mercado.movimentos_recentes?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                        Movimentos recentes
                      </p>
                      <ul className="space-y-1.5">
                        {intel.sinais_mercado.movimentos_recentes.map(
                          (d, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground flex items-start gap-2"
                            >
                              <Zap className="w-3.5 h-3.5 mt-0.5 text-accent flex-shrink-0" />
                              <span>{d}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 6. Direção Recomendada */}
            {intel.direcao_recomendada && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3.5}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Direção recomendada
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <DirectionCard
                    title="Reforçar"
                    items={intel.direcao_recomendada.reforcar}
                    icon={Check}
                    accentColor="text-emerald-600"
                    bgColor="bg-emerald-500/5"
                    borderColor="border-emerald-500/15"
                  />
                  <DirectionCard
                    title="Evitar"
                    items={intel.direcao_recomendada.evitar}
                    icon={X}
                    accentColor="text-red-600"
                    bgColor="bg-red-500/5"
                    borderColor="border-red-500/15"
                  />
                  <DirectionCard
                    title="Testar"
                    items={intel.direcao_recomendada.testar}
                    icon={Zap}
                    accentColor="text-blue-600"
                    bgColor="bg-blue-500/5"
                    borderColor="border-blue-500/15"
                  />
                  <DirectionCard
                    title="Reposicionar"
                    items={intel.direcao_recomendada.reposicionar}
                    icon={RefreshCw}
                    accentColor="text-purple-600"
                    bgColor="bg-purple-500/5"
                    borderColor="border-purple-500/15"
                  />
                </div>
              </motion.section>
            )}

            {/* 7. Risco Atual */}
            {intel.risco_atual && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-red-500" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Risco atual
                  </h2>
                </div>
                <div className="bg-red-500/5 rounded-2xl border border-red-500/15 p-6">
                  <p className="text-sm text-foreground leading-relaxed">
                    {intel.risco_atual}
                  </p>
                </div>
              </motion.section>
            )}

            {/* 8. Mudou Esta Semana */}
            {intel.mudou_esta_semana && intel.mudou_esta_semana.length > 0 && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4.5}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Mudou esta semana
                  </h2>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <ul className="space-y-2">
                    {intel.mudou_esta_semana.map((m, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.section>
            )}

            {/* Footer */}
            <motion.div
              className="bg-muted/30 rounded-2xl border border-border p-4 flex items-center justify-between"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-xs text-muted-foreground">
                  Inteligência alimentada por pesquisa web em tempo real +
                  análise estratégica com IA.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={generateAnalysis}
                disabled={generating}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Atualizar
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default RadarInstagram;
