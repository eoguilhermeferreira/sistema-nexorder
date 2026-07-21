"use client";

import { useEffect, useState } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { OrderCard } from "@/components/admin/OrderCard";
import { useCompany } from "@/contexts/CompanyContext";
import { formatCurrency, formatTime, isToday } from "@/lib/format";
import type { Order, PrepTimes } from "@/types/domain";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const company = useCompany();
  const { orders, loading } = useRealtimeOrders(company.id);
  const [prepTimes, setPrepTimes] = useState<PrepTimes | null>(null);

  // history lookup
  const [histDate, setHistDate] = useState("");
  const [histOrders, setHistOrders] = useState<Order[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("prep_times")
      .select("*")
      .eq("company_id", company.id)
      .single()
      .then(({ data }) => setPrepTimes(data));
  }, [company.id]);

  async function loadHistory(date: string) {
    if (!date) return;
    setHistLoading(true);
    setHistOrders(null);
    const supabase = createClient();
    const start = `${date}T00:00:00-03:00`;
    const end = `${date}T23:59:59-03:00`;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("company_id", company.id)
      .gte("created_at", start)
      .lte("created_at", end)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false });
    setHistOrders((data as unknown as Order[]) ?? []);
    setHistLoading(false);
  }

  const todayOrders = orders.filter((o) => isToday(o.created_at));
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");
  const entregas = orders.filter((o) => o.type === "entrega" && o.status !== "concluido" && o.status !== "cancelado");
  const mesasOcupadas = new Set(orders.filter((o) => o.type === "mesa" && o.status !== "concluido").map((o) => o.table_id)).size;
  const faturamentoHoje = todayOrders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders].reverse().slice(0, 8);

  const histFaturamento = (histOrders ?? []).reduce((sum, o) => sum + o.total, 0);
  const histLabel = histDate
    ? new Date(`${histDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

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

      {/* history date picker */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium text-foreground shrink-0">📅 Ver faturamento de outro dia:</span>
        <input
          type="date"
          max={todayStr()}
          value={histDate}
          onChange={(e) => {
            setHistDate(e.target.value);
            setHistOrders(null);
          }}
          className="rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground"
        />
        <button
          onClick={() => loadHistory(histDate)}
          disabled={!histDate || histLoading}
          className="rounded-lg bg-wine px-4 py-1.5 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
        >
          {histLoading ? "Buscando..." : "Buscar"}
        </button>
        {histDate && (
          <button
            onClick={() => { setHistDate(""); setHistOrders(null); }}
            className="text-xs text-muted hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>

      {/* history result */}
      {histOrders !== null && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{histLabel}</p>
              <p className="text-xs text-muted">{histOrders.length} pedido(s) concluído(s)</p>
            </div>
            <p className="text-xl font-bold text-wine">{formatCurrency(histFaturamento)}</p>
          </div>

          {histOrders.length > 0 && (
            <div className="mt-4 divide-y divide-border">
              {histOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-foreground">#{order.order_code}</span>
                    <span className="ml-2 text-muted">{order.customer_name}</span>
                    <span className="ml-2 text-xs text-muted">{formatTime(order.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted capitalize">{order.type}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {histOrders.length === 0 && (
            <p className="mt-3 text-sm text-muted">Nenhum pedido neste dia.</p>
          )}
        </div>
      )}

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
