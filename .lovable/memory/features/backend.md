---
name: Backend architecture
description: Event pipeline, storage bucket, refresh logs, recommended actions, DB functions
type: feature
---

## Tables added
- `uploaded_assets` — Visual asset management with category, linked_module, linked_series_id, favorite
- `refresh_logs` — Observability: event_type, source_module, details, status
- `recommended_actions` — Persistent consumable/dismissable recommendations with priority
- `automation_preferences` — Per-user automation settings (radar_frequency, intensity, toggle flags)
- `strategic_updates` — AI-generated strategic update cards

## Storage
- Bucket `user-assets` (public) with RLS: users manage files under `{user_id}/` folder

## DB Functions
- `log_strategic_event(user_id, event_type, source_module, details)` — SECURITY DEFINER

## Edge Functions
- `process-event` — Receives event_type, logs to refresh_logs, generates contextual recommended_actions
- `generate-strategic-updates` — AI-powered analysis of all user data, generates strategic_updates

## Client Library
- `src/lib/strategic-events.ts` — `logStrategicEvent()` + `STRATEGIC_EVENTS` constants
- Wired into: Onboarding, Diagnóstico, Séries, Calendário, Produção, Biblioteca, Memória Viva, Evolução, Radar

## Event Types
onboarding_completed, diagnosis_generated, strategy_generated, series_created, calendar_generated,
content_generated, golden_case_marked, memory_refreshed, evolution_snapshot, radar_refreshed,
inspiration_approved, inspiration_rejected, strategic_updates_generated, asset_uploaded
