import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  BarChart3,
  Bookmark,
  Share2,
  MessageCircle,
  MousePointer,
  UserPlus,
  Clock,
  TrendingUp,
  Link2,
  Wifi,
  WifiOff,
  Plus,
} from "lucide-react";
import type {
  ContentPerformanceMetrics,
  ContentPerformanceRecord,
  PerformanceComparison,
} from "@/lib/instagram-performance";
import { formatMetricValue, METRIC_LABELS, comparePerformance } from "@/lib/instagram-performance";

// ─── Metric Icons Map ──────────────────────────────────────

const METRIC_ICONS: Record<keyof ContentPerformanceMetrics, typeof Eye> = {
  reach: Eye,
  impressions: BarChart3,
  saves: Bookmark,
  shares: Share2,
  comments: MessageCircle,
  clicks: MousePointer,
  follows: UserPlus,
  retentionRate: Clock,
  engagementRate: TrendingUp,
};

// ─── Performance Badge ─────────────────────────────────────

interface PerformanceBadgeProps {
  record: ContentPerformanceRecord | null;
  compact?: boolean;
}

export function PerformanceBadge({ record, compact }: PerformanceBadgeProps) {
  if (!record) {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1 rounded-full bg-secondary/50">
        <WifiOff className="h-2.5 w-2.5" />
        {!compact && "Sem métricas"}
      </Badge>
    );
  }

  const source = record.source;
  const hasData = record.metrics.reach != null || record.metrics.saves != null;

  return (
    <Badge
      variant="secondary"
      className={`text-[10px] gap-1 rounded-full ${
        hasData ? "bg-accent/10 text-accent" : "bg-secondary/50"
      }`}
    >
      {source === "instagram_api" ? <Wifi className="h-2.5 w-2.5" /> : <BarChart3 className="h-2.5 w-2.5" />}
      {!compact && (source === "manual" ? "Manual" : source === "instagram_api" ? "Instagram" : "CSV")}
    </Badge>
  );
}

// ─── Metrics Mini Row (for library cards) ──────────────────

interface MetricsMiniRowProps {
  metrics: ContentPerformanceMetrics;
}

export function MetricsMiniRow({ metrics }: MetricsMiniRowProps) {
  const items = [
    { key: "reach", value: metrics.reach },
    { key: "saves", value: metrics.saves },
    { key: "comments", value: metrics.comments },
    { key: "shares", value: metrics.shares },
  ].filter((i) => i.value != null) as { key: keyof ContentPerformanceMetrics; value: number }[];

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {items.map((item) => {
        const Icon = METRIC_ICONS[item.key];
        return (
          <div key={item.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Icon className="h-3 w-3" />
            <span>{formatMetricValue(item.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Predicted vs Actual Comparison ────────────────────────

interface PredictedVsActualProps {
  predictedScore: number | null;
  metrics: ContentPerformanceMetrics;
}

export function PredictedVsActual({ predictedScore, metrics }: PredictedVsActualProps) {
  const comparison = comparePerformance(predictedScore, metrics);

  if (comparison.verdict === "sem_dados") {
    return (
      <div className="text-[10px] text-muted-foreground/50 italic">
        Aguardando métricas para comparar com score previsto
      </div>
    );
  }

  const verdictConfig = {
    superou: { label: "Superou previsão", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    dentro: { label: "Dentro do esperado", color: "text-accent", bg: "bg-accent/10" },
    abaixo: { label: "Abaixo do previsto", color: "text-amber-500", bg: "bg-amber-500/10" },
    sem_dados: { label: "Sem dados", color: "text-muted-foreground", bg: "bg-secondary" },
  };

  const config = verdictConfig[comparison.verdict];

  return (
    <div className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg ${config.bg}`}>
      <TrendingUp className={`h-3 w-3 ${config.color}`} />
      <span className={config.color}>{config.label}</span>
      {comparison.delta != null && (
        <span className="text-muted-foreground">
          ({comparison.delta > 0 ? "+" : ""}{comparison.delta} pts)
        </span>
      )}
    </div>
  );
}

// ─── Manual Metrics Input Dialog ───────────────────────────

interface ManualMetricsDialogProps {
  contentOutputId: string;
  existingMetrics?: ContentPerformanceMetrics;
  onSave: (metrics: Partial<ContentPerformanceMetrics>, postUrl?: string) => void;
  children?: React.ReactNode;
}

export function ManualMetricsDialog({
  contentOutputId,
  existingMetrics,
  onSave,
  children,
}: ManualMetricsDialogProps) {
  const [open, setOpen] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [values, setValues] = useState<Partial<Record<keyof ContentPerformanceMetrics, string>>>({
    reach: existingMetrics?.reach?.toString() || "",
    impressions: existingMetrics?.impressions?.toString() || "",
    saves: existingMetrics?.saves?.toString() || "",
    shares: existingMetrics?.shares?.toString() || "",
    comments: existingMetrics?.comments?.toString() || "",
    clicks: existingMetrics?.clicks?.toString() || "",
    follows: existingMetrics?.follows?.toString() || "",
  });

  const handleSave = () => {
    const metrics: Partial<ContentPerformanceMetrics> = {};
    for (const [key, val] of Object.entries(values)) {
      if (val && !isNaN(Number(val))) {
        (metrics as any)[key] = Number(val);
      }
    }
    onSave(metrics, postUrl || undefined);
    setOpen(false);
  };

  const mainMetrics: (keyof ContentPerformanceMetrics)[] = [
    "reach", "impressions", "saves", "shares", "comments", "clicks", "follows",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
            <Plus className="h-3 w-3" />
            Adicionar métricas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Métricas de Performance</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Insira as métricas do Instagram Insights para este conteúdo.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post URL */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Link2 className="h-3 w-3" />
              URL do post (opcional)
            </Label>
            <Input
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="h-8 text-xs"
            />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            {mainMetrics.map((key) => {
              const meta = METRIC_LABELS[key];
              const Icon = METRIC_ICONS[key];
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </Label>
                  <Input
                    type="number"
                    value={values[key] || ""}
                    onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                    placeholder="—"
                    className="h-8 text-xs"
                  />
                </div>
              );
            })}
          </div>

          <Button onClick={handleSave} className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-9 text-sm">
            Salvar métricas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connection Status Banner ──────────────────────────────

export function InstagramConnectionStatus({ connected = false }: { connected?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${
        connected
          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
          : "bg-secondary/50 border-border text-muted-foreground"
      }`}
    >
      {connected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Instagram conectado — métricas sincronizando automaticamente</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Instagram não conectado — use entrada manual de métricas</span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full ml-auto">
            Em breve
          </Badge>
        </>
      )}
    </motion.div>
  );
}
