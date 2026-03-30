import { supabase } from "@/integrations/supabase/client";

/**
 * Log a strategic event to refresh_logs for observability.
 * Call this after key user actions to enable event-driven updates.
 */
export async function logStrategicEvent(
  eventType: string,
  sourceModule: string,
  details: Record<string, unknown> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("refresh_logs").insert([{
    user_id: user.id,
    event_type: eventType,
    source_module: sourceModule,
    details: details as any,
  }]);
}

/**
 * Event types for consistent logging across modules:
 * 
 * onboarding_completed     - User finished onboarding
 * diagnosis_generated      - AI diagnosis created
 * strategy_generated       - AI strategy created  
 * series_created           - New series added
 * series_updated           - Series modified
 * calendar_generated       - AI calendar created
 * content_generated        - AI content piece created
 * golden_case_marked       - Content marked as golden case
 * memory_refreshed         - Living memory updated
 * evolution_snapshot        - Evolution cycle snapshot created
 * radar_refreshed          - Market radar updated
 * inspiration_approved     - Inspiration reference approved
 * inspiration_rejected     - Inspiration reference rejected
 * strategic_updates_generated - Automated updates generated
 * asset_uploaded           - Visual asset uploaded
 */
export const STRATEGIC_EVENTS = {
  ONBOARDING_COMPLETED: "onboarding_completed",
  DIAGNOSIS_GENERATED: "diagnosis_generated",
  STRATEGY_GENERATED: "strategy_generated",
  SERIES_CREATED: "series_created",
  SERIES_UPDATED: "series_updated",
  CALENDAR_GENERATED: "calendar_generated",
  CONTENT_GENERATED: "content_generated",
  GOLDEN_CASE_MARKED: "golden_case_marked",
  MEMORY_REFRESHED: "memory_refreshed",
  EVOLUTION_SNAPSHOT: "evolution_snapshot",
  RADAR_REFRESHED: "radar_refreshed",
  INSPIRATION_APPROVED: "inspiration_approved",
  INSPIRATION_REJECTED: "inspiration_rejected",
  STRATEGIC_UPDATES_GENERATED: "strategic_updates_generated",
  ASSET_UPLOADED: "asset_uploaded",
  INSTAGRAM_INTEL_GENERATED: "instagram_intel_generated",
} as const;
