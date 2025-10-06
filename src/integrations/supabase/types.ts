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
      ottoq_cities: {
        Row: {
          created_at: string
          id: string
          name: string
          tz: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tz?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tz?: string
        }
        Relationships: []
      }
      ottoq_depots: {
        Row: {
          address: string | null
          city_id: string
          config_jsonb: Json
          created_at: string
          id: string
          lat: number | null
          lon: number | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city_id: string
          config_jsonb?: Json
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city_id?: string
          config_jsonb?: Json
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ottoq_depots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "ottoq_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      ottoq_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["ottoq_entity_type"]
          event_type: string
          id: string
          payload_jsonb: Json | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["ottoq_entity_type"]
          event_type: string
          id?: string
          payload_jsonb?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["ottoq_entity_type"]
          event_type?: string
          id?: string
          payload_jsonb?: Json | null
        }
        Relationships: []
      }
      ottoq_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          depot_id: string
          eta_seconds: number | null
          id: string
          idempotency_key: string | null
          job_type: Database["public"]["Enums"]["ottoq_job_type"]
          metadata_jsonb: Json | null
          requested_start_at: string | null
          resource_id: string | null
          scheduled_start_at: string | null
          started_at: string | null
          state: Database["public"]["Enums"]["ottoq_job_state"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          depot_id: string
          eta_seconds?: number | null
          id?: string
          idempotency_key?: string | null
          job_type: Database["public"]["Enums"]["ottoq_job_type"]
          metadata_jsonb?: Json | null
          requested_start_at?: string | null
          resource_id?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["ottoq_job_state"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          depot_id?: string
          eta_seconds?: number | null
          id?: string
          idempotency_key?: string | null
          job_type?: Database["public"]["Enums"]["ottoq_job_type"]
          metadata_jsonb?: Json | null
          requested_start_at?: string | null
          resource_id?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["ottoq_job_state"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ottoq_jobs_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "ottoq_depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ottoq_jobs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "ottoq_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ottoq_jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ottoq_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ottoq_resources: {
        Row: {
          capabilities_jsonb: Json | null
          current_job_id: string | null
          depot_id: string
          id: string
          index: number
          resource_type: Database["public"]["Enums"]["ottoq_resource_type"]
          status: Database["public"]["Enums"]["ottoq_resource_status"]
          updated_at: string
        }
        Insert: {
          capabilities_jsonb?: Json | null
          current_job_id?: string | null
          depot_id: string
          id?: string
          index: number
          resource_type: Database["public"]["Enums"]["ottoq_resource_type"]
          status?: Database["public"]["Enums"]["ottoq_resource_status"]
          updated_at?: string
        }
        Update: {
          capabilities_jsonb?: Json | null
          current_job_id?: string | null
          depot_id?: string
          id?: string
          index?: number
          resource_type?: Database["public"]["Enums"]["ottoq_resource_type"]
          status?: Database["public"]["Enums"]["ottoq_resource_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ottoq_resources_current_job"
            columns: ["current_job_id"]
            isOneToOne: false
            referencedRelation: "ottoq_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ottoq_resources_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "ottoq_depots"
            referencedColumns: ["id"]
          },
        ]
      }
      ottoq_schedules: {
        Row: {
          created_at: string
          id: string
          last_run_at: string | null
          next_due_at: string | null
          rule_jsonb: Json
          rule_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_due_at?: string | null
          rule_jsonb: Json
          rule_type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_due_at?: string | null
          rule_jsonb?: Json
          rule_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ottoq_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ottoq_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ottoq_simulator_state: {
        Row: {
          config_jsonb: Json
          created_at: string
          id: string
          is_running: boolean
          last_reset_at: string | null
          mode: string
          updated_at: string
        }
        Insert: {
          config_jsonb?: Json
          created_at?: string
          id?: string
          is_running?: boolean
          last_reset_at?: string | null
          mode?: string
          updated_at?: string
        }
        Update: {
          config_jsonb?: Json
          created_at?: string
          id?: string
          is_running?: boolean
          last_reset_at?: string | null
          mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      ottoq_vehicles: {
        Row: {
          city_id: string
          created_at: string
          external_ref: string | null
          health_jsonb: Json | null
          id: string
          last_telemetry_at: string | null
          odometer_km: number
          oem: string
          plate: string | null
          soc: number
          status: Database["public"]["Enums"]["ottoq_vehicle_status"]
          updated_at: string
          vin: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          external_ref?: string | null
          health_jsonb?: Json | null
          id?: string
          last_telemetry_at?: string | null
          odometer_km?: number
          oem?: string
          plate?: string | null
          soc?: number
          status?: Database["public"]["Enums"]["ottoq_vehicle_status"]
          updated_at?: string
          vin?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          external_ref?: string | null
          health_jsonb?: Json | null
          id?: string
          last_telemetry_at?: string | null
          odometer_km?: number
          oem?: string
          plate?: string | null
          soc?: number
          status?: Database["public"]["Enums"]["ottoq_vehicle_status"]
          updated_at?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ottoq_vehicles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "ottoq_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      ottoq_webhooks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          secret: string | null
          target: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          secret?: string | null
          target: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          secret?: string | null
          target?: string
        }
        Relationships: []
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
      create_ottoq_depot_resources: {
        Args: { depot_uuid: string }
        Returns: undefined
      }
      get_random_vehicles_for_city: {
        Args: { p_city_id: string; p_limit?: number }
        Returns: {
          city_id: string
          city_name: string
          created_at: string
          external_ref: string
          health_jsonb: Json
          id: string
          last_telemetry_at: string
          odometer_km: number
          oem: string
          plate: string
          soc: number
          status: string
          updated_at: string
          vin: string
        }[]
      }
    }
    Enums: {
      ottoq_entity_type:
        | "VEHICLE"
        | "DEPOT"
        | "RESOURCE"
        | "JOB"
        | "SCHEDULE"
        | "SIMULATOR"
      ottoq_job_state:
        | "PENDING"
        | "SCHEDULED"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELLED"
        | "EXPIRED"
      ottoq_job_type: "CHARGE" | "MAINTENANCE" | "DETAILING" | "DOWNTIME_PARK"
      ottoq_resource_status:
        | "AVAILABLE"
        | "RESERVED"
        | "BUSY"
        | "OUT_OF_SERVICE"
      ottoq_resource_type:
        | "CHARGE_STALL"
        | "CLEAN_DETAIL_STALL"
        | "MAINTENANCE_BAY"
      ottoq_vehicle_status:
        | "IDLE"
        | "ENROUTE_DEPOT"
        | "AT_DEPOT"
        | "IN_SERVICE"
        | "ON_TRIP"
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
      ottoq_entity_type: [
        "VEHICLE",
        "DEPOT",
        "RESOURCE",
        "JOB",
        "SCHEDULE",
        "SIMULATOR",
      ],
      ottoq_job_state: [
        "PENDING",
        "SCHEDULED",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
      ],
      ottoq_job_type: ["CHARGE", "MAINTENANCE", "DETAILING", "DOWNTIME_PARK"],
      ottoq_resource_status: [
        "AVAILABLE",
        "RESERVED",
        "BUSY",
        "OUT_OF_SERVICE",
      ],
      ottoq_resource_type: [
        "CHARGE_STALL",
        "CLEAN_DETAIL_STALL",
        "MAINTENANCE_BAY",
      ],
      ottoq_vehicle_status: [
        "IDLE",
        "ENROUTE_DEPOT",
        "AT_DEPOT",
        "IN_SERVICE",
        "ON_TRIP",
      ],
    },
  },
} as const
