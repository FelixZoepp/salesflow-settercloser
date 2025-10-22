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
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
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
