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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Carregando cardápio...</p>
      </div>
    );
  }
  if (storefront.notFound || !storefront.company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Estabelecimento não encontrado.</p>
      </div>
    );
  }

  return (
    <CartProvider storageKey={`cart:${storefront.company.id}`}>
      <CardapioContent storefront={storefront} />
    </CartProvider>
  );
}

function CardapioContent({ storefront }: { storefront: ReturnType<typeof useStorefront> }) {
  const { company, categories, products, flavors, addons } = storefront;
  const [showCheckout, setShowCheckout] = useState(false);
  const { items, total } = useCart();

  if (!company) return null;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* banner */}
      <div
        className="h-36 w-full bg-card-hover"
        style={
          company.banner_url
            ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      {/* header */}
      <div className="px-4">
        <div className="-mt-10 flex items-end gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-20 w-20 shrink-0 rounded-2xl border-4 border-background bg-card object-cover shadow-md"
            />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-2xl border-4 border-background bg-card shadow-md" />
          )}
          <div className="pb-1 min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground leading-tight">
              {company.fantasy_name ?? company.name}
            </h1>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${company.is_open ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
              {company.is_open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
        </div>
        {company.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{company.description}</p>
        )}
      </div>

      {/* menu */}
      <div className="mt-4 px-4 pb-32">
        <MenuBrowser categories={categories} products={products} flavors={flavors} addons={addons} />
      </div>

      {/* sticky cart button */}
      {items.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-background to-transparent"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => setShowCheckout(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-wine px-5 py-4 text-white shadow-xl active:scale-[0.98] transition-transform"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {items.length}
            </span>
            <span className="text-sm font-semibold">Ver carrinho</span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal storefront={storefront} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}

function CheckoutModal({
  storefront,
  onClose,
}: {
  storefront: ReturnType<typeof useStorefront>;
  onClose: () => void;
}) {
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
      setError("Preencha seu nome, escolha um pagamento e adicione itens.");
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

  const inputCls =
    "w-full rounded-xl border border-border bg-card-hover px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine";

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={onClose}>
      {/* sheet */}
      <div
        className="flex max-h-[92dvh] flex-col rounded-t-3xl bg-background"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-lg font-bold text-foreground">Finalizar pedido</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card-hover text-muted"
          >
            ✕
          </button>
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* items summary */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-xl bg-card px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  {item.category_name && (
                    <p className="text-xs text-muted">{item.category_name}</p>
                  )}
                  <p className="text-sm font-semibold text-foreground">
                    {item.quantity}x {item.product_name}
                    {item.size_name ? ` (${item.size_name})` : ""}
                  </p>
                  {item.flavors && item.flavors.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">{item.flavors.map((f) => f.name).join(", ")}</p>
                  )}
                  {item.additions && item.additions.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">
                      + {item.additions.map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name)).join(", ")}
                    </p>
                  )}
                  {item.notes && <p className="text-xs italic text-muted mt-0.5">{item.notes}</p>}
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="mt-1 text-xs text-red-400 active:text-red-300"
                  >
                    remover
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between rounded-xl bg-card px-4 py-3">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold text-wine">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* type */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("entrega")}
              className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                type === "entrega" ? "bg-wine text-white" : "bg-card text-muted"
              }`}
            >
              🛵 Entrega
            </button>
            <button
              onClick={() => setType("retirada")}
              className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                type === "retirada" ? "bg-wine text-white" : "bg-card text-muted"
              }`}
            >
              🏃 Retirada
            </button>
          </div>

          {/* fields */}
          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className={inputCls}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp / Telefone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              className={inputCls}
            />

            {type === "entrega" && (
              <div className="space-y-3 rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Endereço de entrega</p>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua / Avenida"
                  autoComplete="street-address"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Número"
                    inputMode="numeric"
                    className={inputCls}
                  />
                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Complemento"
                    className={inputCls}
                  />
                </div>
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className={inputCls}
                />
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ponto de referência (opcional)"
                  className={inputCls}
                />
              </div>
            )}

            {/* payment */}
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Forma de pagamento</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? "border-wine bg-wine text-white"
                        : "border-border bg-card text-muted"
                    }`}
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
                inputMode="decimal"
                placeholder="Troco para quanto?"
                className={inputCls}
              />
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações gerais do pedido..."
              className={inputCls}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-5 w-full rounded-2xl bg-wine py-4 text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? "Enviando..." : `Confirmar pedido · ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
