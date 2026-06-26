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

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
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
  type: OrderType;
  table_id: string | null;
  table_customer_id: string | null;
  status: OrderStatus;
  payment_method: string | null;
  total: number;
  notes: string | null;
  prep_minutes_snapshot: number | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  concluded_at: string | null;
  order_items?: OrderItem[];
}

export interface PrepTimes {
  company_id: string;
  delivery_minutes: number;
  pickup_minutes: number;
  table_minutes: number;
}
