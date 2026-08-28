"use client";

import { useMemo, useState, useCallback } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatTime, isToday } from "@/lib/format";
import { printOrder } from "@/lib/print";
import type { Order } from "@/types/domain";

type StatusFilter = "pronto" | "saiu_entrega" | "concluidas";

export default function EntregasPage() {
  const company = useCompany();
  const { orders, refetch } = useRealtimeOrders(company.id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pronto");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entregas = orders.filter((o) => o.type === "entrega");
  const prontos = entregas.filter((o) => o.status === "pronto");
  const emRota = entregas.filter((o) => o.status === "saiu_entrega");
  const concluidasHoje = entregas.filter((o) => o.status === "concluido" && isToday(o.concluded_at ?? o.created_at));

  const byFilter: Record<StatusFilter, Order[]> = {
    pronto: prontos,
    saiu_entrega: emRota,
    concluidas: concluidasHoje,
  };

  const list = byFilter[statusFilter]
    .filter((o) => o.customer_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  async function dispatchOrder(orderId: string) {
    const supabase = createClient();
    await supabase.from("orders").update({ status: "saiu_entrega" }).eq("id", orderId);
    refetch();
  }

  async function finalizeOrder(orderId: string) {
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "concluido", concluded_at: new Date().toISOString() })
      .eq("id", orderId);
    setSelectedId(null);
    refetch();
  }

  const changePayment = useCallback(async (orderId: string, method: string) => {
    const supabase = createClient();
    await supabase.from("orders").update({ payment_method: method }).eq("id", orderId);
    refetch();
  }, [refetch]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Entregas</h1>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Prontos para sair</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{prontos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Em rota</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{emRota.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Entregues hoje</p>
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
                onClick={() => setStatusFilter("pronto")}
                className={`rounded-md px-3 py-1 text-sm ${
                  statusFilter === "pronto" ? "bg-wine text-white" : "text-muted"
                }`}
              >
                Prontos
              </button>
              <button
                onClick={() => setStatusFilter("saiu_entrega")}
                className={`rounded-md px-3 py-1 text-sm ${
                  statusFilter === "saiu_entrega" ? "bg-wine text-white" : "text-muted"
                }`}
              >
                Em rota
              </button>
              <button
                onClick={() => setStatusFilter("concluidas")}
                className={`rounded-md px-3 py-1 text-sm ${
                  statusFilter === "concluidas" ? "bg-wine text-white" : "text-muted"
                }`}
              >
                Entregues
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {list.length === 0 && <p className="text-sm text-muted">Nenhum pedido encontrado.</p>}
            {list.map((order) => {
              const address = order.addresses?.[0];
              return (
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
                    <p className="text-sm text-muted">
                      {formatTime(order.created_at)} • {formatCurrency(order.total)}
                      {address?.neighborhood ? ` • ${address.neighborhood}` : ""}
                    </p>
                  </div>
                  {order.payment_method === "dinheiro" && order.change_for != null && (
                    <span className="text-xs text-muted">Troco p/ {formatCurrency(order.change_for)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!selectedOrder && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
              Selecione um pedido para ver os detalhes.
            </div>
          )}

          {selectedOrder && (
            <OrderDetail order={selectedOrder} onDispatch={dispatchOrder} onFinalize={finalizeOrder} onPaymentChange={changePayment} />
          )}
        </div>
      </div>
    </div>
  );
}

const paymentOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
];

function OrderDetail({
  order,
  onDispatch,
  onFinalize,
  onPaymentChange,
}: {
  order: Order;
  onDispatch: (id: string) => void;
  onFinalize: (id: string) => void;
  onPaymentChange: (id: string, method: string) => void;
}) {
  const address = order.addresses?.[0];
  const [addingItem, setAddingItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  async function addItem() {
    if (!itemName.trim() || !itemPrice) return;
    setAddingLoading(true);
    const supabase = createClient();
    const qty = parseInt(itemQty) || 1;
    const price = parseFloat(itemPrice.replace(",", "."));
    await (supabase as any).from("order_items").insert({
      order_id: order.id,
      product_name: itemName.trim(),
      category_name: null,
      quantity: qty,
      price,
      flavors: [],
      additions: [],
      removed_ingredients: [],
    });
    await supabase.from("orders").update({ total: order.total + price * qty }).eq("id", order.id);
    setItemName(""); setItemQty("1"); setItemPrice(""); setAddingItem(false); setAddingLoading(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-semibold text-foreground">#{order.order_code}</p>
      <p className="text-sm text-muted">{order.customer_name}</p>
      {order.customer_phone && <p className="text-sm text-muted">{order.customer_phone}</p>}

      {address && (
        <div className="mt-3 rounded-lg bg-card-hover p-3 text-sm">
          <p className="text-foreground">
            {address.street}, {address.number}
            {address.complement ? ` - ${address.complement}` : ""}
          </p>
          <p className="text-muted">
            {address.neighborhood} • {address.city}/{address.state}
          </p>
          {address.zip_code && <p className="text-muted">CEP {address.zip_code}</p>}
          {address.reference && <p className="text-muted">Ref: {address.reference}</p>}
        </div>
      )}

      <ul className="mt-4 space-y-3 text-sm text-muted">
        {(order.order_items ?? []).map((item) => (
          <li key={item.id}>
            {item.category_name && (
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{item.category_name}</p>
            )}
            <p className="text-foreground font-medium">{item.quantity}x {item.product_name}{item.size_name ? ` (${item.size_name})` : ""}</p>
            {item.flavors && item.flavors.length > 0 && (
              <p>Sabores: {item.flavors.map((f) => f.name).join(", ")}</p>
            )}
            {item.border_name && <p>Borda: {item.border_name}</p>}
            {item.additions?.length ? <p>+ {(item.additions as unknown as { name: string; qty: number }[]).map((a) => a.qty > 1 ? `${a.name} x${a.qty}` : a.name).join(", ")}</p> : null}
            {item.removed_ingredients?.length ? <p className="text-red-400">- {item.removed_ingredients.join(", ")}</p> : null}
            {item.notes && <p className="italic">{item.notes}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted shrink-0">Pagamento</span>
          <select
            value={order.payment_method ?? ""}
            onChange={(e) => onPaymentChange(order.id, e.target.value)}
            className="rounded-lg border border-border bg-card-hover px-2 py-1 text-sm text-foreground"
          >
            {paymentOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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

      {addingItem && (
        <div className="mt-3 space-y-2 rounded-lg border border-border bg-card-hover p-3 text-sm">
          <p className="font-medium text-foreground">Adicionar item</p>
          <input
            placeholder="Nome do item (ex: Refrigerante)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Qtd"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(e.target.value)}
              className="w-16 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
            />
            <input
              placeholder="Valor (ex: 6,00)"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddingItem(false)} className="flex-1 rounded-lg border border-border py-1.5 text-sm text-muted hover:bg-card">Cancelar</button>
            <button onClick={addItem} disabled={addingLoading} className="flex-1 rounded-lg bg-wine py-1.5 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">
              {addingLoading ? "..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {!addingItem && (
          <button
            onClick={() => setAddingItem(true)}
            className="w-full rounded-lg border border-border bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
          >
            + Adicionar Item
          </button>
        )}
        <button
          onClick={() => printOrder(order)}
          className="w-full rounded-lg bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
        >
          Imprimir Pedido
        </button>
        {order.status === "pronto" && (
          <button
            onClick={() => onDispatch(order.id)}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
          >
            Saiu para Entrega
          </button>
        )}
        {order.status === "saiu_entrega" && (
          <button
            onClick={() => onFinalize(order.id)}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
          >
            Marcar como Entregue
          </button>
        )}
      </div>
    </div>
  );
}
