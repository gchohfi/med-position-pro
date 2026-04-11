export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      automation_preferences: {
        Row: {
          calendar_check: boolean
          created_at: string
          id: string
          intensity: string
          memory_refresh: boolean
          positioning_review: boolean
          radar_frequency: string
          repetition_alerts: boolean
          territory_suggestions: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_check?: boolean
          created_at?: string
          id?: string
          intensity?: string
          memory_refresh?: boolean
          positioning_review?: boolean
          radar_frequency?: string
          repetition_alerts?: boolean
          territory_suggestions?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_check?: boolean
          created_at?: string
          id?: string
          intensity?: string
          memory_refresh?: boolean
          positioning_review?: boolean
          radar_frequency?: string
          repetition_alerts?: boolean
          territory_suggestions?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_items: {
        Row: {
          benchmark_preset: string | null
          campaign_id: string | null
          content_type: string
          created_at: string
          date: string
          id: string
          objetivo: string | null
          series_id: string | null
          status: string
          strategic_objective: string | null
          thesis: string | null
          title: string
          updated_at: string
          user_id: string
          visual_direction: string | null
        }
        Insert: {
          benchmark_preset?: string | null
          campaign_id?: string | null
          content_type: string
          created_at?: string
          date: string
          id?: string
          objetivo?: string | null
          series_id?: string | null
          status?: string
          strategic_objective?: string | null
          thesis?: string | null
          title: string
          updated_at?: string
          user_id: string
          visual_direction?: string | null
        }
        Update: {
          benchmark_preset?: string | null
          campaign_id?: string | null
          content_type?: string
          created_at?: string
          date?: string
          id?: string
          objetivo?: string | null
          series_id?: string | null
          status?: string
          strategic_objective?: string | null
          thesis?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visual_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_items_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          benchmark_preset: string | null
          cluster_ids: Json
          created_at: string
          end_date: string | null
          id: string
          name: string
          notes: string | null
          persona_ids: Json
          start_date: string | null
          status: string
          strategic_objective: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benchmark_preset?: string | null
          cluster_ids?: Json
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          persona_ids?: Json
          start_date?: string | null
          status?: string
          strategic_objective?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benchmark_preset?: string | null
          cluster_ids?: Json
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          persona_ids?: Json
          start_date?: string | null
          status?: string
          strategic_objective?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_activity_log: {
        Row: {
          action: string
          actor_name: string
          content_output_id: string
          created_at: string
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          action: string
          actor_name?: string
          content_output_id: string
          created_at?: string
          details?: Json
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          actor_name?: string
          content_output_id?: string
          created_at?: string
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_approvals: {
        Row: {
          content_output_id: string
          created_at: string
          id: string
          notes: string | null
          reviewer_email: string | null
          reviewer_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_output_id: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_output_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          author_name: string
          author_role: string
          comment: string
          content_output_id: string
          created_at: string
          id: string
          resolved: boolean
          slide_number: number | null
          user_id: string
          version_label: string | null
        }
        Insert: {
          author_name?: string
          author_role?: string
          comment: string
          content_output_id: string
          created_at?: string
          id?: string
          resolved?: boolean
          slide_number?: number | null
          user_id: string
          version_label?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string
          comment?: string
          content_output_id?: string
          created_at?: string
          id?: string
          resolved?: boolean
          slide_number?: number | null
          user_id?: string
          version_label?: string | null
        }
        Relationships: []
      }
      content_feedback: {
        Row: {
          aesthetic_score: number | null
          authority_score: number | null
          benchmark_preset: string | null
          clarity_score: number | null
          content_output_id: string | null
          created_at: string
          id: string
          notes: string | null
          outcome_tags: Json
          posted: boolean
          reuse_direction: boolean
          satisfaction: number | null
          updated_at: string
          user_id: string
          visual_style: string | null
        }
        Insert: {
          aesthetic_score?: number | null
          authority_score?: number | null
          benchmark_preset?: string | null
          clarity_score?: number | null
          content_output_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome_tags?: Json
          posted?: boolean
          reuse_direction?: boolean
          satisfaction?: number | null
          updated_at?: string
          user_id: string
          visual_style?: string | null
        }
        Update: {
          aesthetic_score?: number | null
          authority_score?: number | null
          benchmark_preset?: string | null
          clarity_score?: number | null
          content_output_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome_tags?: Json
          posted?: boolean
          reuse_direction?: boolean
          satisfaction?: number | null
          updated_at?: string
          user_id?: string
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_feedback_content_output_id_fkey"
            columns: ["content_output_id"]
            isOneToOne: false
            referencedRelation: "content_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_outputs: {
        Row: {
          campaign_id: string | null
          carousel_slide_urls: Json | null
          content_type: string
          created_at: string
          derived_from: string | null
          generated_content: Json
          golden_case: boolean
          golden_reason: string | null
          id: string
          series_id: string | null
          strategic_input: Json
          title: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          carousel_slide_urls?: Json | null
          content_type: string
          created_at?: string
          derived_from?: string | null
          generated_content?: Json
          golden_case?: boolean
          golden_reason?: string | null
          id?: string
          series_id?: string | null
          strategic_input?: Json
          title?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          carousel_slide_urls?: Json | null
          content_type?: string
          created_at?: string
          derived_from?: string | null
          generated_content?: Json
          golden_case?: boolean
          golden_reason?: string | null
          id?: string
          series_id?: string | null
          strategic_input?: Json
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_outputs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_outputs_derived_from_fkey"
            columns: ["derived_from"]
            isOneToOne: false
            referencedRelation: "content_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_outputs_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          clicks: number | null
          comments: number | null
          content_output_id: string | null
          created_at: string
          engagement_rate: number | null
          external_post_id: string | null
          external_post_url: string | null
          follows: number | null
          id: string
          impressions: number | null
          notes: string | null
          predicted_score: number | null
          published_at: string | null
          reach: number | null
          retention_rate: number | null
          saves: number | null
          shares: number | null
          source: string
          sync_status: string
          synced_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          content_output_id?: string | null
          created_at?: string
          engagement_rate?: number | null
          external_post_id?: string | null
          external_post_url?: string | null
          follows?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          predicted_score?: number | null
          published_at?: string | null
          reach?: number | null
          retention_rate?: number | null
          saves?: number | null
          shares?: number | null
          source?: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          content_output_id?: string | null
          created_at?: string
          engagement_rate?: number | null
          external_post_id?: string | null
          external_post_url?: string | null
          follows?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          predicted_score?: number | null
          published_at?: string | null
          reach?: number | null
          retention_rate?: number | null
          saves?: number | null
          shares?: number | null
          source?: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_output_id_fkey"
            columns: ["content_output_id"]
            isOneToOne: false
            referencedRelation: "content_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_outputs: {
        Row: {
          created_at: string
          diagnosis: Json
          estrategia: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis?: Json
          estrategia?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis?: Json
          estrategia?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inspiration_profile_analyses: {
        Row: {
          analysis_result: Json | null
          analysis_status: string
          created_at: string
          id: string
          normalized_handle: string | null
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          id?: string
          normalized_handle?: string | null
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          id?: string
          normalized_handle?: string | null
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_profile_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "inspiration_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_profiles: {
        Row: {
          bio: string | null
          confidence_score: number | null
          created_at: string
          discovered_handle: string
          display_name: string | null
          followers_estimate: string | null
          handle: string
          id: string
          normalized_handle: string
          source_type: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          bio?: string | null
          confidence_score?: number | null
          created_at?: string
          discovered_handle: string
          display_name?: string | null
          followers_estimate?: string | null
          handle: string
          id?: string
          normalized_handle: string
          source_type?: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          bio?: string | null
          confidence_score?: number | null
          created_at?: string
          discovered_handle?: string
          display_name?: string | null
          followers_estimate?: string | null
          handle?: string
          id?: string
          normalized_handle?: string
          source_type?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      inspiration_references: {
        Row: {
          adherence_level: string
          assimilated: boolean
          category: string
          created_at: string
          feedback: string | null
          id: string
          segment: string | null
          source: string
          strategic_pattern: string | null
          suggestion_reason: string | null
          title: string
          updated_at: string
          user_id: string
          what_to_absorb: string | null
          what_to_avoid: string | null
        }
        Insert: {
          adherence_level?: string
          assimilated?: boolean
          category: string
          created_at?: string
          feedback?: string | null
          id?: string
          segment?: string | null
          source?: string
          strategic_pattern?: string | null
          suggestion_reason?: string | null
          title: string
          updated_at?: string
          user_id: string
          what_to_absorb?: string | null
          what_to_avoid?: string | null
        }
        Update: {
          adherence_level?: string
          assimilated?: boolean
          category?: string
          created_at?: string
          feedback?: string | null
          id?: string
          segment?: string | null
          source?: string
          strategic_pattern?: string | null
          suggestion_reason?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          what_to_absorb?: string | null
          what_to_avoid?: string | null
        }
        Relationships: []
      }
      living_memory: {
        Row: {
          created_at: string
          id: string
          memory: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_radar: {
        Row: {
          alerts: Json
          created_at: string
          id: string
          opportunities: Json
          recommendations: Json
          saturation: Json
          segment_summary: string | null
          signals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts?: Json
          created_at?: string
          id?: string
          opportunities?: Json
          recommendations?: Json
          saturation?: Json
          segment_summary?: string | null
          signals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts?: Json
          created_at?: string
          id?: string
          opportunities?: Json
          recommendations?: Json
          saturation?: Json
          segment_summary?: string | null
          signals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_personas: {
        Row: {
          created_at: string
          cta_ideal: string
          desejo: string
          dor_principal: string
          faixa_etaria: string
          gatilhos_confianca: Json
          id: string
          is_active: boolean
          linguagem_ideal: string
          momento_vida: string
          nome_interno: string
          objecoes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cta_ideal?: string
          desejo?: string
          dor_principal?: string
          faixa_etaria?: string
          gatilhos_confianca?: Json
          id?: string
          is_active?: boolean
          linguagem_ideal?: string
          momento_vida?: string
          nome_interno: string
          objecoes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cta_ideal?: string
          desejo?: string
          dor_principal?: string
          faixa_etaria?: string
          gatilhos_confianca?: Json
          id?: string
          is_active?: boolean
          linguagem_ideal?: string
          momento_vida?: string
          nome_interno?: string
          objecoes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      positioning: {
        Row: {
          archetype: string | null
          created_at: string
          goals: string | null
          id: string
          pillars: string[] | null
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          pillars?: string[] | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          pillars?: string[] | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      positioning_snapshots: {
        Row: {
          created_at: string
          cycle_number: number
          id: string
          recommendation: string | null
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_number?: number
          id?: string
          recommendation?: string | null
          snapshot?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_number?: number
          id?: string
          recommendation?: string | null
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cidade: string | null
          created_at: string
          crm: string | null
          estado: string | null
          full_name: string | null
          id: string
          instagram_handle: string | null
          onboarding_complete: boolean
          photo_url: string | null
          profile_data: Json | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          crm?: string | null
          estado?: string | null
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          onboarding_complete?: boolean
          photo_url?: string | null
          profile_data?: Json | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          crm?: string | null
          estado?: string | null
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          onboarding_complete?: boolean
          photo_url?: string | null
          profile_data?: Json | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recommended_actions: {
        Row: {
          action_path: string | null
          action_type: string
          consumed: boolean
          dismissed: boolean
          generated_at: string
          id: string
          priority: string
          reason: string | null
          related_module: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_path?: string | null
          action_type: string
          consumed?: boolean
          dismissed?: boolean
          generated_at?: string
          id?: string
          priority?: string
          reason?: string | null
          related_module?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_path?: string | null
          action_type?: string
          consumed?: boolean
          dismissed?: boolean
          generated_at?: string
          id?: string
          priority?: string
          reason?: string | null
          related_module?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      refresh_logs: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          source_module: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          source_module: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          source_module?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          closing_pattern: string | null
          created_at: string
          frequency: string
          id: string
          name: string
          opening_pattern: string | null
          status: string
          strategic_role: string
          subtitle: string | null
          tone: string | null
          updated_at: string
          user_id: string
          visual_identity: string | null
        }
        Insert: {
          closing_pattern?: string | null
          created_at?: string
          frequency?: string
          id?: string
          name: string
          opening_pattern?: string | null
          status?: string
          strategic_role: string
          subtitle?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          visual_identity?: string | null
        }
        Update: {
          closing_pattern?: string | null
          created_at?: string
          frequency?: string
          id?: string
          name?: string
          opening_pattern?: string | null
          status?: string
          strategic_role?: string
          subtitle?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          visual_identity?: string | null
        }
        Relationships: []
      }
      strategic_memory: {
        Row: {
          created_at: string
          cta_preferences: Json
          export_count: number
          hook_intensity: string
          id: string
          last_accepted_directions: Json
          last_rejected_directions: Json
          notes_summary: string | null
          preferred_presets: Json
          preferred_visual_styles: Json
          rejected_patterns: Json
          rewrite_count: number
          tone_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cta_preferences?: Json
          export_count?: number
          hook_intensity?: string
          id?: string
          last_accepted_directions?: Json
          last_rejected_directions?: Json
          notes_summary?: string | null
          preferred_presets?: Json
          preferred_visual_styles?: Json
          rejected_patterns?: Json
          rewrite_count?: number
          tone_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cta_preferences?: Json
          export_count?: number
          hook_intensity?: string
          id?: string
          last_accepted_directions?: Json
          last_rejected_directions?: Json
          notes_summary?: string | null
          preferred_presets?: Json
          preferred_visual_styles?: Json
          rejected_patterns?: Json
          rewrite_count?: number
          tone_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategic_updates: {
        Row: {
          action_label: string | null
          action_module: string | null
          action_path: string | null
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          severity: string
          source_module: string | null
          title: string
          update_type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_module?: string | null
          action_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          severity?: string
          source_module?: string | null
          title: string
          update_type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_module?: string | null
          action_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          severity?: string
          source_module?: string | null
          title?: string
          update_type?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_clusters: {
        Row: {
          benchmark_affinity: Json
          cluster_name: string
          contraindications: Json
          created_at: string
          description: string | null
          id: string
          intent: string
          last_used_at: string | null
          notes: string | null
          priority: string
          recommended_objectives: Json
          recommended_visual_styles: Json
          specialty: string
          subtopics: Json
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          benchmark_affinity?: Json
          cluster_name: string
          contraindications?: Json
          created_at?: string
          description?: string | null
          id?: string
          intent?: string
          last_used_at?: string | null
          notes?: string | null
          priority?: string
          recommended_objectives?: Json
          recommended_visual_styles?: Json
          specialty: string
          subtopics?: Json
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          benchmark_affinity?: Json
          cluster_name?: string
          contraindications?: Json
          created_at?: string
          description?: string | null
          id?: string
          intent?: string
          last_used_at?: string | null
          notes?: string | null
          priority?: string
          recommended_objectives?: Json
          recommended_visual_styles?: Json
          specialty?: string
          subtopics?: Json
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      uploaded_assets: {
        Row: {
          category: string
          created_at: string
          favorite: boolean
          file_name: string
          file_path: string
          id: string
          linked_calendar_item_id: string | null
          linked_module: string | null
          linked_series_id: string | null
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          favorite?: boolean
          file_name: string
          file_path: string
          id?: string
          linked_calendar_item_id?: string | null
          linked_module?: string | null
          linked_series_id?: string | null
          note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          favorite?: boolean
          file_name?: string
          file_path?: string
          id?: string
          linked_calendar_item_id?: string | null
          linked_module?: string | null
          linked_series_id?: string | null
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_assets_linked_calendar_item_id_fkey"
            columns: ["linked_calendar_item_id"]
            isOneToOne: false
            referencedRelation: "calendar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_assets_linked_series_id_fkey"
            columns: ["linked_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_reference_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          reference_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          reference_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_reference_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "visual_reference_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_reference_collection_items_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "visual_references"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_reference_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_references: {
        Row: {
          benchmark_preset: string | null
          created_at: string
          description: string | null
          favorite: boolean
          id: string
          image_url: string | null
          link: string | null
          ref_type: string
          suggested_use: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          visual_style: string | null
        }
        Insert: {
          benchmark_preset?: string | null
          created_at?: string
          description?: string | null
          favorite?: boolean
          id?: string
          image_url?: string | null
          link?: string | null
          ref_type?: string
          suggested_use?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          visual_style?: string | null
        }
        Update: {
          benchmark_preset?: string | null
          created_at?: string
          description?: string | null
          favorite?: boolean
          id?: string
          image_url?: string | null
          link?: string | null
          ref_type?: string
          suggested_use?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          visual_style?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_strategic_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_source_module: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
