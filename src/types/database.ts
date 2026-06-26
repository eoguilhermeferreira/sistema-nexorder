export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          auto_print: boolean | null
          banner_url: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          opening_hours: string | null
          owner_id: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          tables_count: number | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          auto_print?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          tables_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          auto_print?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          tables_count?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          additions: string[] | null
          id: string
          notes: string | null
          order_id: string
          price: number
          product_name: string
          quantity: number
          removed_ingredients: string[] | null
        }
        Insert: {
          additions?: string[] | null
          id?: string
          notes?: string | null
          order_id: string
          price?: number
          product_name: string
          quantity?: number
          removed_ingredients?: string[] | null
        }
        Update: {
          additions?: string[] | null
          id?: string
          notes?: string | null
          order_id?: string
          price?: number
          product_name?: string
          quantity?: number
          removed_ingredients?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          company_id: string
          concluded_at: string | null
          created_at: string | null
          customer_name: string
          id: string
          notes: string | null
          order_code: string
          payment_method: string | null
          prep_minutes_snapshot: number | null
          ready_at: string | null
          status: string
          table_customer_id: string | null
          table_id: string | null
          total: number
          type: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          concluded_at?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          order_code: string
          payment_method?: string | null
          prep_minutes_snapshot?: number | null
          ready_at?: string | null
          status?: string
          table_customer_id?: string | null
          table_id?: string | null
          total?: number
          type: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          concluded_at?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          order_code?: string
          payment_method?: string | null
          prep_minutes_snapshot?: number | null
          ready_at?: string | null
          status?: string
          table_customer_id?: string | null
          table_id?: string | null
          total?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_customer_id_fkey"
            columns: ["table_customer_id"]
            isOneToOne: false
            referencedRelation: "table_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables_restaurant"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_times: {
        Row: {
          company_id: string
          delivery_minutes: number
          pickup_minutes: number
          table_minutes: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          delivery_minutes?: number
          pickup_minutes?: number
          table_minutes?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          delivery_minutes?: number
          pickup_minutes?: number
          table_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_times_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      table_customers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          payment_method: string | null
          payment_status: string
          subtotal: number | null
          table_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          payment_method?: string | null
          payment_status?: string
          subtotal?: number | null
          table_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          payment_method?: string | null
          payment_status?: string
          subtotal?: number | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_customers_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables_restaurant"
            referencedColumns: ["id"]
          },
        ]
      }
      tables_restaurant: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          number: number
          qr_code_url: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          number: number
          qr_code_url?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          number?: number
          qr_code_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = DatabaseWithoutInternals["public"]

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
