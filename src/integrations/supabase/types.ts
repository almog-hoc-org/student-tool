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
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
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
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          priority: number
          assigned_to: string | null
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          priority?: number
          assigned_to?: string | null
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          priority?: number
          assigned_to?: string | null
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: Database["public"]["Enums"]["message_role"]
          content: string
          tokens_used: number | null
          author_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: Database["public"]["Enums"]["message_role"]
          content: string
          tokens_used?: number | null
          author_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          content?: string
          tokens_used?: number | null
          author_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      calculation_snapshots: {
        Row: {
          id: string
          user_id: string
          tool_key: string
          name: string
          data: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_key: string
          name: string
          data?: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_key?: string
          name?: string
          data?: Json
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          metadata: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          metadata?: Json
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          id: string
          title: string
          body: string
          link: string | null
          target_filter: Json
          sent_by: string | null
          sent_at: string
          total_recipients: number
        }
        Insert: {
          id?: string
          title: string
          body: string
          link?: string | null
          target_filter?: Json
          sent_by?: string | null
          sent_at?: string
          total_recipients?: number
        }
        Update: {
          id?: string
          title?: string
          body?: string
          link?: string | null
          target_filter?: Json
          sent_by?: string | null
          sent_at?: string
          total_recipients?: number
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          id: string
          source_file: string
          source_id: string | null
          chunk_index: number
          content: string
          embedding: unknown | null
          metadata: Json
          updated_at: string
        }
        Insert: {
          id?: string
          source_file: string
          source_id?: string | null
          chunk_index?: number
          content: string
          embedding?: unknown | null
          metadata?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          source_file?: string
          source_id?: string | null
          chunk_index?: number
          content?: string
          embedding?: unknown | null
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      conversation_escalate_to_human: {
        Args: { _conversation_id: string; _reason: string | null }
        Returns: undefined
      }
      admin_list_conversations: {
        Args: {
          _status: Database["public"]["Enums"]["conversation_status"] | null
          _limit?: number
        }
        Returns: {
          id: string
          user_id: string
          user_email: string
          user_display_name: string | null
          title: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          priority: number
          assigned_to: string | null
          last_message_at: string
          created_at: string
          message_count: number
          last_message_preview: string | null
        }[]
      }
      admin_assign_conversation: {
        Args: { _conversation_id: string; _assignee: string }
        Returns: undefined
      }
      admin_reply: {
        Args: {
          _conversation_id: string
          _content: string
          _resolve?: boolean
        }
        Returns: string
      }
      admin_send_broadcast: {
        Args: {
          _title: string
          _body: string
          _link: string | null
          _target_filter: Json
        }
        Returns: string
      }
      admin_broadcast_preview_count: {
        Args: { _target_filter: Json }
        Returns: number
      }
      admin_user_activity: {
        Args: { _user_id: string; _limit?: number }
        Returns: {
          event_kind: string
          event_type: string
          tool_key: string | null
          content: string | null
          occurred_at: string
        }[]
      }
      admin_dashboard_kpis: {
        Args: Record<string, never>
        Returns: {
          total_users: number
          approved_users: number
          pending_users: number
          active_7d: number
          inactive_14d: number
          open_conversations: number
          awaiting_human: number
          avg_response_seconds: number | null
        }[]
      }
      mark_notification_read: {
        Args: { _id: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<string, never>
        Returns: number
      }
      match_chunks: {
        Args: {
          query_embedding: unknown
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          source_file: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student"
      user_status: "pending" | "approved" | "rejected"
      conversation_status: "open" | "awaiting_human" | "resolved"
      message_role: "user" | "ai" | "human" | "system"
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
      conversation_status: ["open", "awaiting_human", "resolved"],
      message_role: ["user", "ai", "human", "system"],
    },
  },
} as const
