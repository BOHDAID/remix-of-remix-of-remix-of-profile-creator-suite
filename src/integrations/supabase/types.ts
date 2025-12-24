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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      captcha_learning: {
        Row: {
          attempt_count: number | null
          captcha_type: string
          confidence: number | null
          created_at: string
          id: string
          image_hash: string | null
          prompt: string | null
          site_domain: string | null
          solution: string
          updated_at: string
          was_correct: boolean
        }
        Insert: {
          attempt_count?: number | null
          captcha_type: string
          confidence?: number | null
          created_at?: string
          id?: string
          image_hash?: string | null
          prompt?: string | null
          site_domain?: string | null
          solution: string
          updated_at?: string
          was_correct?: boolean
        }
        Update: {
          attempt_count?: number | null
          captcha_type?: string
          confidence?: number | null
          created_at?: string
          id?: string
          image_hash?: string | null
          prompt?: string | null
          site_domain?: string | null
          solution?: string
          updated_at?: string
          was_correct?: boolean
        }
        Relationships: []
      }
      pairing_codes: {
        Row: {
          code: string
          created_at: string
          device_name: string | null
          expires_at: string
          id: string
          is_active: boolean
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      pending_sessions: {
        Row: {
          created_at: string
          fetched_at: string | null
          id: string
          pairing_code: string
          session_data: Json
        }
        Insert: {
          created_at?: string
          fetched_at?: string | null
          id?: string
          pairing_code: string
          session_data: Json
        }
        Update: {
          created_at?: string
          fetched_at?: string | null
          id?: string
          pairing_code?: string
          session_data?: Json
        }
        Relationships: []
      }
      saved_credentials: {
        Row: {
          auto_login: boolean | null
          created_at: string
          custom_data: Json | null
          domain: string
          email: string | null
          encrypted_password: string | null
          id: string
          last_used: string | null
          login_url: string | null
          profile_id: string
          selectors: Json | null
          site_name: string
          two_factor_enabled: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          auto_login?: boolean | null
          created_at?: string
          custom_data?: Json | null
          domain: string
          email?: string | null
          encrypted_password?: string | null
          id?: string
          last_used?: string | null
          login_url?: string | null
          profile_id: string
          selectors?: Json | null
          site_name: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          auto_login?: boolean | null
          created_at?: string
          custom_data?: Json | null
          domain?: string
          email?: string | null
          encrypted_password?: string | null
          id?: string
          last_used?: string | null
          login_url?: string | null
          profile_id?: string
          selectors?: Json | null
          site_name?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_sessions: {
        Row: {
          captured_at: string
          cookies: Json | null
          created_at: string
          domain: string
          expires_at: string | null
          full_url: string | null
          headers: Json | null
          id: string
          last_used: string | null
          local_storage: Json | null
          login_state: string | null
          metadata: Json | null
          profile_id: string
          session_storage: Json | null
          site_name: string
          status: string | null
          tokens: Json | null
          updated_at: string
        }
        Insert: {
          captured_at?: string
          cookies?: Json | null
          created_at?: string
          domain: string
          expires_at?: string | null
          full_url?: string | null
          headers?: Json | null
          id?: string
          last_used?: string | null
          local_storage?: Json | null
          login_state?: string | null
          metadata?: Json | null
          profile_id: string
          session_storage?: Json | null
          site_name: string
          status?: string | null
          tokens?: Json | null
          updated_at?: string
        }
        Update: {
          captured_at?: string
          cookies?: Json | null
          created_at?: string
          domain?: string
          expires_at?: string | null
          full_url?: string | null
          headers?: Json | null
          id?: string
          last_used?: string | null
          local_storage?: Json | null
          login_state?: string | null
          metadata?: Json | null
          profile_id?: string
          session_storage?: Json | null
          site_name?: string
          status?: string | null
          tokens?: Json | null
          updated_at?: string
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
