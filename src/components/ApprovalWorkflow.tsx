import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  RotateCcw,
  Send,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";

/* ── Types ── */

type ApprovalStatus = "rascunho" | "em_revisao" | "aprovado" | "ajustar" | "pronto";

interface Approval {
  id: string;
  status: ApprovalStatus;
  reviewer_name: string | null;
  notes: string | null;
  updated_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  author_role: string;
  comment: string;
  slide_number: number | null;
  version_label: string | null;
  resolved: boolean;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  actor_name: string;
  action: string;
  details: any;
  created_at: string;
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  rascunho: { label: "Rascunho", color: "bg-secondary text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  em_revisao: { label: "Em revisão", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Eye className="h-3 w-3" /> },
  aprovado: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  ajustar: { label: "Ajustar", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <RotateCcw className="h-3 w-3" /> },
  pronto: { label: "Pronto", color: "bg-accent/10 text-accent", icon: <Check className="h-3 w-3" /> },
};

const TRANSITIONS: Record<ApprovalStatus, { label: string; target: ApprovalStatus; variant: "default" | "outline" }[]> = {
  rascunho: [
    { label: "Solicitar revisão", target: "em_revisao", variant: "outline" },
  ],
  em_revisao: [
    { label: "Aprovar", target: "aprovado", variant: "default" },
    { label: "Devolver", target: "ajustar", variant: "outline" },
  ],
  aprovado: [
    { label: "Marcar pronto", target: "pronto", variant: "default" },
    { label: "Reabrir", target: "em_revisao", variant: "outline" },
  ],
  ajustar: [
    { label: "Enviar revisão", target: "em_revisao", variant: "outline" },
  ],
  pronto: [
    { label: "Reabrir", target: "em_revisao", variant: "outline" },
  ],
};

interface ApprovalWorkflowProps {
  contentOutputId: string;
  compact?: boolean;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.rascunho;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function ApprovalWorkflow({ contentOutputId, compact }: ApprovalWorkflowProps) {
  const { user } = useAuth();
  const [approval, setApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [slideFilter, setSlideFilter] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transitionNotes, setTransitionNotes] = useState("");

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  const load = useCallback(async () => {
    if (!user || !contentOutputId) return;
    setLoading(true);
    const [appRes, comRes, actRes] = await Promise.all([
      supabase.from("content_approvals").select("*").eq("content_output_id", contentOutputId).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("content_comments").select("*").eq("content_output_id", contentOutputId).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("content_activity_log").select("*").eq("content_output_id", contentOutputId).eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (appRes.data && appRes.data.length > 0) {
      const a = appRes.data[0] as any;
      setApproval({ id: a.id, status: a.status, reviewer_name: a.reviewer_name, notes: a.notes, updated_at: a.updated_at });
    } else {
      // Auto-create rascunho
      const { data } = await supabase.from("content_approvals").insert({ content_output_id: contentOutputId, user_id: user.id, status: "rascunho" } as any).select().single();
      if (data) {
        const d = data as any;
        setApproval({ id: d.id, status: "rascunho", reviewer_name: null, notes: null, updated_at: d.updated_at });
      }
    }
    setComments((comRes.data || []).map((c: any) => ({ id: c.id, author_name: c.author_name, author_role: c.author_role, comment: c.comment, slide_number: c.slide_number, version_label: c.version_label, resolved: c.resolved, created_at: c.created_at })));
    setActivity((actRes.data || []).map((a: any) => ({ id: a.id, actor_name: a.actor_name, action: a.action, details: a.details, created_at: a.created_at })));
    setLoading(false);
  }, [user, contentOutputId]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (target: ApprovalStatus) => {
    if (!approval || !user) return;
    const oldStatus = approval.status;
    await supabase.from("content_approvals").update({ status: target, notes: transitionNotes || null, reviewer_name: userName } as any).eq("id", approval.id);
    await supabase.from("content_activity_log").insert({ content_output_id: contentOutputId, user_id: user.id, actor_name: userName, action: `${oldStatus} → ${target}`, details: { notes: transitionNotes || null } } as any);
    setTransitionNotes("");
    toast.success(`Status alterado para "${STATUS_CONFIG[target].label}"`);
    load();
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("content_comments").insert({ content_output_id: contentOutputId, user_id: user.id, author_name: userName, author_role: "equipe", comment: newComment, slide_number: slideFilter } as any);
    await supabase.from("content_activity_log").insert({ content_output_id: contentOutputId, user_id: user.id, actor_name: userName, action: "comentou", details: { slide: slideFilter, preview: newComment.slice(0, 80) } } as any);
    setNewComment("");
    toast.success("Comentário adicionado");
    load();
  };

  const resolveComment = async (id: string) => {
    if (!user) return;
    await supabase.from("content_comments").update({ resolved: true } as any).eq("id", id);
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  };

  if (loading) return <div className="surface-card p-4 animate-pulse h-24" />;

  const currentStatus = (approval?.status || "rascunho") as ApprovalStatus;
  const transitions = TRANSITIONS[currentStatus] || [];
  const unresolvedCount = comments.filter(c => !c.resolved).length;
  const filteredComments = slideFilter != null ? comments.filter(c => c.slide_number === slideFilter) : comments;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ApprovalStatusBadge status={currentStatus} />
        {unresolvedCount > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {unresolvedCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status + transitions */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-label uppercase tracking-wider text-muted-foreground/60">Workflow</h3>
          <ApprovalStatusBadge status={currentStatus} />
        </div>

        {/* Transition notes */}
        {transitions.length > 0 && (
          <div className="space-y-2">
            <Textarea
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="Observações da transição (opcional)…"
              rows={2}
              className="text-[13px] resize-none bg-background border-border/60"
            />
            <div className="flex gap-2">
              {transitions.map((t) => (
                <Button
                  key={t.target}
                  variant={t.variant}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => changeStatus(t.target)}
                >
                  {STATUS_CONFIG[t.target].icon} {t.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" />
            Comentários
            {unresolvedCount > 0 && (
              <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm ml-1">{unresolvedCount}</span>
            )}
          </h3>
          {slideFilter != null && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => setSlideFilter(null)}>
              Slide {slideFilter} <X className="h-2.5 w-2.5 ml-1" />
            </Button>
          )}
        </div>

        {/* Add comment */}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar comentário…"
            rows={2}
            className="text-[13px] resize-none bg-background border-border/60 flex-1"
          />
          <Button size="icon" className="h-auto w-9 bg-accent text-accent-foreground hover:bg-accent/90" onClick={addComment} disabled={!newComment.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Comment list */}
        <AnimatePresence>
          {filteredComments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-md text-[13px] space-y-1 ${c.resolved ? "surface-inset opacity-60" : "bg-background border border-border/50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{c.author_name || "Equipe"}</span>
                  <span className="text-[10px] text-muted-foreground/50">{c.author_role}</span>
                  {c.slide_number && (
                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground">
                      Slide {c.slide_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground/40">
                    {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {!c.resolved && (
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-accent" onClick={() => resolveComment(c.id)} title="Resolver">
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{c.comment}</p>
              {c.resolved && <span className="text-[10px] text-accent">✓ Resolvido</span>}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredComments.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum comentário ainda.</p>
        )}
      </div>

      {/* Activity History */}
      <div className="surface-card p-5">
        <button
          className="w-full flex items-center justify-between text-label uppercase tracking-wider text-muted-foreground/60"
          onClick={() => setShowHistory(!showHistory)}
        >
          <span>Histórico</span>
          {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-[12px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{a.actor_name}</span>
                      <span className="text-muted-foreground ml-1">{a.action}</span>
                      {a.details?.notes && (
                        <p className="text-muted-foreground/60 mt-0.5 truncate">&ldquo;{a.details.notes}&rdquo;</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0">
                      {new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-3">Sem atividade registrada.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
