"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/domain";

const deliverySteps: { key: OrderStatus; label: string }[] = [
  { key: "aguardando_aceite", label: "Pedido recebido" },
  { key: "em_preparo", label: "Em preparo" },
  { key: "pronto", label: "Pronto" },
  { key: "saiu_entrega", label: "Saiu para entrega" },
  { key: "concluido", label: "Entregue" },
];

const pickupSteps: { key: OrderStatus; label: string }[] = [
  { key: "aguardando_aceite", label: "Pedido recebido" },
  { key: "em_preparo", label: "Em preparo" },
  { key: "pronto", label: "Pronto para retirada" },
  { key: "concluido", label: "Retirado" },
];

export default function PedidoTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase.from("orders").select("*, order_items(*), addresses(*)").eq("id", orderId).single();
      setOrder((data as unknown as Order) ?? null);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) return <p className="p-8 text-sm text-muted">Carregando pedido...</p>;
  if (!order) return <p className="p-8 text-sm text-muted">Pedido não encontrado.</p>;

  if (order.status === "cancelado") {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Pedido cancelado</p>
        <p className="mt-2 text-sm text-muted">#{order.order_code}</p>
      </div>
    );
  }

  const steps = order.type === "entrega" ? deliverySteps : pickupSteps;
  const currentIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto max-w-md p-6">
      <p className="text-sm text-muted">Pedido #{order.order_code}</p>
      <h1 className="mt-1 text-xl font-semibold text-foreground">Olá, {order.customer_name}!</h1>

      <div className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${index <= currentIndex ? "bg-wine" : "bg-card-hover"}`} />
            <p className={`text-sm ${index <= currentIndex ? "text-foreground" : "text-muted"}`}>{step.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Itens</p>
        <div className="mt-2 space-y-2">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted">{item.quantity}x {item.product_name}{item.size_name ? ` (${item.size_name})` : ""}</span>
              <span className="text-foreground">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-right text-sm font-semibold text-foreground">Total: {formatCurrency(order.total)}</p>
      </div>
    </div>
  );
}
