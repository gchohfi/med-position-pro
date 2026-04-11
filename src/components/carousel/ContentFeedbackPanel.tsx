import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, MessageSquare, Star, X } from "lucide-react";
import {
  OUTCOME_OPTIONS,
  saveFeedback,
  type OutcomeTag,
  type ContentFeedback,
} from "@/lib/content-feedback";
import type { BenchmarkPresetId } from "@/lib/benchmark-presets";
import type { PreferredVisualStyle } from "@/types/carousel";
import { toast } from "sonner";

interface ContentFeedbackPanelProps {
  userId: string;
  contentOutputId: string | null;
  benchmarkPreset: BenchmarkPresetId;
  visualStyle: PreferredVisualStyle;
  onComplete?: () => void;
}

const ScoreSelector: React.FC<{
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`h-7 w-7 rounded-md text-xs font-medium transition-all ${
            value && n <= value
              ? "bg-accent text-accent-foreground"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const ContentFeedbackPanel: React.FC<ContentFeedbackPanelProps> = ({
  userId,
  contentOutputId,
  benchmarkPreset,
  visualStyle,
  onComplete,
}) => {
  const [selectedTags, setSelectedTags] = useState<OutcomeTag[]>([]);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [clarityScore, setClarityScore] = useState<number | null>(null);
  const [authorityScore, setAuthorityScore] = useState<number | null>(null);
  const [aestheticScore, setAestheticScore] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showScores, setShowScores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: OutcomeTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (selectedTags.length === 0 && !satisfaction) {
      toast.error("Selecione ao menos um resultado ou nota.");
      return;
    }
    setSaving(true);
    const feedback: ContentFeedback = {
      user_id: userId,
      content_output_id: contentOutputId,
      benchmark_preset: benchmarkPreset,
      visual_style: visualStyle,
      outcome_tags: selectedTags,
      satisfaction,
      clarity_score: clarityScore,
      authority_score: authorityScore,
      aesthetic_score: aestheticScore,
      posted: selectedTags.some((t) =>
        ["gerou_comentarios", "gerou_salvamentos", "gerou_leads", "funcionou_muito_bem"].includes(t)
      ),
      reuse_direction: selectedTags.includes("reusar_linha"),
      notes: notes.trim() || null,
    };

    const id = await saveFeedback(feedback);
    setSaving(false);
    if (id) {
      setSaved(true);
      toast.success("Feedback registrado!");
      onComplete?.();
    } else {
      toast.error("Erro ao salvar feedback.");
    }
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10"
      >
        <Check className="h-4 w-4 text-accent" />
        <p className="text-xs text-foreground font-medium">Feedback registrado — obrigado!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-accent" />
        <h4 className="text-sm font-semibold text-foreground">Como foi o resultado?</h4>
      </div>

      {/* Outcome tags */}
      <div className="flex flex-wrap gap-1.5">
        {OUTCOME_OPTIONS.map((opt) => (
          <button
            key={opt.tag}
            onClick={() => toggleTag(opt.tag)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-all border ${
              selectedTags.includes(opt.tag)
                ? "bg-foreground text-background border-foreground"
                : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
            }`}
          >
            <span className="mr-1">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Satisfaction */}
      <ScoreSelector label="Satisfação geral" value={satisfaction} onChange={setSatisfaction} />

      {/* Detailed scores toggle */}
      <button
        onClick={() => setShowScores(!showScores)}
        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {showScores ? "Menos detalhes ↑" : "Mais detalhes ↓"}
      </button>

      <AnimatePresence>
        {showScores && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <ScoreSelector label="Clareza" value={clarityScore} onChange={setClarityScore} />
            <ScoreSelector label="Autoridade" value={authorityScore} onChange={setAuthorityScore} />
            <ScoreSelector label="Estética" value={aestheticScore} onChange={setAestheticScore} />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="text-xs"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving || (selectedTags.length === 0 && !satisfaction)}
        size="sm"
        className="w-full text-xs h-9 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {saving ? "Salvando…" : "Registrar feedback"}
      </Button>
    </motion.div>
  );
};

export default ContentFeedbackPanel;
