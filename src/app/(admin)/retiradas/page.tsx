"use client";

import { useMemo, useState } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatTime, isToday } from "@/lib/format";
import { printOrder } from "@/lib/print";
import type { Order } from "@/types/domain";

type StatusFilter = "aguardando" | "concluidas";

export default function RetiradasPage() {
  const company = useCompany();
  const { orders, refetch } = useRealtimeOrders(company.id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aguardando");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const retiradas = orders.filter((o) => o.type === "retirada");
  const aguardando = retiradas.filter((o) => o.status === "pronto");
  const concluidasHoje = retiradas.filter((o) => o.status === "concluido" && isToday(o.concluded_at ?? o.created_at));

  const list = (statusFilter === "aguardando" ? aguardando : concluidasHoje)
    .filter((o) => o.customer_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  async function finalizeOrder(orderId: string) {
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "concluido", concluded_at: new Date().toISOString() })
      .eq("id", orderId);
    setSelectedId(null);
    refetch();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Retiradas</h1>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Aguardando retirada</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{aguardando.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Concluídas hoje</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{concluidasHoje.length}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            />
            <div className="flex gap-1 rounded-lg bg-card-hover p-1">
              <button
                onClick={() => setStatusFilter("aguardando")}
                className={`rounded-md px-3 py-1 text-sm ${
                  statusFilter === "aguardando" ? "bg-wine text-white" : "text-muted"
                }`}
              >
                Aguardando
              </button>
              <button
                onClick={() => setStatusFilter("concluidas")}
                className={`rounded-md px-3 py-1 text-sm ${
                  statusFilter === "concluidas" ? "bg-wine text-white" : "text-muted"
                }`}
              >
                Concluídas
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {list.length === 0 && <p className="text-sm text-muted">Nenhum pedido encontrado.</p>}
            {list.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  selectedId === order.id
                    ? "border-wine bg-card-hover"
                    : "border-border bg-card hover:bg-card-hover"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">#{order.order_code} — {order.customer_name}</p>
                  <p className="text-sm text-muted">{formatTime(order.created_at)} • {formatCurrency(order.total)}</p>
                </div>
                {order.payment_method === "dinheiro" && order.change_for != null && (
                  <span className="text-xs text-muted">Troco p/ {formatCurrency(order.change_for)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          {!selectedOrder && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
              Selecione um pedido para ver os detalhes.
            </div>
          )}

          {selectedOrder && <OrderDetail order={selectedOrder} onFinalize={finalizeOrder} />}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onFinalize }: { order: Order; onFinalize: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-semibold text-foreground">#{order.order_code}</p>
      <p className="text-sm text-muted">{order.customer_name}</p>
      {order.customer_phone && <p className="text-sm text-muted">{order.customer_phone}</p>}

      <ul className="mt-4 space-y-2 text-sm text-muted">
        {(order.order_items ?? []).map((item) => (
          <li key={item.id}>
            <p className="text-foreground">{item.quantity}x {item.product_name}{item.size_name ? ` (${item.size_name})` : ""}</p>
            {item.flavors && item.flavors.length > 0 && (
              <p>Sabores: {item.flavors.map((f) => f.name).join(", ")}</p>
            )}
            {item.border_name && <p>Borda: {item.border_name}</p>}
            {item.additions?.length ? <p>+ {item.additions.join(", ")}</p> : null}
            {item.removed_ingredients?.length ? <p>- {item.removed_ingredients.join(", ")}</p> : null}
            {item.notes && <p className="italic">{item.notes}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Pagamento</span>
          <span className="text-foreground">{order.payment_method ?? "-"}</span>
        </div>
        {order.payment_method === "dinheiro" && order.change_for != null && (
          <div className="flex justify-between">
            <span className="text-muted">Troco para</span>
            <span className="text-foreground">{formatCurrency(order.change_for)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span className="text-muted">Total</span>
          <span className="text-foreground">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {order.notes && <p className="mt-3 text-sm italic text-muted">Obs: {order.notes}</p>}

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={() => printOrder(order)}
          className="w-full rounded-lg bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
        >
          🖨️ Imprimir Pedido
        </button>
        {order.status === "pronto" && (
          <button
            onClick={() => onFinalize(order.id)}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
          >
            Finalizar Retirada
          </button>
        )}
      </div>
    </div>
  );
}
