"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types/domain";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function fmtDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const typeLabels: Record<string, string> = {
  entrega: "Entrega",
  retirada: "Retirada",
  mesa: "Mesa",
};

export default function RelatoriosPage() {
  const company = useCompany();
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(todayStr());
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function buscar() {
    setLoading(true);
    const supabase = createClient();
    const start = `${startDate}T00:00:00-03:00`;
    const end = `${endDate}T23:59:59-03:00`;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("company_id", company.id)
      .neq("status", "cancelado")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });
    setOrders((data as unknown as Order[]) ?? []);
    setLoading(false);
  }

  const totalFat = (orders ?? []).reduce((s, o) => s + o.total, 0);

  const byDay = (orders ?? []).reduce<Record<string, { count: number; total: number }>>((acc, o) => {
    const day = o.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = { count: 0, total: 0 };
    acc[day].count++;
    acc[day].total += o.total;
    return acc;
  }, {});

  const byType = (orders ?? []).reduce<Record<string, { count: number; total: number }>>((acc, o) => {
    if (!acc[o.type]) acc[o.type] = { count: 0, total: 0 };
    acc[o.type].count++;
    acc[o.type].total += o.total;
    return acc;
  }, {});

  const ticketMedio = orders && orders.length > 0 ? totalFat / orders.length : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
      <p className="mt-1 text-sm text-muted">Faturamento e pedidos por período</p>

      {/* filtro */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-4">
        <label className="block text-sm">
          <span className="text-muted">De</span>
          <input
            type="date"
            max={endDate}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Até</span>
          <input
            type="date"
            max={todayStr()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground"
          />
        </label>
        <button
          onClick={buscar}
          disabled={loading || !startDate || !endDate}
          className="rounded-lg bg-wine px-5 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Gerar Relatório"}
        </button>

        {/* atalhos rápidos */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Hoje", fn: () => { setStartDate(todayStr()); setEndDate(todayStr()); } },
            { label: "Este mês", fn: () => { setStartDate(firstDayOfMonth()); setEndDate(todayStr()); } },
            {
              label: "Últimos 7 dias",
              fn: () => {
                const d = new Date();
                d.setDate(d.getDate() - 6);
                setStartDate(d.toISOString().slice(0, 10));
                setEndDate(todayStr());
              },
            },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="rounded-lg border border-border bg-card-hover px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {orders !== null && (
        <>
          {/* totais */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Total Faturado</p>
              <p className="mt-1 text-2xl font-bold text-wine">{formatCurrency(totalFat)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Pedidos</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Ticket Médio</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(ticketMedio)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Período</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{fmtDate(startDate)} — {fmtDate(endDate)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* por tipo */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">Por Tipo de Pedido</h2>
              <div className="mt-3 space-y-2">
                {Object.entries(byType).map(([type, { count, total }]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{typeLabels[type] ?? type}</span>
                    <div className="flex gap-4">
                      <span className="text-muted">{count} pedido(s)</span>
                      <span className="font-medium text-foreground w-24 text-right">{formatCurrency(total)}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(byType).length === 0 && <p className="text-sm text-muted">Nenhum pedido.</p>}
              </div>
            </div>

            {/* por dia */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">Por Dia</h2>
              <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                {Object.entries(byDay)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([day, { count, total }]) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{fmtDate(day)}</span>
                      <div className="flex gap-4">
                        <span className="text-muted">{count} pedido(s)</span>
                        <span className="font-medium text-foreground w-24 text-right">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(byDay).length === 0 && <p className="text-sm text-muted">Nenhum pedido.</p>}
              </div>
            </div>
          </div>

          {/* lista detalhada */}
          {orders.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">Pedidos do Período</h2>
              <div className="mt-3 divide-y divide-border">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-foreground">#{order.order_code}</span>
                      <span className="ml-2 text-muted">{order.customer_name}</span>
                      <span className="ml-2 text-xs text-muted">
                        {fmtDate(order.created_at.slice(0, 10))} {fmtTime(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{typeLabels[order.type] ?? order.type}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
