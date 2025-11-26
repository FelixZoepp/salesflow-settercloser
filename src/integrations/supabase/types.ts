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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          contact_id: string | null
          created_at: string
          deal_id: string | null
          duration_min: number | null
          id: string
          note: string | null
          outcome: Database["public"]["Enums"]["activity_outcome"] | null
          timestamp: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_min?: number | null
          id?: string
          note?: string | null
          outcome?: Database["public"]["Enums"]["activity_outcome"] | null
          timestamp?: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_min?: number | null
          id?: string
          note?: string | null
          outcome?: Database["public"]["Enums"]["activity_outcome"] | null
          timestamp?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_call_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_last_activity"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          created_at: string
          id: string
          metric: Database["public"]["Enums"]["benchmark_metric"]
          target_value: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric: Database["public"]["Enums"]["benchmark_metric"]
          target_value: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["benchmark_metric"]
          target_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scripts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          system_context: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          system_context?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          system_context?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          created_at: string
          deal_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          objections_detected: Json | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          objections_detected?: Json | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          objections_detected?: Json | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          phone: string | null
          street: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          phone?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          city: string | null
          company: string | null
          company_id: string | null
          country: string | null
          created_at: string
          email: string | null
          external_id: string | null
          first_name: string
          id: string
          last_name: string
          mobile: string | null
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          position: string | null
          source: string | null
          stage: string | null
          status: string | null
          street: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_name: string
          id?: string
          last_name: string
          mobile?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          street?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          mobile?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          street?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount_eur: number | null
          closer_id: string | null
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          next_action: string | null
          pipeline: string | null
          probability_pct: number | null
          setter_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          amount_eur?: number | null
          closer_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          next_action?: string | null
          pipeline?: string | null
          probability_pct?: number | null
          setter_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          amount_eur?: number | null
          closer_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          next_action?: string | null
          pipeline?: string | null
          probability_pct?: number | null
          setter_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_call_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_last_activity"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_setter_id_fkey"
            columns: ["setter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objections: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          standard_response: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          standard_response: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          standard_response?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string
          created_at: string
          due_date: string | null
          id: string
          related_id: string | null
          related_type: Database["public"]["Enums"]["task_related_type"] | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["task_related_type"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["task_related_type"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cold_call_queue: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_activity_at: string | null
          last_name: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_last_activity: {
        Row: {
          contact_id: string | null
          last_activity_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_contact_last_activity: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_outcome:
        | "reached"
        | "no_answer"
        | "interested"
        | "not_interested"
      activity_type: "call" | "email" | "dm" | "meeting" | "note"
      benchmark_metric:
        | "calls_per_day"
        | "meetings_per_week"
        | "offers_per_week"
      deal_stage:
        | "New"
        | "Qualifiziert"
        | "Termin gesetzt"
        | "Angebot"
        | "Verhandlung"
        | "Gewonnen"
        | "Verloren"
      task_related_type: "deal" | "contact"
      task_status: "open" | "done"
      user_role: "setter" | "closer" | "admin"
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
    Enums: {
      activity_outcome: [
        "reached",
        "no_answer",
        "interested",
        "not_interested",
      ],
      activity_type: ["call", "email", "dm", "meeting", "note"],
      benchmark_metric: [
        "calls_per_day",
        "meetings_per_week",
        "offers_per_week",
      ],
      deal_stage: [
        "New",
        "Qualifiziert",
        "Termin gesetzt",
        "Angebot",
        "Verhandlung",
        "Gewonnen",
        "Verloren",
      ],
      task_related_type: ["deal", "contact"],
      task_status: ["open", "done"],
      user_role: ["setter", "closer", "admin"],
    },
  },
} as const
