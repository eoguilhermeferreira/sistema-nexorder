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
  const { company, categories, products, flavors, addons } = storefront;
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
      await supabase.from("tables_restaurant").update({ status: "ocupada" }).eq("id", tableId);
      setCustomer(created as unknown as TableCustomer);
      window.localStorage.setItem(`comanda:${company.id}:mesa:${numero}`, created.id);
    }
  }

  async function sendOrder() {
    if (!company || !tableId || !customer || items.length === 0) return;
    setSending(true);
    const supabase = createClient();
    const orderCode = Math.floor(1000 + Math.random() * 9000).toString();

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
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 className="text-xl font-bold text-foreground">Mesa {numero}</h1>
        <p className="text-sm text-muted">
          Comanda de {customer.name} — total já consumido: {formatCurrency(customer.subtotal ?? 0)}
        </p>

        <div className="mt-6">
          <MenuBrowser categories={categories} products={products} flavors={flavors} addons={addons} />
        </div>
      </div>

      {sent && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          Pedido enviado para a cozinha!
        </div>
      )}

      {items.length > 0 && (
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
