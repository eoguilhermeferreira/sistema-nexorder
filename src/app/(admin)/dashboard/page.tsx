"use client";

import { useEffect, useState, useCallback } from "react";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { OrderCard } from "@/components/admin/OrderCard";
import { useCompany } from "@/contexts/CompanyContext";
import { formatCurrency, formatTime, isToday } from "@/lib/format";
import { printOrder } from "@/lib/print";
import type { Order, PrepTimes } from "@/types/domain";

interface CaixaSession {
  id: string;
  company_id: string;
  opened_at: string;
  closed_at: string | null;
  faturamento: number | null;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DashboardPage() {
  const company = useCompany();
  const { orders, loading } = useRealtimeOrders(company.id);
  const [prepTimes, setPrepTimes] = useState<PrepTimes | null>(null);

  // caixa
  const [caixa, setCaixa] = useState<CaixaSession | null | undefined>(undefined); // undefined = loading
  const [caixaLoading, setCaixaLoading] = useState(false);
  const [showCloseSummary, setShowCloseSummary] = useState<{ faturamento: number; pedidos: number } | null>(null);

  // history lookup
  const [histDate, setHistDate] = useState("");
  const [histOrders, setHistOrders] = useState<Order[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchCaixa = useCallback(async () => {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("caixa_sessions")
      .select("*")
      .eq("company_id", company.id)
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCaixa((data as CaixaSession) ?? null);
  }, [company.id]);

  useEffect(() => {
    fetchCaixa();
    const supabase = createClient();
    supabase
      .from("prep_times")
      .select("*")
      .eq("company_id", company.id)
      .single()
      .then(({ data }) => setPrepTimes(data));
  }, [company.id, fetchCaixa]);

  async function abrirCaixa() {
    setCaixaLoading(true);
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("caixa_sessions")
      .insert({ company_id: company.id })
      .select()
      .single();
    setCaixa(data as CaixaSession);
    setCaixaLoading(false);
  }

  async function fecharCaixa() {
    if (!caixa) return;
    setCaixaLoading(true);

    // calc faturamento from orders since opening
    const sessionOrders = orders.filter(
      (o) => o.status !== "cancelado" && new Date(o.created_at) >= new Date(caixa.opened_at)
    );
    const fat = sessionOrders.reduce((s, o) => s + o.total, 0);

    const supabase = createClient();
    await (supabase as any)
      .from("caixa_sessions")
      .update({ closed_at: new Date().toISOString(), faturamento: fat })
      .eq("id", caixa.id);

    setShowCloseSummary({ faturamento: fat, pedidos: sessionOrders.length });
    setCaixa(null);
    setCaixaLoading(false);
  }

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

  // orders filtered to current caixa session
  const sessionOrders = caixa
    ? orders.filter((o) => new Date(o.created_at) >= new Date(caixa.opened_at))
    : [];

  const todayOrders = orders.filter((o) => isToday(o.created_at));
  const emPreparo = orders.filter((o) => o.status === "em_preparo");
  const prontos = orders.filter((o) => o.status === "pronto");
  const entregas = orders.filter((o) => o.type === "entrega" && o.status !== "concluido" && o.status !== "cancelado");
  const mesasOcupadas = new Set(orders.filter((o) => o.type === "mesa" && o.status !== "concluido").map((o) => o.table_id)).size;

  const faturamentoCaixa = sessionOrders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders].reverse().slice(0, 8);

  const histFaturamento = (histOrders ?? []).reduce((sum, o) => sum + o.total, 0);
  const histLabel = histDate
    ? new Date(`${histDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  const caixaIsOpen = !!caixa;
  const caixaLoaded = caixa !== undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Visão geral do estabelecimento</p>

      {/* ── Caixa banner ── */}
      {caixaLoaded && (
        <div className={`mt-4 rounded-xl border p-4 ${caixaIsOpen ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
          {caixaIsOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-semibold text-green-500">Caixa Aberto</p>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Aberto em {formatDateTime(caixa!.opened_at)} · {sessionOrders.length} pedido(s) · {formatCurrency(faturamentoCaixa)}
                </p>
              </div>
              <button
                onClick={fecharCaixa}
                disabled={caixaLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {caixaLoading ? "Fechando..." : "Fechar Caixa"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-yellow-500">Caixa Fechado</p>
                <p className="mt-0.5 text-xs text-muted">Abra o caixa para começar a registrar o faturamento do dia.</p>
              </div>
              <button
                onClick={abrirCaixa}
                disabled={caixaLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {caixaLoading ? "Abrindo..." : "Abrir Caixa"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Close summary ── */}
      {showCloseSummary && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Caixa fechado com sucesso</p>
            <p className="text-xs text-muted">{showCloseSummary.pedidos} pedidos · Faturamento: {formatCurrency(showCloseSummary.faturamento)}</p>
          </div>
          <button onClick={() => setShowCloseSummary(null)} className="text-xs text-muted hover:text-foreground">✕</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pedidos no Caixa" value={caixaIsOpen ? sessionOrders.length : "-"} />
        <StatCard label="Em Preparo" value={emPreparo.length} />
        <StatCard label="Prontos" value={prontos.length} />
        <StatCard label="Entregas" value={entregas.length} />
        <StatCard label="Mesas Ocupadas" value={mesasOcupadas} />
        <StatCard label="Faturamento Caixa" value={caixaIsOpen ? formatCurrency(faturamentoCaixa) : "-"} />
      </div>

      {/* history date picker */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 flex-wrap">
        <span className="text-sm font-medium text-foreground shrink-0">📅 Ver faturamento de outro dia:</span>
        <input
          type="date"
          max={todayStr()}
          value={histDate}
          onChange={(e) => { setHistDate(e.target.value); setHistOrders(null); }}
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
          <button onClick={() => { setHistDate(""); setHistOrders(null); }} className="text-xs text-muted hover:text-foreground">
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
              <p className="text-xs text-muted">{histOrders.length} pedido(s)</p>
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
          {histOrders.length === 0 && <p className="mt-3 text-sm text-muted">Nenhum pedido neste dia.</p>}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-foreground">Atividade Recente</h2>
          <div className="mt-3 space-y-3">
            {loading && <p className="text-sm text-muted">Carregando...</p>}
            {!loading && recentOrders.length === 0 && <p className="text-sm text-muted">Nenhum pedido ainda.</p>}
            {recentOrders.map((order) => (
              <div key={order.id} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="cursor-pointer">
                <OrderCard order={order}>
                  {expandedOrderId === order.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); printOrder(order); }}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border"
                    >
                      🖨️ Reimprimir pedido
                    </button>
                  )}
                </OrderCard>
              </div>
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
