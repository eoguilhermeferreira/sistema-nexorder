"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStorefront } from "@/lib/hooks/useStorefront";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { MenuBrowser } from "@/components/storefront/MenuBrowser";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";

export default function CardapioPage() {
  const { slug } = useParams<{ slug: string }>();
  const storefront = useStorefront(slug);

  if (storefront.loading) {
    return <p className="p-8 text-sm text-muted">Carregando cardápio...</p>;
  }
  if (storefront.notFound || !storefront.company) {
    return <p className="p-8 text-sm text-muted">Estabelecimento não encontrado.</p>;
  }

  return (
    <CartProvider storageKey={`cart:${storefront.company.id}`}>
      <CardapioContent storefront={storefront} />
    </CartProvider>
  );
}

function CardapioContent({ storefront }: { storefront: ReturnType<typeof useStorefront> }) {
  const { company, categories, products, flavors, addons, borders } = storefront;
  const [showCheckout, setShowCheckout] = useState(false);
  const { items, total } = useCart();

  if (!company) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="h-40 w-full bg-card-hover"
        style={company.banner_url ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-10 flex items-end gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-20 w-20 rounded-2xl border-4 border-background bg-card object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-2xl border-4 border-background bg-card" />
          )}
          <div className="pb-1">
            <h1 className="text-xl font-bold text-foreground">{company.fantasy_name ?? company.name}</h1>
            <p className="text-xs text-muted">{company.is_open ? "Aberto agora" : "Fechado"}</p>
          </div>
        </div>
        {company.description && <p className="mt-3 text-sm text-muted">{company.description}</p>}

        <div className="mt-6">
          <MenuBrowser categories={categories} products={products} flavors={flavors} addons={addons} borders={borders} />
        </div>
      </div>

      {items.length > 0 && (
        <button
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-xl bg-wine px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-wine-hover"
        >
          <span>{items.length} item(ns)</span>
          <span>Ver carrinho — {formatCurrency(total)}</span>
        </button>
      )}

      {showCheckout && <CheckoutModal storefront={storefront} onClose={() => setShowCheckout(false)} />}
    </div>
  );
}

function CheckoutModal({ storefront, onClose }: { storefront: ReturnType<typeof useStorefront>; onClose: () => void }) {
  const { company, settings } = storefront;
  const { items, total, removeItem, clear } = useCart();
  const router = useRouter();

  const [type, setType] = useState<"entrega" | "retirada">("entrega");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const paymentMethods = (settings?.payment_methods as unknown as string[]) ?? ["dinheiro", "pix"];
  const paymentLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
  };

  async function submit() {
    if (!company) return;
    if (!name.trim() || items.length === 0 || !paymentMethod) {
      setError("Preencha seu nome, escolha um pagamento e adicione itens ao carrinho.");
      return;
    }
    if (type === "entrega" && (!street.trim() || !number.trim() || !neighborhood.trim())) {
      setError("Preencha o endereço de entrega.");
      return;
    }

    setSubmitting(true);
    setError("");
    const supabase = createClient();
    const orderCode = Math.floor(1000 + Math.random() * 9000).toString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        company_id: company.id,
        order_code: orderCode,
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        type,
        status: "aguardando_aceite",
        payment_method: paymentMethod,
        change_for: paymentMethod === "dinheiro" && changeFor ? Number(changeFor) : null,
        total,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError("Não foi possível enviar o pedido. Tente novamente.");
      setSubmitting(false);
      return;
    }

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
        additions: item.additions,
        removed_ingredients: item.removed_ingredients,
        notes: item.notes,
        price: item.price,
      }))
    );

    if (type === "entrega") {
      await supabase.from("addresses").insert({
        order_id: order.id,
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim(),
        reference: reference.trim() || null,
        city: company.city,
        state: company.state,
      });
    }

    clear();
    router.push(`/cardapio/${company.slug}/pedido/${order.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Finalizar pedido</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-card-hover px-3 py-2 text-sm">
              <div>
                <p className="text-foreground">{item.quantity}x {item.product_name}{item.size_name ? ` (${item.size_name})` : ""}</p>
                {item.flavors && <p className="text-xs text-muted">{item.flavors.map((f) => f.name).join(", ")}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">{formatCurrency(item.price * item.quantity)}</span>
                <button onClick={() => removeItem(item.id)} className="text-xs text-red-400">remover</button>
              </div>
            </div>
          ))}
          <p className="text-right text-sm font-semibold text-foreground">Total: {formatCurrency(total)}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => setType("entrega")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${type === "entrega" ? "bg-wine text-white" : "bg-card-hover text-muted"}`}>
            Entrega
          </button>
          <button onClick={() => setType("retirada")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${type === "retirada" ? "bg-wine text-white" : "bg-card-hover text-muted"}`}>
            Retirada
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone / WhatsApp" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />

          {type === "entrega" && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
              <div className="flex gap-2">
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" className="w-1/2 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento" className="w-1/2 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
              </div>
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ponto de referência" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground">Forma de pagamento</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${paymentMethod === method ? "border-wine bg-wine/20 text-foreground" : "border-border bg-card-hover text-muted"}`}
                >
                  {paymentLabels[method] ?? method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "dinheiro" && settings?.ask_change_for_cash && (
            <input
              value={changeFor}
              onChange={(e) => setChangeFor(e.target.value)}
              type="number"
              placeholder="Troco para quanto?"
              className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            />
          )}

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações do pedido" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-wine px-4 py-3 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
