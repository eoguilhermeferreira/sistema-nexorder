"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/domain";

const deliverySteps: { key: OrderStatus; label: string; emoji: string; desc: string }[] = [
  { key: "aguardando_aceite", label: "Pedido recebido", emoji: "📋", desc: "Aguardando o restaurante confirmar" },
  { key: "em_preparo", label: "Em preparo", emoji: "👨‍🍳", desc: "Seu pedido está sendo preparado" },
  { key: "pronto", label: "Saindo em breve", emoji: "📦", desc: "Embalando e preparando para entrega" },
  { key: "saiu_entrega", label: "Saiu para entrega", emoji: "🛵", desc: "O entregador está a caminho" },
  { key: "concluido", label: "Entregue!", emoji: "🎉", desc: "Bom apetite!" },
];

const pickupSteps: { key: OrderStatus; label: string; emoji: string; desc: string }[] = [
  { key: "aguardando_aceite", label: "Pedido recebido", emoji: "📋", desc: "Aguardando o restaurante confirmar" },
  { key: "em_preparo", label: "Em preparo", emoji: "👨‍🍳", desc: "Seu pedido está sendo preparado" },
  { key: "pronto", label: "Pronto para retirada", emoji: "✅", desc: "Pode vir buscar!" },
  { key: "concluido", label: "Retirado!", emoji: "🎉", desc: "Bom apetite!" },
];

const mesaSteps: { key: OrderStatus; label: string; emoji: string; desc: string }[] = [
  { key: "aguardando_aceite", label: "Pedido recebido", emoji: "📋", desc: "Aguardando o restaurante confirmar" },
  { key: "em_preparo", label: "Em preparo", emoji: "👨‍🍳", desc: "Seu pedido está sendo preparado" },
  { key: "pronto", label: "Saindo da cozinha", emoji: "🍽️", desc: "Chegando à sua mesa!" },
  { key: "concluido", label: "Entregue!", emoji: "🎉", desc: "Bom apetite!" },
];

export default function PedidoTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), addresses(*)")
        .eq("id", orderId)
        .single();
      setOrder((data as unknown as Order) ?? null);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-wine border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) return <p className="p-8 text-sm text-muted">Pedido não encontrado.</p>;

  if (order.status === "cancelado") {
    return (
      <div className="p-8 text-center">
        <span className="text-5xl">😔</span>
        <p className="mt-4 text-xl font-semibold text-foreground">Pedido cancelado</p>
        <p className="mt-1 text-sm text-muted">#{order.order_code}</p>
      </div>
    );
  }

  const steps =
    order.type === "entrega" ? deliverySteps :
    order.type === "mesa" ? mesaSteps :
    pickupSteps;

  const currentIndex = steps.findIndex((s) => s.key === order.status);
  const currentStep = steps[currentIndex];
  const isDone = order.status === "concluido";

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      {/* top hero */}
      <div className="flex flex-col items-center pb-8 text-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg transition-all duration-700 ${
            isDone ? "bg-green-500/20" : "bg-wine/10"
          }`}
          style={{ animation: isDone ? "none" : "pulse 2s ease-in-out infinite" }}
        >
          {currentStep?.emoji ?? "📋"}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">
          {currentStep?.label ?? "Processando..."}
        </h1>
        <p className="mt-1 text-sm text-muted">{currentStep?.desc}</p>
        <p className="mt-3 text-xs text-muted">Pedido #{order.order_code} · {order.customer_name}</p>
      </div>

      {/* progress steps */}
      <div>
        <div className="relative">
          {steps.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            const pending = index > currentIndex;

            return (
              <div key={step.key} className="flex gap-4" style={{ marginBottom: index < steps.length - 1 ? 0 : undefined }}>
                {/* left: dot + connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500 ${
                      done
                        ? "border-wine bg-wine text-white"
                        : active
                        ? "border-wine bg-wine/10 text-wine"
                        : "border-border bg-card text-muted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="relative mt-0 w-0.5 flex-1 overflow-hidden bg-border" style={{ minHeight: 40 }}>
                      {/* filled portion */}
                      <div
                        className="absolute inset-x-0 top-0 bg-wine transition-all duration-700"
                        style={{ height: done ? "100%" : "0%" }}
                      />
                      {/* shimmer that runs back-and-forth on the active segment */}
                      {active && (
                        <div
                          className="absolute inset-x-0 top-0 bg-wine/40"
                          style={{
                            height: "100%",
                            animation: "shimmerLine 1.6s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* right: label */}
                <div className="pb-10">
                  <p
                    className={`text-sm font-semibold leading-8 transition-colors duration-300 ${
                      done ? "text-wine" : active ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {step.emoji} {step.label}
                  </p>
                  {active && (
                    <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* order summary */}
      <div className="mt-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Resumo do pedido</p>
        <div className="mt-3 space-y-2">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="text-sm">
              {item.category_name && (
                <p className="text-xs text-muted">{item.category_name}</p>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-foreground">
                  {item.quantity}x {item.product_name}
                  {item.size_name ? ` (${item.size_name})` : ""}
                </span>
                <span className="text-muted">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              {item.flavors && (item.flavors as unknown as { name: string }[]).length > 0 && (
                <p className="text-xs text-muted">
                  Sabores: {(item.flavors as unknown as { name: string }[]).map((f) => f.name).join(", ")}
                </p>
              )}
              {(item.additions as unknown as { name: string; qty: number }[] | null)?.length ? (
                <p className="text-xs text-muted">
                  + {(item.additions as unknown as { name: string; qty: number }[])
                    .map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name))
                    .join(", ")}
                </p>
              ) : null}
              {item.notes && <p className="text-xs italic text-muted">{item.notes}</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-border pt-3 text-right text-sm font-semibold text-foreground">
          Total: {formatCurrency(order.total)}
        </div>
      </div>

      <div className="h-10" />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes shimmerLine {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
