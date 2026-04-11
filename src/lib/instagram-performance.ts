/**
 * Instagram Performance Service Layer
 * Prepared for future Instagram API integration.
 * Currently supports manual input and CSV import.
 */

// ─── Types ─────────────────────────────────────────────────

export type InsightSource = "manual" | "instagram_api" | "csv_import";
export type SyncStatus = "pending" | "synced" | "error" | "not_connected";

export interface ContentPerformanceMetrics {
  reach: number | null;
  impressions: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  clicks: number | null;
  follows: number | null;
  retentionRate: number | null;
  engagementRate: number | null;
}

export interface ContentPerformanceRecord {
  id: string;
  userId: string;
  contentOutputId: string | null;
  externalPostId: string | null;
  externalPostUrl: string | null;
  publishedAt: string | null;
  source: InsightSource;
  syncStatus: SyncStatus;
  syncedAt: string | null;
  metrics: ContentPerformanceMetrics;
  predictedScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceComparison {
  predicted: number | null;
  actual: number | null;
  delta: number | null;
  verdict: "superou" | "dentro" | "abaixo" | "sem_dados";
}

// ─── Normalizers ───────────────────────────────────────────

/** Normalize raw DB row to typed record */
export function normalizePerformanceRow(row: any): ContentPerformanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    contentOutputId: row.content_output_id,
    externalPostId: row.external_post_id,
    externalPostUrl: row.external_post_url,
    publishedAt: row.published_at,
    source: row.source as InsightSource,
    syncStatus: row.sync_status as SyncStatus,
    syncedAt: row.synced_at,
    metrics: {
      reach: row.reach,
      impressions: row.impressions,
      saves: row.saves,
      shares: row.shares,
      comments: row.comments,
      clicks: row.clicks,
      follows: row.follows,
      retentionRate: row.retention_rate != null ? Number(row.retention_rate) : null,
      engagementRate: row.engagement_rate != null ? Number(row.engagement_rate) : null,
    },
    predictedScore: row.predicted_score,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert typed record back to DB insert shape */
export function toPerformanceInsert(
  userId: string,
  contentOutputId: string,
  metrics: Partial<ContentPerformanceMetrics>,
  opts?: {
    source?: InsightSource;
    externalPostUrl?: string;
    publishedAt?: string;
    predictedScore?: number;
    notes?: string;
  }
) {
  return {
    user_id: userId,
    content_output_id: contentOutputId,
    source: opts?.source || "manual",
    sync_status: "synced" as SyncStatus,
    synced_at: new Date().toISOString(),
    external_post_url: opts?.externalPostUrl || null,
    published_at: opts?.publishedAt || null,
    predicted_score: opts?.predictedScore || null,
    notes: opts?.notes || null,
    reach: metrics.reach ?? null,
    impressions: metrics.impressions ?? null,
    saves: metrics.saves ?? null,
    shares: metrics.shares ?? null,
    comments: metrics.comments ?? null,
    clicks: metrics.clicks ?? null,
    follows: metrics.follows ?? null,
    retention_rate: metrics.retentionRate ?? null,
    engagement_rate: metrics.engagementRate ?? null,
  };
}

// ─── Comparison engine ────────────────────────────────────

export function comparePerformance(
  predictedScore: number | null,
  metrics: ContentPerformanceMetrics
): PerformanceComparison {
  if (predictedScore == null || metrics.engagementRate == null) {
    return { predicted: predictedScore, actual: null, delta: null, verdict: "sem_dados" };
  }

  // Normalize engagement rate to 0-100 scale (typical IG engagement 1-10%)
  const actualNormalized = Math.min(100, Math.round(metrics.engagementRate * 10));
  const delta = actualNormalized - predictedScore;

  let verdict: PerformanceComparison["verdict"];
  if (delta > 10) verdict = "superou";
  else if (delta >= -10) verdict = "dentro";
  else verdict = "abaixo";

  return { predicted: predictedScore, actual: actualNormalized, delta, verdict };
}

// ─── Metric display helpers ───────────────────────────────

export function formatMetricValue(value: number | null, suffix = ""): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K${suffix}`;
  return `${value}${suffix}`;
}

export function calculateEngagementRate(metrics: ContentPerformanceMetrics): number | null {
  const { reach, saves, shares, comments } = metrics;
  if (!reach || reach === 0) return null;
  const interactions = (saves || 0) + (shares || 0) + (comments || 0);
  return Math.round((interactions / reach) * 10000) / 100; // 2 decimal places
}

// ─── Future: Instagram API connector scaffold ─────────────

/** Placeholder for future Instagram Graph API integration */
export interface InstagramConnectorConfig {
  accessToken: string;
  igUserId: string;
  businessAccountId: string;
}

/**
 * Future: Fetch insights for a specific post from Instagram Graph API.
 * This is a scaffold — actual implementation will call the Instagram Business API.
 */
export async function fetchPostInsights(
  _config: InstagramConnectorConfig,
  _postId: string
): Promise<ContentPerformanceMetrics> {
  // TODO: Implement when Instagram connector is available
  // Will call: GET /{post-id}/insights?metric=reach,impressions,saved,shares
  throw new Error("Instagram API integration not yet connected. Use manual input.");
}

/**
 * Future: Sync all recent posts and match with content_outputs.
 */
export async function syncRecentPosts(
  _config: InstagramConnectorConfig,
  _userId: string
): Promise<{ synced: number; errors: number }> {
  // TODO: Implement bulk sync when Instagram connector is available
  // Will call: GET /{ig-user-id}/media?fields=id,caption,timestamp,insights
  throw new Error("Instagram API sync not yet available.");
}

// ─── Metric labels for UI ─────────────────────────────────

export const METRIC_LABELS: Record<keyof ContentPerformanceMetrics, { label: string; icon: string; description: string }> = {
  reach: { label: "Alcance", icon: "👁️", description: "Contas únicas que viram o conteúdo" },
  impressions: { label: "Impressões", icon: "📊", description: "Total de vezes que o conteúdo foi exibido" },
  saves: { label: "Salvamentos", icon: "🔖", description: "Vezes que foi salvo para ver depois" },
  shares: { label: "Compartilhamentos", icon: "↗️", description: "Vezes que foi compartilhado" },
  comments: { label: "Comentários", icon: "💬", description: "Total de comentários recebidos" },
  clicks: { label: "Cliques", icon: "👆", description: "Cliques no link/perfil" },
  follows: { label: "Follows", icon: "➕", description: "Novos seguidores gerados" },
  retentionRate: { label: "Retenção", icon: "⏱️", description: "Taxa de retenção média do carrossel" },
  engagementRate: { label: "Engajamento", icon: "📈", description: "Taxa de engajamento (interações/alcance)" },
};
