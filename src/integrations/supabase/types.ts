export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          city: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          pharmacy_id: string;
          pharmacy_name: string;
          placed_at: string;
          items: Json;
          total: number;
          fulfilment: string;
          prescription_id: string | null;
          status: string;
          timeline: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          pharmacy_id: string;
          pharmacy_name: string;
          placed_at?: string;
          items: Json;
          total: number;
          fulfilment?: string;
          prescription_id?: string | null;
          status?: string;
          timeline?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pharmacy_id?: string;
          pharmacy_name?: string;
          placed_at?: string;
          items?: Json;
          total?: number;
          fulfilment?: string;
          prescription_id?: string | null;
          status?: string;
          timeline?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          medicine_name: string;
          strength: string;
          times: string[];
          start_date: string;
          end_date: string | null;
          instruction: string;
          source_prescription_id: string | null;
          active: boolean;
          log: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          medicine_name: string;
          strength: string;
          times: string[];
          start_date: string;
          end_date?: string | null;
          instruction?: string;
          source_prescription_id?: string | null;
          active?: boolean;
          log?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          medicine_name?: string;
          strength?: string;
          times?: string[];
          start_date?: string;
          end_date?: string | null;
          instruction?: string;
          source_prescription_id?: string | null;
          active?: boolean;
          log?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          uploaded_at: string;
          prescriber_name: string | null;
          status: string;
          patient_name: string | null;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          file_name: string;
          uploaded_at?: string;
          prescriber_name?: string | null;
          status?: string;
          patient_name?: string | null;
          items: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          uploaded_at?: string;
          prescriber_name?: string | null;
          status?: string;
          patient_name?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          medicine_id: string;
          name: string;
          qty: number;
          price: number;
          prescription_only: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          medicine_id: string;
          name: string;
          qty: number;
          price: number;
          prescription_only?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          medicine_id?: string;
          name?: string;
          qty?: number;
          price?: number;
          prescription_only?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      lab_reports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          uploaded_at: string;
          panel: string;
          values: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          file_name: string;
          uploaded_at?: string;
          panel: string;
          values: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          uploaded_at?: string;
          panel?: string;
          values?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      catalog_items: {
        Row: {
          id: string;
          brand_name: string;
          generic_name: string;
          composition_key: string;
          form: string;
          pack_size: string;
          manufacturer: string;
          prescription_only: boolean;
          active_ingredients: Json;
          warnings: string[];
          uses_summary: string;
          created_at: string;
        };
        Insert: {
          id: string;
          brand_name: string;
          generic_name: string;
          composition_key: string;
          form: string;
          pack_size: string;
          manufacturer: string;
          prescription_only?: boolean;
          active_ingredients: Json;
          warnings?: string[];
          uses_summary?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_name?: string;
          generic_name?: string;
          composition_key?: string;
          form?: string;
          pack_size?: string;
          manufacturer?: string;
          prescription_only?: boolean;
          active_ingredients?: Json;
          warnings?: string[];
          uses_summary?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          at: string;
          actor: string;
          role: string | null;
          category: string | null;
          action: string;
          target: string;
          ip: string;
          status: string | null;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          at?: string;
          actor: string;
          role?: string | null;
          category?: string | null;
          action: string;
          target: string;
          ip: string;
          status?: string | null;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          at?: string;
          actor?: string;
          role?: string | null;
          category?: string | null;
          action?: string;
          target?: string;
          ip?: string;
          status?: string | null;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "patient" | "pharmacy" | "doctor" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "pharmacy", "doctor", "admin"],
    },
  },
} as const;
