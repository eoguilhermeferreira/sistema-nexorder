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
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  size_id: string | null;
  size_name: string | null;
  flavors: OrderItemFlavor[] | null;
  border_id: string | null;
  border_name: string | null;
  border_price: number | null;
  additions: string[] | null;
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
  position: number;
  available: boolean;
}

export interface ProductSize {
  id: string;
  product_id: string;
  name: string;
  slices: number | null;
  max_flavors: number;
  price: number;
}

export interface Flavor {
  id: string;
  company_id: string;
  name: string;
  image_url: string | null;
  ingredients: { name: string; removable: boolean }[];
  available: boolean;
}

export interface Addon {
  id: string;
  company_id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Border {
  id: string;
  company_id: string;
  name: string;
  prices_by_size: Record<string, number>;
  available: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  type: "pizza" | "comum";
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  available: boolean;
  position: number;
}

export interface Address {
  id: string;
  company_id: string;
  customer_name: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface CompanySettings {
  company_id: string;
  ask_change_for_cash: boolean;
  payment_methods: string[];
  notifications: Record<string, boolean>;
  realtime_enabled: boolean;
}

export interface BusinessHours {
  id: string;
  company_id: string;
  weekday: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}
