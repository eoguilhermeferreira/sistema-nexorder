"use client";

import { useMemo, useRef, useState } from "react";
import type { Product, Flavor, Addon, AddonSelection, AddonSizePrice } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupAddons(addons: Addon[]): { group: string | null; items: Addon[] }[] {
  const map = new Map<string | null, Addon[]>();
  for (const a of addons) {
    const key = a.group ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  // ungrouped first, then alphabetical groups
  const result: { group: string | null; items: Addon[] }[] = [];
  if (map.has(null)) result.push({ group: null, items: map.get(null)! });
  for (const [g, items] of map) {
    if (g !== null) result.push({ group: g, items });
  }
  return result;
}

// ─── section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, required }: { title: string; subtitle?: string; required?: boolean }) {
  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {required && (
          <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs font-medium text-wine">Obrigatório</span>
        )}
      </div>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

// ─── flavor card ───────────────────────────────────────────────────────────────

function FlavorCard({
  flavor,
  selected,
  disabled,
  onToggle,
  expanded,
  onExpandToggle,
  removedIngredients,
  onToggleIngredient,
}: {
  flavor: Flavor;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpandToggle: () => void;
  removedIngredients: string[];
  onToggleIngredient: (name: string) => void;
}) {
  const ingredients = flavor.ingredients ?? [];
  const removable = ingredients.filter((i) => i.removable);

  return (
    <div className={`border-b border-border last:border-0 ${disabled && !selected ? "opacity-40" : ""}`}>
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={selected ? onExpandToggle : disabled ? undefined : onToggle}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled || selected) onToggle(); }}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selected ? "border-wine bg-wine" : "border-border bg-transparent"
            }`}
          >
            {selected && <span className="block h-2 w-2 rounded-full bg-white" />}
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">{flavor.name}</p>
            {ingredients.length > 0 && (
              <p className="text-xs text-muted line-clamp-1">
                {ingredients.map((i) => i.name).join(", ")}
              </p>
            )}
          </div>
        </div>
        {selected && removable.length > 0 && (
          <span className="ml-2 shrink-0 text-xs text-wine">{expanded ? "▲" : "▼"} personalizar</span>
        )}
      </div>

      {selected && expanded && removable.length > 0 && (
        <div className="bg-card-hover px-4 pb-3">
          <p className="mb-2 text-xs font-medium text-muted">Remover ingredientes:</p>
          <div className="flex flex-wrap gap-2">
            {removable.map((ing) => (
              <button
                key={ing.name}
                type="button"
                onClick={() => onToggleIngredient(ing.name)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  removedIngredients.includes(ing.name)
                    ? "border-wine bg-wine/20 text-wine line-through"
                    : "border-border bg-card text-muted"
                }`}
              >
                {ing.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── addon row ─────────────────────────────────────────────────────────────────

function AddonRow({
  addon, qty, onInc, onDec, sizePrice, mode, onModeChange,
}: {
  addon: Addon;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  sizePrice?: { price_half: number; price_whole: number } | null;
  mode: "half" | "whole";
  onModeChange: (m: "half" | "whole") => void;
}) {
  const displayPrice = sizePrice
    ? (mode === "half" ? sizePrice.price_half : sizePrice.price_whole)
    : addon.price;

  return (
    <div className="border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{addon.name}</p>
          {displayPrice > 0 && <p className="text-xs text-wine">+{formatCurrency(displayPrice)}</p>}
        </div>
        <div className="flex items-center gap-3">
          {qty > 0 && (
            <button type="button" onClick={onDec} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-card-hover">−</button>
          )}
          {qty > 0 && <span className="w-4 text-center text-sm font-medium text-foreground">{qty}</span>}
          <button type="button" onClick={onInc} className="flex h-7 w-7 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine hover:bg-wine/20">+</button>
        </div>
      </div>
      {sizePrice && qty > 0 && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onModeChange("half")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${mode === "half" ? "bg-wine text-white" : "bg-card-hover text-muted"}`}
          >
            Metade
          </button>
          <button
            type="button"
            onClick={() => onModeChange("whole")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${mode === "whole" ? "bg-wine text-white" : "bg-card-hover text-muted"}`}
          >
            Inteira
          </button>
        </div>
      )}
    </div>
  );
}

// ─── bundle configurator ───────────────────────────────────────────────────────

