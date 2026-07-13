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
      addons: {
        Row: {
          active: boolean
          company_id: string
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          company_id: string
          id?: string
          name: string
          price?: number
        }
        Update: {
          active?: boolean
          company_id?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "addons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string | null
          complement: string | null
          id: string
          neighborhood: string | null
          number: string | null
          order_id: string
          reference: string | null
          state: string | null
          street: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          order_id: string
          reference?: string | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          order_id?: string
          reference?: string | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      borders: {
        Row: {
          active: boolean
          company_id: string
          id: string
          name: string
          prices: Json
        }
        Insert: {
          active?: boolean
          company_id: string
          id?: string
          name: string
          prices?: Json
        }
        Update: {
          active?: boolean
          company_id?: string
          id?: string
          name?: string
          prices?: Json
        }
        Relationships: [
          {
            foreignKeyName: "borders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          closed: boolean
          closes_at: string | null
          company_id: string
          id: string
          opens_at: string | null
          weekday: number
        }
        Insert: {
          closed?: boolean
          closes_at?: string | null
          company_id: string
          id?: string
          opens_at?: string | null
          weekday: number
        }
        Update: {
          closed?: boolean
          closes_at?: string | null
          company_id?: string
          id?: string
          opens_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          company_id: string
          created_at: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          auto_print: boolean | null
          banner_url: string | null
          city: string | null
          cnpj: string | null
          created_at: string | null
          description: string | null
          email: string | null
          facebook: string | null
          fantasy_name: string | null
          highlight_color: string | null
          id: string
          instagram: string | null
          is_open: boolean | null
          logo_shape: string | null
          logo_url: string | null
          name: string
          opening_hours: string | null
          owner_id: string | null
          phone: string | null
          primary_color: string | null
          print_copies: number | null
          printer_name: string | null
          secondary_color: string | null
          slug: string
          state: string | null
          tables_count: number | null
          website: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          auto_print?: boolean | null
          banner_url?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          fantasy_name?: string | null
          highlight_color?: string | null
          id?: string
          instagram?: string | null
          is_open?: boolean | null
          logo_shape?: string | null
          logo_url?: string | null
          name: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          print_copies?: number | null
          printer_name?: string | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          tables_count?: number | null
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          auto_print?: boolean | null
          banner_url?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          fantasy_name?: string | null
          highlight_color?: string | null
          id?: string
          instagram?: string | null
          is_open?: boolean | null
          logo_shape?: string | null
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          print_copies?: number | null
          printer_name?: string | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          tables_count?: number | null
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          ask_change_for_cash: boolean
          company_id: string
          notifications: Json
          payment_methods: Json
          realtime_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          ask_change_for_cash?: boolean
          company_id: string
          notifications?: Json
          payment_methods?: Json
          realtime_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          ask_change_for_cash?: boolean
          company_id?: string
          notifications?: Json
          payment_methods?: Json
          realtime_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      flavors: {
        Row: {
          available: boolean
          company_id: string
          id: string
          image_url: string | null
          ingredients: Json
          name: string
        }
        Insert: {
          available?: boolean
          company_id: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name: string
        }
        Update: {
          available?: boolean
          company_id?: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "flavors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          additions: string[] | null
          border_id: string | null
          border_name: string | null
          border_price: number | null
          flavors: Json | null
          id: string
          notes: string | null
          order_id: string
          price: number
          product_name: string
          quantity: number
          removed_ingredients: string[] | null
          size_id: string | null
          size_name: string | null
        }
        Insert: {
          additions?: string[] | null
          border_id?: string | null
          border_name?: string | null
          border_price?: number | null
          flavors?: Json | null
          id?: string
          notes?: string | null
          order_id: string
          price?: number
          product_name: string
          quantity?: number
          removed_ingredients?: string[] | null
          size_id?: string | null
          size_name?: string | null
        }
        Update: {
          additions?: string[] | null
          border_id?: string | null
          border_name?: string | null
          border_price?: number | null
          flavors?: Json | null
          id?: string
          notes?: string | null
          order_id?: string
          price?: number
          product_name?: string
          quantity?: number
          removed_ingredients?: string[] | null
          size_id?: string | null
          size_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_border_id_fkey"
            columns: ["border_id"]
            isOneToOne: false
            referencedRelation: "borders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          archived_at: string | null
          change_for: number | null
          company_id: string
          concluded_at: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string | null
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
          archived_at?: string | null
          change_for?: number | null
          company_id: string
          concluded_at?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
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
          archived_at?: string | null
          change_for?: number | null
          company_id?: string
          concluded_at?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
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
      product_flavors: {
        Row: {
          flavor_id: string
          product_id: string
        }
        Insert: {
          flavor_id: string
          product_id: string
        }
        Update: {
          flavor_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_flavors_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_flavors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          display_order: number
          id: string
          max_flavors: number
          name: string
          price: number
          product_id: string
          slices: number | null
        }
        Insert: {
          display_order?: number
          id?: string
          max_flavors?: number
          name: string
          price?: number
          product_id: string
          slices?: number | null
        }
        Update: {
          display_order?: number
          id?: string
          max_flavors?: number
          name?: string
          price?: number
          product_id?: string
          slices?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          base_price: number
          category_id: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          product_type: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          category_id?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          product_type?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          product_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
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
