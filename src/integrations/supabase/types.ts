export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      invite_codes: {
        Row: {
          id: string
          code: string
          cohort: string | null
          max_uses: number
          used_count: number
          created_by: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          code: string
          cohort?: string | null
          max_uses?: number
          used_count?: number
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          cohort?: string | null
          max_uses?: number
          used_count?: number
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
          last_active_at: string | null
          at_risk_flag: boolean
          at_risk_reason: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
          last_active_at?: string | null
          at_risk_flag?: boolean
          at_risk_reason?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
          last_active_at?: string | null
          at_risk_flag?: boolean
          at_risk_reason?: string | null
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          id: string
          user_id: string
          tool_key: string
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_key: string
          event_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_key?: string
          event_type?: string
          created_at?: string
        }
        Relationships: []
      }
      user_data: {
        Row: {
          id: string
          user_id: string
          tool_key: string
          data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_key: string
          data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_key?: string
          data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          assigned_admin_id: string | null
          subject: string
          description: string
          issue_type: string
          tool: string | null
          priority: Database["public"]["Enums"]["support_priority"]
          status: Database["public"]["Enums"]["support_status"]
          context_path: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assigned_admin_id?: string | null
          subject: string
          description: string
          issue_type: string
          tool?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          context_path?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assigned_admin_id?: string | null
          subject?: string
          description?: string
          issue_type?: string
          tool?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          context_path?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          author_role: "student" | "admin"
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          author_role: "student" | "admin"
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string
          author_role?: "student" | "admin"
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      support_ticket_history: {
        Row: {
          id: number
          ticket_id: string
          changed_by: string | null
          field: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: number
          ticket_id: string
          changed_by?: string | null
          field: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      student_activity: {
        Row: {
          id: number
          user_id: string
          activity_type: string
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          activity_type: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          category: string | null
          link: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          category?: string | null
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          category?: string | null
          link?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      support_tickets_admin_view: {
        Row: {
          id: string
          user_id: string
          assigned_admin_id: string | null
          subject: string
          description: string
          issue_type: string
          tool: string | null
          priority: Database["public"]["Enums"]["support_priority"]
          status: Database["public"]["Enums"]["support_status"]
          context_path: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
          user_display_name: string | null
          user_email: string | null
          assigned_admin_display_name: string | null
          message_count: number
          last_message_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_users: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          status: Database["public"]["Enums"]["user_status"]
          roles: Database["public"]["Enums"]["app_role"][]
          created_at: string
          last_sign_in: string | null
          last_active_at: string | null
          at_risk_flag: boolean
          at_risk_reason: string | null
        }[]
      }
      admin_update_user_status: {
        Args: {
          _user_id: string
          _status: Database["public"]["Enums"]["user_status"]
        }
        Returns: undefined
      }
      admin_toggle_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      support_assign_ticket: {
        Args: { _ticket_id: string; _admin_id: string }
        Returns: undefined
      }
      support_update_status: {
        Args: {
          _ticket_id: string
          _status: Database["public"]["Enums"]["support_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
      user_status: "pending" | "approved" | "rejected"
      support_status: "open" | "in_progress" | "awaiting_user" | "resolved" | "closed"
      support_priority: "low" | "normal" | "high" | "urgent"
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
      app_role: ["admin", "student"],
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const
