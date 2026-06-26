"use client";

import { useEffect, useState } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { OrderCard } from "@/components/admin/OrderCard";
import { DEMO_COMPANY_ID } from "@/lib/constants";
import { formatCurrency, isToday } from "@/lib/format";
import type { PrepTimes } from "@/types/domain";

export default function DashboardPage() {
  const { orders, loading } = useRealtimeOrders(DEMO_COMPANY_ID);
  const [prepTimes, setPrepTimes] = useState<PrepTimes | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("prep_times")
      .select("*")
      .eq("company_id", DEMO_COMPANY_ID)
      .single()
      .then(({ data }) => setPrepTimes(data));
  }, []);

  const todayOrders = orders.filter((o) => isToday(o.created_at));
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");
  const entregas = orders.filter((o) => o.type === "entrega" && o.status !== "concluido" && o.status !== "cancelado");
  const mesasOcupadas = new Set(orders.filter((o) => o.type === "mesa" && o.status !== "concluido").map((o) => o.table_id)).size;
  const faturamentoHoje = todayOrders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders].reverse().slice(0, 8);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Visão geral do estabelecimento</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pedidos Hoje" value={todayOrders.length} />
        <StatCard label="Em Preparo" value={emPreparo.length} />
        <StatCard label="Prontos" value={prontos.length} />
        <StatCard label="Entregas" value={entregas.length} />
        <StatCard label="Mesas Ocupadas" value={mesasOcupadas} />
        <StatCard label="Faturamento Hoje" value={formatCurrency(faturamentoHoje)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-foreground">Atividade Recente</h2>
          <div className="mt-3 space-y-3">
            {loading && <p className="text-sm text-muted">Carregando...</p>}
            {!loading && recentOrders.length === 0 && (
              <p className="text-sm text-muted">Nenhum pedido ainda.</p>
            )}
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-foreground">Tempo Médio Atual</h2>
          <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Entrega</span>
              <span className="font-medium text-foreground">{prepTimes?.delivery_minutes ?? "-"} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Retirada</span>
              <span className="font-medium text-foreground">{prepTimes?.pickup_minutes ?? "-"} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Mesa</span>
              <span className="font-medium text-foreground">{prepTimes?.table_minutes ?? "-"} min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
