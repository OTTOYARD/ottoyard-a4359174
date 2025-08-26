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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      fleet_analytics: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          insights: Json
          recommendations: Json | null
          severity_level: string | null
          status: string | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          insights: Json
          recommendations?: Json | null
          severity_level?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          insights?: Json
          recommendations?: Json | null
          severity_level?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_analytics_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          ai_predicted: boolean | null
          cost: number | null
          created_at: string
          description: string
          id: string
          maintenance_type: string
          next_due_date: string | null
          performed_at: string | null
          prediction_confidence: number | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          ai_predicted?: boolean | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          maintenance_type: string
          next_due_date?: string | null
          performed_at?: string | null
          prediction_confidence?: number | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          ai_predicted?: boolean | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          maintenance_type?: string
          next_due_date?: string | null
          performed_at?: string | null
          prediction_confidence?: number | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          end_location: string
          estimated_distance: number | null
          estimated_duration: number | null
          fuel_consumption_estimate: number | null
          id: string
          optimization_score: number | null
          optimized_by_ai: boolean | null
          route_name: string
          start_location: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
          waypoints: Json | null
        }
        Insert: {
          created_at?: string
          end_location: string
          estimated_distance?: number | null
          estimated_duration?: number | null
          fuel_consumption_estimate?: number | null
          id?: string
          optimization_score?: number | null
          optimized_by_ai?: boolean | null
          route_name: string
          start_location: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          waypoints?: Json | null
        }
        Update: {
          created_at?: string
          end_location?: string
          estimated_distance?: number | null
          estimated_duration?: number | null
          fuel_consumption_estimate?: number | null
          id?: string
          optimization_score?: number | null
          optimized_by_ai?: boolean | null
          route_name?: string
          start_location?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          engine_hours: number | null
          fuel_level: number | null
          id: string
          last_location_update: string | null
          license_plate: string | null
          location_lat: number | null
          location_lng: number | null
          make: string | null
          mileage: number | null
          model: string | null
          status: string | null
          updated_at: string
          user_id: string
          vehicle_number: string
          vehicle_type: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          engine_hours?: number | null
          fuel_level?: number | null
          id?: string
          last_location_update?: string | null
          license_plate?: string | null
          location_lat?: number | null
          location_lng?: number | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_number: string
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          engine_hours?: number | null
          fuel_level?: number | null
          id?: string
          last_location_update?: string | null
          license_plate?: string | null
          location_lat?: number | null
          location_lng?: number | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_number?: string
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      voice_commands: {
        Row: {
          command_text: string
          command_type: string
          created_at: string
          executed_successfully: boolean | null
          execution_details: Json | null
          id: string
          response_text: string | null
          user_id: string
        }
        Insert: {
          command_text: string
          command_type: string
          created_at?: string
          executed_successfully?: boolean | null
          execution_details?: Json | null
          id?: string
          response_text?: string | null
          user_id: string
        }
        Update: {
          command_text?: string
          command_type?: string
          created_at?: string
          executed_successfully?: boolean | null
          execution_details?: Json | null
          id?: string
          response_text?: string | null
          user_id?: string
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
