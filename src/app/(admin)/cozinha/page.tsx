"use client";

import { useEffect, useState } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { createClient } from "@/lib/supabase/client";
import { OrderCard } from "@/components/admin/OrderCard";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { printOrder } from "@/lib/print";
import type { PrepTimes } from "@/types/domain";

export default function CozinhaPage() {
  const { orders, refetch } = useRealtimeOrders(DEMO_COMPANY_ID);
  const [prepTimes, setPrepTimes] = useState<PrepTimes | null>(null);
  const [savingPrepTimes, setSavingPrepTimes] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("prep_times")
      .select("*")
      .eq("company_id", DEMO_COMPANY_ID)
      .single()
      .then(({ data }) => setPrepTimes(data));
  }, []);

  const aguardando = orders.filter((o) => o.status === "aguardando_aceite");
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");

  const activeOrders = [...aguardando, ...emPreparo].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  async function acceptOrder(orderId: string) {
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "em_preparo", accepted_at: new Date().toISOString() })
      .eq("id", orderId);
    refetch();
  }

  async function markReady(orderId: string) {
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "pronto", ready_at: new Date().toISOString() })
      .eq("id", orderId);
    refetch();
  }

  async function savePrepTimes() {
    if (!prepTimes) return;
    setSavingPrepTimes(true);
    const supabase = createClient();
    await supabase
      .from("prep_times")
      .update({
        delivery_minutes: prepTimes.delivery_minutes,
        pickup_minutes: prepTimes.pickup_minutes,
        table_minutes: prepTimes.table_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", DEMO_COMPANY_ID);
    setSavingPrepTimes(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Cozinha</h1>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Aguardando aceite</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{aguardando.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Em preparo</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{emPreparo.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Prontos</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{prontos.length}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-3">
          {activeOrders.length === 0 && <p className="text-sm text-muted">Nenhum pedido em andamento.</p>}

          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order}>
              {order.status === "aguardando_aceite" && (
                <button
                  onClick={() => acceptOrder(order.id)}
                  className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
                >
                  Aceitar Pedido
                </button>
              )}
              {order.status === "em_preparo" && (
                <>
                  <button
                    onClick={() => printOrder(order)}
                    className="rounded-lg bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
                  >
                    🖨️ Imprimir Pedido
                  </button>
                  <button
                    onClick={() => markReady(order.id)}
                    className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
                  >
                    🍕 Pedido Pronto
                  </button>
                </>
              )}
            </OrderCard>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-medium text-foreground">Tempo Médio</h2>
          {prepTimes && (
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4">
              <label className="block text-sm">
                <span className="text-muted">Entrega</span>
                <input
                  type="number"
                  value={prepTimes.delivery_minutes}
                  onChange={(e) =>
                    setPrepTimes({ ...prepTimes, delivery_minutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Retirada</span>
                <input
                  type="number"
                  value={prepTimes.pickup_minutes}
                  onChange={(e) =>
                    setPrepTimes({ ...prepTimes, pickup_minutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Mesa</span>
                <input
                  type="number"
                  value={prepTimes.table_minutes}
                  onChange={(e) =>
                    setPrepTimes({ ...prepTimes, table_minutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
                />
              </label>
              <button
                onClick={savePrepTimes}
                disabled={savingPrepTimes}
                className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
              >
                {savingPrepTimes ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