function BundleConfigurator({
  product,
  categoryName,
  flavors,
  onClose,
}: {
  product: Product;
  categoryName?: string;
  flavors: Flavor[];
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const pizzaCount = product.bundle_pizza_count ?? 2;
  const maxFlavorsPerPizza = product.bundle_max_flavors ?? 2;
  const totalFlavors = pizzaCount * maxFlavorsPerPizza;

  // flavors for this bundle (from bundle_flavor_category_id)
  const bundleFlavors = useMemo(
    () => flavors.filter((f) => f.category_id === product.bundle_flavor_category_id),
    [flavors, product.bundle_flavor_category_id]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const canConfirm = selectedIds.length > 0;

  function toggleFlavor(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      if (prev.length >= totalFlavors) return prev;
      return [...prev, id];
    });
  }

  // Build pizza assignment label for a flavor index
  function pizzaLabel(index: number): string {
    const pi = Math.floor(index / maxFlavorsPerPizza);
    return `Pizza ${pi + 1}`;
  }

  function confirm() {
    const allFlavors: import("@/types/domain").OrderItemFlavor[] = selectedIds.map((fid, idx) => {
      const f = bundleFlavors.find((x) => x.id === fid)!;
      return { flavor_id: f.id, name: f.name, pizza_index: Math.floor(idx / maxFlavorsPerPizza) };
    });
    addItem({
      product_name: product.name,
      category_name: categoryName ?? null,
      quantity,
      size_id: null,
      size_name: null,
      flavors: allFlavors,
      border_id: null,
      border_name: null,
      border_price: null,
      additions: null,
      removed_ingredients: null,
      notes: null,
      price: product.base_price,
    });
    onClose();
  }

  // Build the ordering rule hint text
  const hints: string[] = [];
  for (let pi = 0; pi < pizzaCount; pi++) {
    const start = pi * maxFlavorsPerPizza + 1;
    const end = (pi + 1) * maxFlavorsPerPizza;
    const range = start === end ? `${start}º sabor` : `${start}º ao ${end}º sabor`;
    hints.push(`${range} → Pizza ${pi + 1}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-background sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border bg-card px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{product.name}</h2>
            {product.description && <p className="mt-0.5 text-sm text-muted">{product.description}</p>}
          </div>
          <button onClick={onClose} className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-hover text-muted">✕</button>
        </div>

        {/* ordering rule hint */}
        <div className="shrink-0 border-b border-border bg-wine/5 px-4 py-3">
          <p className="text-xs font-semibold text-wine mb-1">Escolha na ordem os sabores das pizzas:</p>
          <div className="flex flex-wrap gap-2">
            {hints.map((h) => (
              <span key={h} className="rounded-full border border-wine/30 bg-card px-2.5 py-1 text-xs text-muted">{h}</span>
            ))}
          </div>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <SectionHeader
            title="Escolha os sabores"
            subtitle={`${selectedIds.length} de ${totalFlavors} selecionado(s)`}
            required
          />

          {/* selected slots visual */}
          {selectedIds.length > 0 && (
            <div className="border-b border-border bg-card-hover px-4 py-3">
              <div className="space-y-1">
                {Array.from({ length: pizzaCount }).map((_, pi) => {
                  const slotStart = pi * maxFlavorsPerPizza;
                  const slotEnd = slotStart + maxFlavorsPerPizza;
                  const pizzaFlavors = selectedIds.slice(slotStart, slotEnd).map(
                    (id) => bundleFlavors.find((f) => f.id === id)?.name ?? ""
                  );
                  if (pizzaFlavors.length === 0) return null;
                  return (
                    <p key={pi} className="text-xs text-foreground">
                      <span className="font-semibold text-wine">Pizza {pi + 1}:</span>{" "}
                      {pizzaFlavors.join(" + ")}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {bundleFlavors.map((flavor, idx) => {
            const isSelected = selectedIds.includes(flavor.id);
            const selIdx = selectedIds.indexOf(flavor.id);
            const isDisabled = !isSelected && selectedIds.length >= totalFlavors;
            return (
              <div
                key={flavor.id}
                className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-0 ${isDisabled ? "opacity-40" : ""} ${isSelected ? "bg-wine/5" : "hover:bg-card-hover"}`}
                onClick={() => !isDisabled && toggleFlavor(flavor.id)}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-wine bg-wine" : "border-border"}`}>
                  {isSelected && <span className="text-[10px] font-bold text-white">{selIdx + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{flavor.name}</p>
                    {isSelected && (
                      <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs font-medium text-wine">
                        {pizzaLabel(selIdx)}
                      </span>
                    )}
                  </div>
                  {(flavor.ingredients ?? []).length > 0 && (
                    <p className="mt-0.5 text-xs text-muted line-clamp-1">
                      {flavor.ingredients.map((i) => i.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* sticky footer */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card-hover text-foreground hover:bg-border">−</button>
              <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine hover:bg-wine/20">+</button>
            </div>
            <button
              onClick={confirm}
              disabled={!canConfirm}
              className="flex-1 rounded-xl bg-wine px-4 py-2.5 text-sm font-semibold text-white hover:bg-wine-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Adicionar · {formatCurrency(product.base_price * quantity)}
            </button>
          </div>
          {!canConfirm && (
            <p className="mt-2 text-center text-xs text-muted">Selecione pelo menos um sabor para continuar</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export function ProductConfigurator({
  product,
  categoryName,
  flavors,
  addons,
  addonSizePrices = [],
  onClose,
}: {
  product: Product;
  categoryName?: string;
  flavors: Flavor[];
  addons: Addon[];
  addonSizePrices?: AddonSizePrice[];
  onClose: () => void;
}) {
  const isBundle = !!product.bundle_flavor_category_id;

  if (isBundle) {
    return (
      <BundleConfigurator
        product={product}
        categoryName={categoryName}
        flavors={flavors}
        onClose={onClose}
      />
    );
  }

  return (
    <RegularConfigurator
      product={product}
      categoryName={categoryName}
      flavors={flavors}
      addons={addons}
      addonSizePrices={addonSizePrices}
      onClose={onClose}
    />
  );
}

function RegularConfigurator({
  product,
  categoryName,
  flavors,
  addons,
  addonSizePrices = [],
  onClose,
}: {
  product: Product;
  categoryName?: string;
  flavors: Flavor[];
  addons: Addon[];
  addonSizePrices?: AddonSizePrice[];
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const isPizza = product.product_type === "pizza";

  const sizes = useMemo(
    () => [...(product.product_sizes ?? [])].sort((a, b) => a.display_order - b.display_order),
    [product.product_sizes]
  );
  const availableFlavorIds = useMemo(
    () => new Set((product.product_flavors ?? []).map((f) => f.flavor_id)),
    [product.product_flavors]
  );
  const productFlavors = useMemo(
    () => flavors.filter((f) => availableFlavorIds.has(f.id)),
    [flavors, availableFlavorIds]
  );

  // filter addons by category
  const categoryAddons = useMemo(
    () => addons.filter((a) => a.category_id === product.category_id),
    [addons, product.category_id]
  );
  const borderAddons = useMemo(
    () => categoryAddons.filter((a) => a.group?.toLowerCase().includes("borda")),
    [categoryAddons]
  );
  const regularAddonGroups = useMemo(
    () => groupAddons(categoryAddons.filter((a) => !a.group?.toLowerCase().includes("borda"))),
    [categoryAddons]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const [sizeId, setSizeId] = useState<string>(sizes[0]?.id ?? "");
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [expandedFlavorId, setExpandedFlavorId] = useState<string | null>(null);
  const [removedByFlavor, setRemovedByFlavor] = useState<Record<string, string[]>>({});
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [addonModes, setAddonModes] = useState<Record<string, "half" | "whole">>({});
  const [borderId, setBorderId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedSize = sizes.find((s) => s.id === sizeId);
  const selectedBorder = borderAddons.find((b) => b.id === borderId);
  const maxFlavors = selectedSize?.max_flavors ?? 1;

  // compute price
  const addonsTotal = Object.entries(addonQtys).reduce((sum, [id, qty]) => {
    const sp = addonSizePrices.find((p) => p.addon_id === id && p.size_id === sizeId);
    let unitPrice: number;
    if (sp) {
      unitPrice = (addonModes[id] ?? "whole") === "half" ? sp.price_half : sp.price_whole;
    } else {
      const a = addons.find((x) => x.id === id);
      unitPrice = a?.price ?? 0;
    }
    return sum + unitPrice * qty;
  }, 0);
  const borderPrice = selectedBorder?.price ?? 0;
  const basePrice = isPizza ? selectedSize?.price ?? 0 : product.base_price;
  const unitPrice = basePrice + borderPrice + addonsTotal;

  function toggleFlavor(id: string) {
    setSelectedFlavorIds((prev) => {
      if (prev.includes(id)) {
        setExpandedFlavorId((e) => (e === id ? null : e));
        setRemovedByFlavor((r) => { const n = { ...r }; delete n[id]; return n; });
        return prev.filter((f) => f !== id);
      }
      if (prev.length >= maxFlavors) return prev;
      setExpandedFlavorId(id);
      const next = [...prev, id];
      if (next.length >= maxFlavors) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 120);
      }
      return next;
    });
  }

  function toggleIngredient(flavorId: string, name: string) {
    setRemovedByFlavor((prev) => {
      const cur = prev[flavorId] ?? [];
      return {
        ...prev,
        [flavorId]: cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name],
      };
    });
  }

  function incAddon(id: string) {
    setAddonQtys((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function decAddon(id: string) {
    setAddonQtys((prev) => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: next };
    });
  }

  function confirm() {
    if (isPizza && selectedFlavorIds.length === 0) return;

    const selectedFlavors = productFlavors.filter((f) => selectedFlavorIds.includes(f.id));
    const allRemoved = Array.from(new Set(selectedFlavorIds.flatMap((id) => removedByFlavor[id] ?? [])));

    const addonsArr: AddonSelection[] = Object.entries(addonQtys)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const a = addons.find((x) => x.id === id)!;
        const sp = addonSizePrices.find((p) => p.addon_id === id && p.size_id === sizeId);
        const mode = addonModes[id] ?? "whole";
        const price = sp ? (mode === "half" ? sp.price_half : sp.price_whole) : a.price;
        return { id, name: a.name, price, qty, mode: sp ? mode : null };
      });

    addItem({
      product_name: product.name,
      category_name: categoryName ?? null,
      quantity,
      size_id: selectedSize?.id ?? null,
      size_name: selectedSize?.name ?? null,
      flavors: isPizza ? selectedFlavors.map((f) => ({ flavor_id: f.id, name: f.name })) : null,
      border_id: selectedBorder?.id ?? null,
      border_name: selectedBorder?.name ?? null,
      border_price: selectedBorder ? borderPrice : null,
      additions: addonsArr.length > 0 ? addonsArr : null,
      removed_ingredients: allRemoved.length > 0 ? allRemoved : null,
      notes: notes.trim() || null,
      price: unitPrice,
    });
    onClose();
  }

  const canConfirm = !isPizza || selectedFlavorIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-background sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border bg-card px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{product.name}</h2>
            {product.description && <p className="mt-0.5 text-sm text-muted">{product.description}</p>}
          </div>
          <button onClick={onClose} className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-hover text-muted">✕</button>
        </div>

        {/* scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">

          {/* TAMANHO */}
          {isPizza && sizes.length > 0 && (
            <div>
              <SectionHeader title="Escolha o tamanho" required />
              {sizes.map((size) => (
                <label
                  key={size.id}
                  className="flex cursor-pointer items-center justify-between border-b border-border px-4 py-3 last:border-0 hover:bg-card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${sizeId === size.id ? "border-wine bg-wine" : "border-border"}`}>
                      {sizeId === size.id && <span className="block h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{size.name}</p>
                      {size.slices && <p className="text-xs text-muted">{size.slices} fatias · até {size.max_flavors} sabor(es)</p>}
                      {!size.slices && <p className="text-xs text-muted">até {size.max_flavors} sabor(es)</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-wine">{formatCurrency(size.price)}</span>
                  <input type="radio" className="sr-only" checked={sizeId === size.id} onChange={() => { setSizeId(size.id); setSelectedFlavorIds([]); setExpandedFlavorId(null); }} />
                </label>
              ))}
            </div>
          )}

          {/* SABORES */}
          {isPizza && productFlavors.length > 0 && (
            <div>
              <SectionHeader
                title="Escolha o(s) sabor(es)"
                subtitle={`${selectedFlavorIds.length} de ${maxFlavors} selecionado(s)`}
                required
              />
              {productFlavors.map((flavor) => (
                <FlavorCard
                  key={flavor.id}
                  flavor={flavor}
                  selected={selectedFlavorIds.includes(flavor.id)}
                  disabled={selectedFlavorIds.length >= maxFlavors && !selectedFlavorIds.includes(flavor.id)}
                  onToggle={() => toggleFlavor(flavor.id)}
                  expanded={expandedFlavorId === flavor.id}
                  onExpandToggle={() => setExpandedFlavorId((e) => (e === flavor.id ? null : flavor.id))}
                  removedIngredients={removedByFlavor[flavor.id] ?? []}
                  onToggleIngredient={(name) => toggleIngredient(flavor.id, name)}
                />
              ))}
            </div>
          )}

          {/* quick-add banner when flavors are ready */}
          {isPizza && selectedFlavorIds.length > 0 && (
            <div className="border-b border-wine/20 bg-wine/5 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-wine">
                  {selectedFlavorIds.length >= maxFlavors ? "Sabores selecionados!" : `${selectedFlavorIds.length}/${maxFlavors} sabores`}
                </p>
                <p className="text-xs text-muted">Role para personalizar ou adicione já</p>
              </div>
              <button
                onClick={confirm}
                disabled={!canConfirm}
                className="shrink-0 rounded-xl bg-wine px-4 py-2 text-xs font-bold text-white hover:bg-wine-hover disabled:opacity-40"
              >
                Adicionar · {formatCurrency(unitPrice * quantity)}
              </button>
            </div>
          )}

          {/* ADICIONAIS (non-border) */}
          {regularAddonGroups.map(({ group, items }) => (
            <div key={group ?? "__ungrouped"}>
              <SectionHeader title={group ?? "Adicionais"} subtitle="Escolha os extras desejados" />
              {items.map((addon) => {
                const sp = addonSizePrices.find((p) => p.addon_id === addon.id && p.size_id === sizeId) ?? null;
                return (
                  <AddonRow
                    key={addon.id}
                    addon={addon}
                    qty={addonQtys[addon.id] ?? 0}
                    onInc={() => incAddon(addon.id)}
                    onDec={() => decAddon(addon.id)}
                    sizePrice={sp}
                    mode={addonModes[addon.id] ?? "whole"}
                    onModeChange={(m) => setAddonModes((prev) => ({ ...prev, [addon.id]: m }))}
                  />
                );
              })}
            </div>
          ))}

          {/* BORDA */}
          {borderAddons.length > 0 && (
            <div>
              <SectionHeader title="Deseja adicionar borda recheada?" />
              <label className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 hover:bg-card-hover">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${borderId === "" ? "border-wine bg-wine" : "border-border"}`}>
                  {borderId === "" && <span className="block h-2 w-2 rounded-full bg-white" />}
                </div>
                <p className="text-sm text-foreground">Sem borda</p>
                <input type="radio" className="sr-only" checked={borderId === ""} onChange={() => setBorderId("")} />
              </label>
              {borderAddons.map((border) => (
                <label key={border.id} className="flex cursor-pointer items-center justify-between border-b border-border px-4 py-3 last:border-0 hover:bg-card-hover">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${borderId === border.id ? "border-wine bg-wine" : "border-border"}`}>
                      {borderId === border.id && <span className="block h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <p className="text-sm text-foreground">{border.name}</p>
                  </div>
                  <span className="text-xs text-wine">+{formatCurrency(border.price)}</span>
                  <input type="radio" className="sr-only" checked={borderId === border.id} onChange={() => setBorderId(border.id)} />
                </label>
              ))}
            </div>
          )}

          {/* OBSERVAÇÕES */}
          <div>
            <SectionHeader title="Alguma observação?" subtitle="Ex: sem cebola, bem passado, cortar em 8..." />
            <div className="px-4 py-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Digite sua observação aqui..."
                className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </div>
          </div>
        </div>

        {/* sticky footer */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-4 pb-safe">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card-hover text-foreground hover:bg-border"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine hover:bg-wine/20"
              >
                +
              </button>
            </div>
            <button
              onClick={confirm}
              disabled={!canConfirm}
              className="flex-1 ml-4 rounded-xl bg-wine px-4 py-2.5 text-sm font-semibold text-white hover:bg-wine-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Adicionar · {formatCurrency(unitPrice * quantity)}
            </button>
          </div>
          {isPizza && selectedFlavorIds.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted">Selecione pelo menos um sabor para continuar</p>
          )}
        </div>
      </div>
    </div>
  );
}
