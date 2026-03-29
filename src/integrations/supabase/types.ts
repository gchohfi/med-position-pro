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
      calendar_items: {
        Row: {
          content_type: string
          created_at: string
          date: string
          id: string
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
          content_type: string
          created_at?: string
          date: string
          id?: string
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
          content_type?: string
          created_at?: string
          date?: string
          id?: string
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
            foreignKeyName: "calendar_items_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      content_outputs: {
        Row: {
          content_type: string
          created_at: string
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
          content_type: string
          created_at?: string
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
          content_type?: string
          created_at?: string
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
            foreignKeyName: "content_outputs_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
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
          created_at: string
          full_name: string | null
          id: string
          onboarding_complete: boolean
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_complete?: boolean
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          specialty?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
