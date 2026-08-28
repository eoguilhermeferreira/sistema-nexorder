"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { useCaixa } from "@/lib/hooks/useCaixa";
import { createClient } from "@/lib/supabase/client";
import { OrderCard } from "@/components/admin/OrderCard";
import { useCompany } from "@/contexts/CompanyContext";
import { printOrder } from "@/lib/print";
import { isToday } from "@/lib/format";
import type { PrepTimes } from "@/types/domain";

export default function CozinhaPage() {
  const company = useCompany();
  const router = useRouter();
  const { orders, refetch } = useRealtimeOrders(company.id);
  const { isOpen: caixaAberto, loading: caixaLoading } = useCaixa(company.id);
  const [prepTimes, setPrepTimes] = useState<PrepTimes | null>(null);
  const prevAguardandoCount = useRef<number | null>(null);
  const [savingPrepTimes, setSavingPrepTimes] = useState(false);
  const [showConcluidos, setShowConcluidos] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("prep_times")
      .select("*")
      .eq("company_id", company.id)
      .single()
      .then(({ data }) => setPrepTimes(data));
  }, [company.id]);

  const aguardando = orders.filter((o) => o.status === "aguardando_aceite");

  // play beep when new orders arrive
  useEffect(() => {
    if (prevAguardandoCount.current === null) {
      prevAguardandoCount.current = aguardando.length;
      return;
    }
    if (aguardando.length > prevAguardandoCount.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [0, 180, 360].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.15);
          osc.start(ctx.currentTime + delay / 1000);
          osc.stop(ctx.currentTime + delay / 1000 + 0.15);
        });
      } catch {}
    }
    prevAguardandoCount.current = aguardando.length;
  }, [aguardando.length]);
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");
  const concluidosHoje = orders.filter(
    (o) => o.status === "concluido" && isToday(o.concluded_at ?? o.created_at)
  );

  const activeOrders = [
    // newest first within each group, aguardando on top
    ...aguardando.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    ...emPreparo.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  ];

  async function acceptOrder(orderId: string) {
    if (!caixaLoading && !caixaAberto) {
      router.push("/dashboard?abrir_caixa=1");
      return;
    }
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

  async function returnToKitchen(orderId: string) {
    const supabase = createClient();
    await supabase.from("orders").update({ status: "em_preparo" }).eq("id", orderId);
    refetch();
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancelar este pedido?")) return;
    const supabase = createClient();
    await supabase.from("orders").update({ status: "cancelado" }).eq("id", orderId);
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
      .eq("company_id", company.id);
    setSavingPrepTimes(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Cozinha</h1>

      <div className="mt-4 grid grid-cols-4 gap-4">
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
        <button
          onClick={() => setShowConcluidos((v) => !v)}
          className="rounded-xl border border-border bg-card p-4 text-center hover:bg-card-hover transition-colors"
        >
          <p className="text-sm text-muted">Concluídos hoje</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{concluidosHoje.length}</p>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-3">
          {activeOrders.length === 0 && !showConcluidos && (
            <p className="text-sm text-muted">Nenhum pedido em andamento.</p>
          )}

          {showConcluidos && (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Concluídos hoje</h2>
                <button onClick={() => setShowConcluidos(false)} className="text-xs text-muted hover:text-foreground">Fechar</button>
              </div>
              {concluidosHoje.length === 0 ? (
                <p className="text-sm text-muted">Nenhum pedido concluído hoje.</p>
              ) : (
                <div className="space-y-3">
                  {concluidosHoje
                    .sort((a, b) => new Date(b.concluded_at ?? b.created_at).getTime() - new Date(a.concluded_at ?? a.created_at).getTime())
                    .map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                </div>
              )}
              <hr className="my-4 border-border" />
            </div>
          )}

          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order}>
              {order.status === "aguardando_aceite" && (
                <>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                    title="Recusar pedido"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="flex-1 rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
                  >
                    Aceitar Pedido
                  </button>
                </>
              )}
              {order.status === "em_preparo" && (
                <>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                    title="Cancelar pedido"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => printOrder(order)}
                    className="rounded-lg bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={() => markReady(order.id)}
                    className="flex-1 rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover"
                  >
                    Pedido Pronto
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
