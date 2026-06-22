export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_reports: {
        Row: {
          created_at: string;
          id: string;
          reason: string;
          reported_entity_id: string;
          reported_entity_type: string;
          reporter_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason: string;
          reported_entity_id: string;
          reported_entity_type: string;
          reporter_id?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string;
          reported_entity_id?: string;
          reported_entity_type?: string;
          reporter_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          applied_at: string;
          decided_at: string | null;
          event_id: string;
          event_role_id: string | null;
          id: string;
          message: string | null;
          status: Database["public"]["Enums"]["application_status"];
          volunteer_id: string;
        };
        Insert: {
          applied_at?: string;
          decided_at?: string | null;
          event_id: string;
          event_role_id?: string | null;
          id?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          volunteer_id: string;
        };
        Update: {
          applied_at?: string;
          decided_at?: string | null;
          event_id?: string;
          event_role_id?: string | null;
          id?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          volunteer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_event_role_id_fkey";
            columns: ["event_role_id"];
            isOneToOne: false;
            referencedRelation: "event_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          application_id: string;
          attended: boolean;
          hours: number;
          marked_at: string;
        };
        Insert: {
          application_id: string;
          attended?: boolean;
          hours?: number;
          marked_at?: string;
        };
        Update: {
          application_id?: string;
          attended?: boolean;
          hours?: number;
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          application_id: string;
          id: string;
          issued_at: string;
          pdf_url: string;
        };
        Insert: {
          application_id: string;
          id?: string;
          issued_at?: string;
          pdf_url: string;
        };
        Update: {
          application_id?: string;
          id?: string;
          issued_at?: string;
          pdf_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      event_roles: {
        Row: {
          event_id: string;
          id: string;
          role_name: string;
          spots_filled: number;
          spots_needed: number;
        };
        Insert: {
          event_id: string;
          id?: string;
          role_name: string;
          spots_filled?: number;
          spots_needed?: number;
        };
        Update: {
          event_id?: string;
          id?: string;
          role_name?: string;
          spots_filled?: number;
          spots_needed?: number;
        };
        Relationships: [
          {
            foreignKeyName: "event_roles_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          address: string;
          banner_url: string | null;
          category: string;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string;
          ends_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          ngo_id: string;
          pincode: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          total_spots: number;
        };
        Insert: {
          address: string;
          banner_url?: string | null;
          category: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description: string;
          ends_at: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          ngo_id: string;
          pincode?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          total_spots?: number;
        };
        Update: {
          address?: string;
          banner_url?: string | null;
          category?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string;
          ends_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          ngo_id?: string;
          pincode?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          total_spots?: number;
        };
        Relationships: [];
      };
      ngo_profiles: {
        Row: {
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          lat: number | null;
          lng: number | null;
          org_name: string;
          pincode: string | null;
          registration_cert_url: string | null;
          registration_number: string | null;
          suspended: boolean;
          user_id: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
          website: string | null;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          org_name: string;
          pincode?: string | null;
          registration_cert_url?: string | null;
          registration_number?: string | null;
          suspended?: boolean;
          user_id: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          website?: string | null;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          org_name?: string;
          pincode?: string | null;
          registration_cert_url?: string | null;
          registration_number?: string | null;
          suspended?: boolean;
          user_id?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          website?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          pincode: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          pincode?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          pincode?: string | null;
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
      volunteer_profiles: {
        Row: {
          availability: Json;
          bio: string | null;
          created_at: string;
          events_completed: number;
          hours_total: number;
          skills: string[];
          user_id: string;
        };
        Insert: {
          availability?: Json;
          bio?: string | null;
          created_at?: string;
          events_completed?: number;
          hours_total?: number;
          skills?: string[];
          user_id: string;
        };
        Update: {
          availability?: Json;
          bio?: string | null;
          created_at?: string;
          events_completed?: number;
          hours_total?: number;
          skills?: string[];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      haversine_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number };
        Returns: number;
      };
      search_events: {
        Args: {
          _category?: string;
          _from?: string;
          _lat: number;
          _lng: number;
          _only_open?: boolean;
          _radius_km?: number;
          _to?: string;
        };
        Returns: {
          address: string;
          banner_url: string;
          category: string;
          description: string;
          distance_km: number;
          ends_at: string;
          id: string;
          lat: number;
          lng: number;
          ngo_id: string;
          org_name: string;
          pincode: string;
          spots_filled: number;
          starts_at: string;
          title: string;
          total_spots: number;
          verification_status: Database["public"]["Enums"]["verification_status"];
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "ngo" | "volunteer";
      application_status: "pending" | "accepted" | "rejected" | "waitlisted" | "cancelled";
      event_status: "published" | "cancelled" | "completed";
      verification_status: "pending" | "verified" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "ngo", "volunteer"],
      application_status: ["pending", "accepted", "rejected", "waitlisted", "cancelled"],
      event_status: ["published", "cancelled", "completed"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const;
