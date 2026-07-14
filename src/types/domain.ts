export type OrderStatus =
  | "aguardando_aceite"
  | "em_preparo"
  | "pronto"
  | "saiu_entrega"
  | "em_entrega_mesa"
  | "concluido"
  | "cancelado";

export type OrderType = "entrega" | "retirada" | "mesa";

export type TableStatus = "livre" | "ocupada" | "encerrada";

export interface OrderItemFlavor {
  flavor_id: string;
  name: string;
  pizza_index?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  category_name: string | null;
  quantity: number;
  size_id: string | null;
  size_name: string | null;
  flavors: OrderItemFlavor[] | null;
  border_id: string | null;
  border_name: string | null;
  border_price: number | null;
  additions: AddonSelection[] | null;
  removed_ingredients: string[] | null;
  notes: string | null;
  price: number;
}

export interface Order {
  id: string;
  company_id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string | null;
  type: OrderType;
  table_id: string | null;
  table_customer_id: string | null;
  status: OrderStatus;
  payment_method: string | null;
  change_for: number | null;
  total: number;
  notes: string | null;
  prep_minutes_snapshot: number | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  concluded_at: string | null;
  archived_at: string | null;
  order_items?: OrderItem[];
  addresses?: Address[];
}

export interface PrepTimes {
  company_id: string;
  delivery_minutes: number;
  pickup_minutes: number;
  table_minutes: number;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  icon: string | null;
  display_order: number;
  active: boolean;
  is_pizza: boolean;
  pricing_mode: "fixed" | "per_flavor";
  created_at: string | null;
}

export interface FlavorSizePrice {
  id: string;
  flavor_id: string;
  size_id: string;
  price: number;
}

export interface CategorySize {
  id: string;
  category_id: string;
  name: string;
  price: number;
  slices: number | null;
  max_flavors: number;
  display_order: number;
}

export interface ProductSize {
  id: string;
  product_id: string;
  name: string;
  slices: number | null;
  max_flavors: number;
  price: number;
  display_order: number;
}

export interface Flavor {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  image_url: string | null;
  ingredients: { name: string; removable: boolean }[];
  available: boolean;
  is_sweet: boolean;
  sweet_surcharge: number;
}

export interface Addon {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  price: number;
  group: string | null;
  active: boolean;
}

export interface AddonSizePrice {
  id: string;
  addon_id: string;
  size_id: string;
  price_half: number;
  price_whole: number;
}

export interface AddonSelection {
  id: string;
  name: string;
  price: number;
  qty: number;
  mode?: "half" | "whole" | null;
  flavor_name?: string | null;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  product_type: "pizza" | "comum";
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  active: boolean;
  created_at: string | null;
  bundle_pizza_count: number;
  bundle_max_flavors: number;
  bundle_flavor_category_id: string | null;
  product_sizes?: ProductSize[];
  product_flavors?: { flavor_id: string }[];
}

export interface Address {
  id: string;
  order_id: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  reference: string | null;
}

export interface CompanySettings {
  company_id: string;
  ask_change_for_cash: boolean;
  payment_methods: string[];
  notifications: Record<string, boolean>;
  realtime_enabled: boolean;
}

export type PaymentStatus = "pendente" | "pago";

export interface TableCustomer {
  id: string;
  table_id: string;
  name: string;
  subtotal: number | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  created_at: string | null;
}

export interface TableRestaurant {
  id: string;
  company_id: string;
  number: number;
  status: TableStatus;
  qr_code_url: string | null;
  created_at: string | null;
  table_customers?: TableCustomer[];
}

export interface BusinessHours {
  id: string;
  company_id: string;
  weekday: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}
