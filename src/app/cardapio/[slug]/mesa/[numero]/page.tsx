"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useStorefront } from "@/lib/hooks/useStorefront";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { MenuBrowser } from "@/components/storefront/MenuBrowser";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { TableCustomer } from "@/types/domain";

export default function MesaCardapioPage() {
  const { slug, numero } = useParams<{ slug: string; numero: string }>();
  const storefront = useStorefront(slug);

  if (storefront.loading) {
    return <p className="p-8 text-sm text-muted">Carregando cardápio...</p>;
  }
  if (storefront.notFound || !storefront.company) {
    return <p className="p-8 text-sm text-muted">Estabelecimento não encontrado.</p>;
  }

  return (
    <CartProvider storageKey={`cart:${storefront.company.id}:mesa:${numero}`}>
      <MesaContent storefront={storefront} numero={numero} />
    </CartProvider>
  );
}

function MesaContent({ storefront, numero }: { storefront: ReturnType<typeof useStorefront>; numero: string }) {
  const { company, categories, products, flavors, addons, flavorSizePrices, addonSizePrices, prepTimes } = storefront;
  const { items, total, clear } = useCart();

  const [tableId, setTableId] = useState<string | null>(null);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [customer, setCustomer] = useState<TableCustomer | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [loadingTable, setLoadingTable] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!company) return;
    const storageKey = `comanda:${company.id}:mesa:${numero}`;

    async function load() {
      const supabase = createClient();
      const { data: table } = await supabase
        .from("tables_restaurant")
        .select("id")
        .eq("company_id", company!.id)
        .eq("number", Number(numero))
        .single();

      if (!table) {
        setTableNotFound(true);
        setLoadingTable(false);
        return;
      }
      setTableId(table.id);

      const savedCustomerId = window.localStorage.getItem(storageKey);
      if (savedCustomerId) {
        const { data: existing } = await supabase.from("table_customers").select("*").eq("id", savedCustomerId).single();
        if (existing) {
          setCustomer(existing as unknown as TableCustomer);
        }
      }
      setLoadingTable(false);
    }
    load();
  }, [company, numero]);

  async function joinTable() {
    if (!company || !tableId || !nameInput.trim()) return;
    const supabase = createClient();
    const { data: created } = await supabase
      .from("table_customers")
      .insert({ table_id: tableId, name: nameInput.trim() })
      .select()
      .single();
    if (created) {
      setCustomer(created as unknown as TableCustomer);
      window.localStorage.setItem(`comanda:${company.id}:mesa:${numero}`, created.id);
    }
  }

  async function sendOrder() {
    if (!company || !tableId || !customer || items.length === 0) return;
    if (!company.is_open) return;
    setSending(true);
    const supabase = createClient();
    const { data: codeData } = await (supabase as any).rpc("next_order_code", { p_company_id: company.id, p_order_type: "mesa" });
    const orderCode = (codeData as string) ?? "0001";

    const { data: order } = await supabase
      .from("orders")
      .insert({
        company_id: company.id,
        order_code: orderCode,
        customer_name: customer.name,
        type: "mesa",
        table_id: tableId,
        table_customer_id: customer.id,
        status: "aguardando_aceite",
        total,
      })
      .select()
      .single();

    if (order) {
      await supabase.from("tables_restaurant").update({ status: "ocupada" }).eq("id", tableId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          product_name: item.product_name,
          quantity: item.quantity,
          size_id: item.size_id,
          size_name: item.size_name,
          flavors: item.flavors as unknown as import("@/types/database").Json,
          border_id: item.border_id,
          border_name: item.border_name,
          border_price: item.border_price,
          additions: item.additions as unknown as import("@/types/database").Json,
          removed_ingredients: item.removed_ingredients,
          notes: item.notes,
          price: item.price,
        })) as any
      );

      await supabase
        .from("table_customers")
        .update({ subtotal: (customer.subtotal ?? 0) + total })
        .eq("id", customer.id);

      setCustomer({ ...customer, subtotal: (customer.subtotal ?? 0) + total });
    }

    clear();
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  if (loadingTable) return <p className="p-8 text-sm text-muted">Carregando mesa...</p>;
  if (tableNotFound || !company) return <p className="p-8 text-sm text-muted">Mesa não encontrada.</p>;

  if (!customer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-xs text-center">
          {/* Restaurant name + welcome */}
          <p className="text-lg font-bold text-foreground">{company?.name}</p>
          <p className="mt-1 text-sm text-muted">Seja bem-vindo(a)! 🎉</p>

          {/* Table confirmation */}
          <div className="my-8 rounded-2xl border-2 border-wine bg-wine/5 px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-wine">Você está na</p>
            <p className="mt-1 text-7xl font-black text-foreground leading-none">{numero}</p>
            <p className="mt-1 text-sm font-medium text-muted">Mesa {numero}</p>
          </div>

          <p className="text-sm text-muted mb-4">Informe seu nome para abrir sua comanda.</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinTable()}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-border bg-card-hover px-3 py-2.5 text-sm text-foreground"
          />
          <button onClick={joinTable} disabled={!nameInput.trim()} className="mt-3 w-full rounded-lg bg-wine px-4 py-3 text-sm font-semibold text-white hover:bg-wine-hover disabled:opacity-40">
            Entrar na mesa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* banner */}
      <div
        className="h-36 w-full bg-card-hover"
        style={
          company?.banner_url
            ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      {/* header */}
      <div className="px-4">
        <div className="-mt-6 flex items-end gap-3">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className={`h-20 w-20 shrink-0 border-4 border-background bg-card object-cover shadow-md ${company.logo_shape === "round" ? "rounded-full" : "rounded-2xl"}`}
            />
          ) : (
            <div className="h-20 w-20 shrink-0 border-4 border-background bg-card shadow-md rounded-2xl" />
          )}
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-foreground leading-tight">
              {company?.fantasy_name ?? company?.name}
            </h1>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${company.is_open ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
              {company.is_open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
        </div>
        {company?.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{company.description}</p>
        )}

        {company?.business_hours_text && (
          <div className="mt-2 flex items-start gap-2">
            <span className="shrink-0 text-xs font-semibold text-foreground">Horário de Funcionamento</span>
            <div className="text-xs text-muted leading-5">
              {company.business_hours_text.split("|").map((line, i) => (
                <p key={i}>{line.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {(company?.instagram || company?.facebook || company?.website) && (
          <div className="mt-3 flex items-center gap-2">
            {company?.instagram && (
              <a href={company.instagram.startsWith("http") ? company.instagram : `https://instagram.com/${company.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <defs><radialGradient id="ig-grad2" cx="30%" cy="107%" r="130%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad2)"/>
                  <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
                </svg>
              </a>
            )}
            {company?.facebook && (
              <a href={company.facebook.startsWith("http") ? company.facebook : `https://facebook.com/${company.facebook}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1877F2] border border-[#1877F2] hover:opacity-90 transition-opacity" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
            )}
            {company?.website && (
              <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors text-foreground" title="Website">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            )}
          </div>
        )}

        {prepTimes && (prepTimes.delivery_minutes > 0 || prepTimes.pickup_minutes > 0 || prepTimes.table_minutes > 0) && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {prepTimes.delivery_minutes > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">🛵 Entrega {prepTimes.delivery_minutes} min</span>}
            {prepTimes.pickup_minutes > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">🏃 Retirada {prepTimes.pickup_minutes} min</span>}
            {prepTimes.table_minutes > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">🍽️ Mesa {prepTimes.table_minutes} min</span>}
          </div>
        )}

        {/* mesa info bar */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-wine/30 bg-wine/5 px-4 py-2.5">
          <span className="text-sm font-semibold text-wine">Mesa {numero}</span>
          <span className="text-muted">·</span>
          <span className="text-sm text-muted">{customer.name}</span>
          {(customer.subtotal ?? 0) > 0 && (
            <>
              <span className="text-muted">·</span>
              <span className="text-sm text-muted">Consumido: {formatCurrency(customer.subtotal ?? 0)}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 px-4 pb-32">
        <MenuBrowser
          categories={categories}
          products={products}
          flavors={flavors}
          addons={addons}
          flavorSizePrices={flavorSizePrices}
          addonSizePrices={addonSizePrices}
        />
      </div>

      {sent && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          Pedido enviado para a cozinha!
        </div>
      )}

      {!company.is_open && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-3 shadow-lg text-center">
          <p className="text-sm font-semibold text-white">🔒 Estamos fechados no momento</p>
        </div>
      )}

      {items.length > 0 && company.is_open && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-card p-3 shadow-lg">
          <p className="text-sm text-muted">{items.length} item(ns) — {formatCurrency(total)}</p>
          <button
            onClick={sendOrder}
            disabled={sending}
            className="mt-2 w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar pedido para a cozinha"}
          </button>
        </div>
      )}
    </div>
  );
}
