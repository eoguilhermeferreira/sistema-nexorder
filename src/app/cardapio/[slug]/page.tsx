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

const LIGHT_THEME = {
  "--background": "#ffffff",
  "--foreground": "#111111",
  "--nexorder-card": "#f3f3f5",
  "--nexorder-card-hover": "#e8e8ec",
  "--nexorder-border": "#d1d1d6",
  "--nexorder-text-muted": "#555555",
  "--color-background": "#ffffff",
  "--color-foreground": "#111111",
  "--color-card": "#f3f3f5",
  "--color-card-hover": "#e8e8ec",
  "--color-border": "#d1d1d6",
  "--color-muted": "#555555",
};

function CardapioContent({ storefront }: { storefront: ReturnType<typeof useStorefront> }) {
  const { company, categories, products, flavors, addons, flavorSizePrices, addonSizePrices, prepTimes } = storefront;
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cardapio-theme") === "light";
  });
  const { items, total } = useCart();

  if (!company) return null;

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    localStorage.setItem("cardapio-theme", next ? "light" : "dark");
  };

  const themeVars = isLight
    ? Object.entries(LIGHT_THEME).map(([k, v]) => `${k}:${v}`).join(";")
    : "";

  return (
    <>
      {themeVars && <style>{`#cardapio-root{${themeVars}}`}</style>}
    <div id="cardapio-root" className="min-h-screen bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
        <div className="-mt-6 flex items-end gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className={`h-20 w-20 shrink-0 border-4 border-background bg-card object-cover shadow-md ${company.logo_shape === "round" ? "rounded-full" : "rounded-2xl"}`}
            />
          ) : (
            <div className={`h-20 w-20 shrink-0 border-4 border-background bg-card shadow-md ${company.logo_shape === "round" ? "rounded-full" : "rounded-2xl"}`} />
          )}
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-foreground leading-tight">
              {company.fantasy_name ?? company.name}
            </h1>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${company.is_open ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
              {company.is_open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border border-border text-foreground text-sm"
            title={isLight ? "Modo escuro" : "Modo claro"}
          >
            {isLight ? "🌙" : "☀️"}
          </button>
        </div>
        {company.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{company.description}</p>
        )}

        {company.business_hours_text && (
          <div className="mt-2 flex items-start gap-2">
            <span className="shrink-0 text-xs font-semibold text-foreground">Horário de Funcionamento</span>
            <div className="text-xs text-muted leading-5">
              {company.business_hours_text.split("|").map((line, i) => (
                <p key={i}>{line.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* redes sociais */}
        {(company.instagram || company.facebook || company.website) && (
          <div className="mt-3 flex items-center gap-2">
            {company.instagram && (
              <a
                href={company.instagram.startsWith("http") ? company.instagram : `https://instagram.com/${company.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors"
                title="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)"/>
                  <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
                </svg>
              </a>
            )}
            {company.facebook && (
              <a
                href={company.facebook.startsWith("http") ? company.facebook : `https://facebook.com/${company.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1877F2] border border-[#1877F2] hover:opacity-90 transition-opacity"
                title="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              </a>
            )}
            {company.website && (
              <a
                href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors text-foreground"
                title="Website"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {/* tempos de preparo — todos na mesma linha */}
        {prepTimes && (prepTimes.delivery_minutes > 0 || prepTimes.pickup_minutes > 0 || prepTimes.table_minutes > 0) && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {prepTimes.delivery_minutes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">
                🛵 Entrega {prepTimes.delivery_minutes} min
              </span>
            )}
            {prepTimes.pickup_minutes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">
                🏃 Retirada {prepTimes.pickup_minutes} min
              </span>
            )}
            {prepTimes.table_minutes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs text-muted whitespace-nowrap">
                🍽️ Mesa {prepTimes.table_minutes} min
              </span>
            )}
          </div>
        )}
      </div>

      {/* menu */}
      <div className="mt-4 px-4 pb-32">
        <MenuBrowser categories={categories} products={products} flavors={flavors} addons={addons} flavorSizePrices={flavorSizePrices} addonSizePrices={addonSizePrices} />
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
    </>
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
  const deliveryFee = type === "entrega" ? (company?.delivery_fee ?? 0) : 0;
  const grandTotal = total + deliveryFee;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [needsChange, setNeedsChange] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const paymentMethods = (settings?.payment_methods as unknown as string[]) ?? ["dinheiro", "pix", "cartao_credito", "cartao_debito"];
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
    const { data: codeData } = await (supabase as any).rpc("next_order_code", { p_company_id: company.id, p_order_type: type });
    const orderCode = (codeData as string) ?? "0001";

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
        change_for: paymentMethod === "dinheiro" && needsChange && changeFor ? Number(changeFor) : null,
        total: grandTotal,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError("Não foi possível enviar o pedido. Tente novamente.");
      setSubmitting(false);
      return;
    }

    const { error: itemsError } = await (supabase as any).from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_name: item.product_name,
        category_name: item.category_name,
        quantity: item.quantity,
        size_name: item.size_name,
        flavors: item.flavors ?? [],
        border_name: item.border_name,
        border_price: item.border_price,
        additions: item.additions ?? [],
        removed_ingredients: item.removed_ingredients ?? [],
        notes: item.notes,
        price: item.price,
      }))
    );

    if (itemsError) {
      setError("Erro ao salvar itens do pedido. Tente novamente.");
      setSubmitting(false);
      return;
    }

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
                  {item.flavors && item.flavors.length > 0 ? (
                    // show each flavor with its own addons below it
                    <div className="mt-0.5 space-y-0.5">
                      {item.flavors.map((f) => {
                        const flavorAddons = (item.additions ?? []).filter((a) => a.flavor_name === f.name);
                        return (
                          <div key={f.flavor_id}>
                            <p className="text-xs text-muted">
                              • {f.name}
                              {flavorAddons.length > 0 && (
                                <span className="ml-1">
                                  ({flavorAddons.map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name)).join(", ")})
                                </span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : item.additions && item.additions.length > 0 ? (
                    <p className="text-xs text-muted mt-0.5">
                      + {item.additions.map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name)).join(", ")}
                    </p>
                  ) : null}
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
            {deliveryFee > 0 && (
              <div className="flex justify-between rounded-xl bg-card px-4 py-2">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-sm text-muted">{formatCurrency(total)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between rounded-xl bg-card px-4 py-2">
                <span className="text-sm text-muted">🛵 Taxa de entrega</span>
                <span className="text-sm text-wine">+{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between rounded-xl bg-card px-4 py-3">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold text-wine">{formatCurrency(grandTotal)}</span>
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

            {paymentMethod === "dinheiro" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Precisa de troco?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setNeedsChange(false); setChangeFor(""); }}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors ${!needsChange ? "bg-wine text-white" : "bg-card text-muted"}`}
                  >
                    Não, obrigado
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedsChange(true)}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors ${needsChange ? "bg-wine text-white" : "bg-card text-muted"}`}
                  >
                    Sim, preciso
                  </button>
                </div>
                {needsChange && (
                  <input
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    type="number"
                    inputMode="decimal"
                    placeholder="Troco para quanto? (R$)"
                    className={inputCls}
                  />
                )}
              </div>
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
            {submitting ? "Enviando..." : `Confirmar pedido · ${formatCurrency(grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
