import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Bookmark,
  MessageCircle,
  Eye,
  Shield,
  Palette,
  Fingerprint,
  Target,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { PerformanceScore, ScoreAction } from "@/lib/performance-score";
import { getPreset, type BenchmarkPresetId } from "@/lib/benchmark-presets";

interface PerformanceScoreCardProps {
  score: PerformanceScore;
  onPresetSuggestion?: (presetId: BenchmarkPresetId) => void;
}

const DIMENSION_META: Record<string, { icon: typeof Zap; label: string }> = {
  hook: { icon: Zap, label: "Hook" },
  save: { icon: Bookmark, label: "Salvamento" },
  comment: { icon: MessageCircle, label: "Comentários" },
  clarity: { icon: Eye, label: "Clareza" },
  authority: { icon: Shield, label: "Autoridade" },
  visual: { icon: Palette, label: "Visual" },
  brandFit: { icon: Fingerprint, label: "Marca" },
  benchmarkFit: { icon: Target, label: "Preset Fit" },
};

const IMPACT_COLORS: Record<string, string> = {
  alto: "bg-accent/10 text-accent border-accent/20",
  medio: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  baixo: "bg-secondary text-muted-foreground border-border",
};

const VERDICT_CONFIG: Record<string, { color: string; bg: string; ring: string }> = {
  excelente: { color: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20" },
  forte: { color: "text-accent", bg: "bg-accent", ring: "ring-accent/20" },
  bom: { color: "text-blue-500", bg: "bg-blue-500", ring: "ring-blue-500/20" },
  mediano: { color: "text-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20" },
  fraco: { color: "text-red-500", bg: "bg-red-500", ring: "ring-red-500/20" },
};

function ScoreRing({ value, size = 72, strokeWidth = 5, config }: { value: number; size?: number; strokeWidth?: number; config: typeof VERDICT_CONFIG["bom"] }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={config.color}
          stroke="currentColor"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-heading text-lg font-bold ${config.color}`}>{value}</span>
      </div>
    </div>
  );
}

function MiniBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export default function PerformanceScoreCard({ score, onPresetSuggestion }: PerformanceScoreCardProps) {
  const config = VERDICT_CONFIG[score.verdict] || VERDICT_CONFIG.bom;

  const dimensions = useMemo(() => [
    { key: "hook", value: score.hook },
    { key: "save", value: score.save },
    { key: "comment", value: score.comment },
    { key: "clarity", value: score.clarity },
    { key: "authority", value: score.authority },
    { key: "visual", value: score.visual },
    { key: "brandFit", value: score.brandFit },
    { key: "benchmarkFit", value: score.benchmarkFit },
  ], [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header with main score */}
      <div className="p-5 pb-4 flex items-center gap-4">
        <ScoreRing value={score.overall} config={config} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className={`h-4 w-4 ${config.color}`} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Performance Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-heading text-lg font-semibold capitalize ${config.color}`}>
              {score.verdict}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {score.presetFitNote}
          </p>
        </div>
      </div>

      {/* Sub-scores grid */}
      <div className="px-5 pb-4 grid grid-cols-4 gap-3">
        {dimensions.map((dim) => {
          const meta = DIMENSION_META[dim.key];
          const Icon = meta.icon;
          const barColor = dim.value >= 75 ? "bg-emerald-500" : dim.value >= 55 ? "bg-accent" : dim.value >= 35 ? "bg-amber-500" : "bg-red-400";
          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{meta.label}</span>
              </div>
              <MiniBar value={dim.value} colorClass={barColor} />
              <span className="text-[10px] font-medium text-foreground">{dim.value}</span>
            </div>
          );
        })}
      </div>

      {/* Strengths & Weaknesses */}
      {(score.strengths.length > 0 || score.weaknesses.length > 0) && (
        <div className="px-5 pb-3 grid grid-cols-2 gap-3">
          {score.strengths.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Forças
              </span>
              {score.strengths.map((s, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-tight">{s}</p>
              ))}
            </div>
          )}
          {score.weaknesses.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-amber-500 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Pontos fracos
              </span>
              {score.weaknesses.map((w, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-tight">{w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {score.actions.length > 0 && (
        <div className="px-5 pb-4 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Ações sugeridas
          </span>
          {score.actions.map((action, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg border ${IMPACT_COLORS[action.impact]}`}
            >
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="flex-1">{action.label}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full shrink-0">
                {action.impact}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Preset suggestion */}
      {score.bestPresetFit !== undefined && onPresetSuggestion && (
        <div className="border-t border-border px-5 py-3">
          <button
            onClick={() => onPresetSuggestion(score.bestPresetFit)}
            className="w-full flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Target className="h-3 w-3 text-accent" />
            <span className="flex-1 text-left">{score.presetFitNote}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
