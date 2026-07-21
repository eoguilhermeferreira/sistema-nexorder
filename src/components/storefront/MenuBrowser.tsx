"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, CategorySize, Product, Flavor, Addon, FlavorSizePrice, AddonSizePrice } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { ProductConfigurator } from "./ProductConfigurator";
import { useCart } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";

export function MenuBrowser({
  categories,
  products,
  flavors,
  addons,
  flavorSizePrices = [],
  addonSizePrices = [],
}: {
  categories: Category[];
  products: Product[];
  flavors: Flavor[];
  addons: Addon[];
  flavorSizePrices?: FlavorSizePrice[];
  addonSizePrices?: AddonSizePrice[];
}) {
  const [activeProduct, setActiveProduct] = useState<{ product: Product; categoryName: string } | null>(null);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillsContainerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingTo = useRef(false);

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  // IntersectionObserver: update active pill as user scrolls
  useEffect(() => {
    if (sortedCategories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        // pick the topmost section that is intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("data-cat-id")!;
          setActiveCatId(id);
          // scroll pill into view
          const pill = pillRefs.current[id];
          const container = pillsContainerRef.current;
          if (pill && container) {
            const pillLeft = pill.offsetLeft;
            const pillWidth = pill.offsetWidth;
            const containerWidth = container.offsetWidth;
            container.scrollTo({ left: pillLeft - containerWidth / 2 + pillWidth / 2, behavior: "smooth" });
          }
        }
      },
      { rootMargin: "-64px 0px -40% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [sortedCategories.length]);

  function scrollToCategory(catId: string) {
    isScrollingTo.current = true;
    setActiveCatId(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: "smooth" });
    }
    // re-enable observer after scroll settles
    setTimeout(() => { isScrollingTo.current = false; }, 800);
  }

  return (
    <div>
      {/* category pills */}
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-2 shadow-sm">
        <div ref={pillsContainerRef} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => { pillRefs.current[cat.id] = el; }}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
                activeCatId === cat.id
                  ? "border-wine bg-wine text-white"
                  : "border-border bg-card text-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* sections */}
      <div className="mt-4 space-y-8">
        {sortedCategories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          const categoryFlavors = flavors.filter((f) => (f as any).category_id === category.id);
          const categoryAddons = addons.filter((a) => a.category_id === category.id);

          if (category.is_pizza) {
            if (categoryFlavors.length === 0) return null;
            const catUnavailable = category.available === false;
            return (
              <div key={category.id} ref={(el) => { sectionRefs.current[category.id] = el; }} data-cat-id={category.id} className={catUnavailable ? "opacity-60 pointer-events-none" : ""}>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{category.name}</h2>
                  {catUnavailable && (
                    <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-xs font-medium text-zinc-400">Indisponível no momento</span>
                  )}
                </div>
                <PizzaSection
                  category={category}
                  flavors={categoryFlavors}
                  addons={categoryAddons}
                  flavorSizePrices={flavorSizePrices}
                />
              </div>
            );
          }

          if (categoryProducts.length === 0) return null;
          const catUnavailable = category.available === false;
          return (
            <div key={category.id} ref={(el) => { sectionRefs.current[category.id] = el; }} data-cat-id={category.id} className={catUnavailable ? "opacity-60 pointer-events-none" : ""}>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{category.name}</h2>
                {catUnavailable && (
                  <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-xs font-medium text-zinc-400">Indisponível no momento</span>
                )}
              </div>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {categoryProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => !catUnavailable && setActiveProduct({ product, categoryName: category.name })}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-card-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm font-semibold text-wine">
                        {formatCurrency(product.base_price)}
                      </p>
                    </div>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-card-hover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeProduct && (
        <ProductConfigurator
          product={activeProduct.product}
          categoryName={activeProduct.categoryName}
          flavors={flavors}
          addons={addons}
          addonSizePrices={addonSizePrices}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </div>
  );
}

// ─── Pizza inline section ─────────────────────────────────────────────────────

function PizzaSection({
  category,
  flavors,
  addons,
  flavorSizePrices,
}: {
  category: Category;
  flavors: Flavor[];
  addons: Addon[];
  flavorSizePrices: FlavorSizePrice[];
}) {
  const { addItem } = useCart();
  const sizeRef = useRef<HTMLDivElement>(null);

  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  // addonQtys: per-flavor addon quantities { [flavorId]: { [addonId]: qty } }
  const [addonQtys, setAddonQtys] = useState<Record<string, Record<string, number>>>({});
  // which flavors have their addons panel open
  const [expandedFlavorIds, setExpandedFlavorIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [sizeHighlight, setSizeHighlight] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (createClient() as any)
      .from("category_sizes")
      .select("*")
      .eq("category_id", category.id)
      .order("display_order")
      .then(({ data }: any) => setSizes(data ?? []));
  }, [category.id]);

  const isPerFlavor = category.pricing_mode === "per_flavor";
  const selectedSize = sizes.find((s) => s.id === selectedSizeId);

  // sweet surcharge: sum of flavor_size_prices for selected sweet flavors on the current size
  function getSweetSurcharge(): number {
    if (!selectedSize) return 0;
    return selectedFlavorIds.reduce((sum, fid) => {
      const f = flavors.find((x) => x.id === fid);
      if (!f?.is_sweet) return sum;
      const fp = flavorSizePrices.find((p) => p.flavor_id === fid && p.size_id === selectedSize.id);
      return sum + (fp?.price ?? 0);
    }, 0);
  }

  // base price: size price + sweet surcharges; for per_flavor mode: max of flavor prices + sweet surcharges
  function getFlavorBasePrice(): number {
    if (!selectedSize) return 0;
    const sweetExtra = getSweetSurcharge();
    if (!isPerFlavor) return selectedSize.price + sweetExtra;
    if (selectedFlavorIds.length === 0) return 0;
    const savoryIds = selectedFlavorIds.filter((fid) => !flavors.find((f) => f.id === fid)?.is_sweet);
    const maxSavory = savoryIds.length > 0
      ? Math.max(...savoryIds.map((fid) => flavorSizePrices.find((p) => p.flavor_id === fid && p.size_id === selectedSize.id)?.price ?? 0))
      : selectedSize.price;
    return maxSavory + sweetExtra;
  }
  const maxFlavors = selectedSize?.max_flavors ?? 1;

  function selectSize(id: string) {
    setSelectedSizeId(id);
    setSelectedFlavorIds([]);
    setAddonQtys({});
    setExpandedFlavorIds(new Set());
    setSizeHighlight(false);
  }

  function toggleFlavor(flavorId: string) {
    if (!selectedSizeId) {
      setSizeHighlight(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setSizeHighlight(false), 2500);
      return;
    }
    setSelectedFlavorIds((prev) => {
      if (prev.includes(flavorId)) {
        // deselect: remove addons and collapse
        setAddonQtys((q) => { const n = { ...q }; delete n[flavorId]; return n; });
        setExpandedFlavorIds((e) => { const n = new Set(e); n.delete(flavorId); return n; });
        return prev.filter((id) => id !== flavorId);
      }
      if (prev.length >= maxFlavors) return maxFlavors === 1 ? [flavorId] : prev;
      // select: auto-expand addons panel if there are addons
      if (addons.length > 0) {
        setExpandedFlavorIds((e) => new Set([...e, flavorId]));
      }
      return [...prev, flavorId];
    });
  }

  function toggleExpand(flavorId: string) {
    setExpandedFlavorIds((prev) => {
      const n = new Set(prev);
      if (n.has(flavorId)) n.delete(flavorId);
      else n.add(flavorId);
      return n;
    });
  }

  function incAddon(flavorId: string, addonId: string) {
    setAddonQtys((prev) => ({
      ...prev,
      [flavorId]: { ...(prev[flavorId] ?? {}), [addonId]: ((prev[flavorId] ?? {})[addonId] ?? 0) + 1 },
    }));
  }

  function decAddon(flavorId: string, addonId: string) {
    setAddonQtys((prev) => {
      const flavorQtys = { ...(prev[flavorId] ?? {}) };
      const next = (flavorQtys[addonId] ?? 0) - 1;
      if (next <= 0) delete flavorQtys[addonId];
      else flavorQtys[addonId] = next;
      return { ...prev, [flavorId]: flavorQtys };
    });
  }

  // build addons array preserving which flavor each addon belongs to
  function buildAddonsArr() {
    const arr: import("@/types/domain").AddonSelection[] = [];
    for (const [flavorId, flavorQtys] of Object.entries(addonQtys)) {
      const flavor = flavors.find((f) => f.id === flavorId);
      for (const [addonId, qty] of Object.entries(flavorQtys)) {
        if (qty <= 0) continue;
        const a = addons.find((x) => x.id === addonId);
        if (!a) continue;
        arr.push({ id: addonId, name: a.name, price: a.price, qty, flavor_name: flavor?.name ?? null });
      }
    }
    return arr;
  }

  function addToCart() {
    if (!selectedSize || selectedFlavorIds.length === 0) return;
    const selected = flavors.filter((f) => selectedFlavorIds.includes(f.id));
    const addonsArr = buildAddonsArr();

    const addonsTotal = addonsArr.reduce((sum, a) => sum + a.price * a.qty, 0);
    const basePrice = getFlavorBasePrice();

    addItem({
      product_name: category.name,
      category_name: null,
      quantity,
      size_id: selectedSize.id,
      size_name: selectedSize.name,
      flavors: selected.map((f) => ({ flavor_id: f.id, name: f.name })),
      border_id: null,
      border_name: null,
      border_price: null,
      additions: addonsArr.length > 0 ? addonsArr : null,
      removed_ingredients: null,
      notes: notes.trim() || null,
      price: basePrice + addonsTotal,
    });

    setSelectedSizeId("");
    setSelectedFlavorIds([]);
    setAddonQtys({});
    setExpandedFlavorIds(new Set());
    setNotes("");
    setQuantity(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const canAdd = !!selectedSize && selectedFlavorIds.length > 0;

  const addonsTotal = buildAddonsArr().reduce((sum, a) => sum + a.price * a.qty, 0);
  const basePrice = getFlavorBasePrice();

  return (
    <div className="mt-3 space-y-3">
      {/* size selector */}
      <div
        ref={sizeRef}
        className={`rounded-xl border p-4 transition-all duration-300 ${
          sizeHighlight ? "border-wine bg-wine/5 ring-2 ring-wine" : "border-border bg-card"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Tamanho <span className="text-wine">*obrigatório</span>
        </p>
        {sizeHighlight && (
          <p className="mt-1 text-xs text-wine">Escolha um tamanho antes de selecionar o sabor</p>
        )}
        {sizes.length === 0 ? (
          <p className="mt-2 text-xs text-muted">Nenhum tamanho cadastrado.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => selectSize(size.id)}
                className={`flex w-full flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors active:scale-95 ${
                  selectedSizeId === size.id
                    ? "border-wine bg-wine text-white"
                    : "border-border bg-card-hover text-foreground"
                }`}
              >
                <span className="text-sm font-semibold">{size.name}</span>
                <span className={`text-xs ${selectedSizeId === size.id ? "text-white/80" : "text-muted"}`}>
                  {isPerFlavor ? "preço por sabor" : formatCurrency(size.price)} · até {size.max_flavors} sabor(es)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* flavor list with inline collapsible addons */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Sabores
            {selectedSize && (
              <span className="ml-2 font-normal normal-case text-muted">
                — {selectedFlavorIds.length}/{maxFlavors} selecionado(s)
              </span>
            )}
          </p>
        </div>
        {(() => {
          const salgados = flavors.filter((f) => !f.is_sweet);
          const doces = flavors.filter((f) => f.is_sweet);
          const allGroups: { label: string | null; pink: boolean; list: typeof flavors }[] = [];
          if (salgados.length > 0) allGroups.push({ label: doces.length > 0 ? "🧀 Pizzas Salgadas" : null, pink: false, list: salgados });
          if (doces.length > 0) allGroups.push({ label: "🍫 Pizzas Doces", pink: true, list: doces });
          return allGroups.map(({ label, pink, list }) => (
            <div key={label ?? "salgadas"}>
              {label && (
                <div className={`px-4 py-2 border-t border-border ${pink ? "bg-pink-500/5" : "bg-card-hover"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${pink ? "text-pink-400" : "text-muted"}`}>{label}</p>
                </div>
              )}
              {list.map((flavor) => {
          const isSelected = selectedFlavorIds.includes(flavor.id);
          const ingredients = (flavor.ingredients ?? []).map((i) => i.name).join(", ");
          const flavorUnavailable = flavor.available === false;
          const isDisabled = flavorUnavailable || (!isSelected && selectedFlavorIds.length >= maxFlavors);
          const flavorPrice = isPerFlavor && selectedSize
            ? flavorSizePrices.find((p) => p.flavor_id === flavor.id && p.size_id === selectedSize.id)?.price
            : undefined;
          const isExpanded = expandedFlavorIds.has(flavor.id);
          const flavorAddonQtys = addonQtys[flavor.id] ?? {};
          const flavorAddonsTotal = Object.entries(flavorAddonQtys).reduce((sum, [id, qty]) => {
            const a = addons.find((x) => x.id === id);
            return sum + (a?.price ?? 0) * qty;
          }, 0);
          const hasAddons = addons.length > 0;

          return (
            <div key={flavor.id} className={flavorUnavailable ? "opacity-50 pointer-events-none" : isDisabled ? "opacity-40" : ""}>
              {/* flavor row */}
              <div className={`flex items-center gap-3 px-4 py-4 ${isSelected ? "bg-wine/5" : ""}`}>
                {/* select toggle */}
                <button
                  onClick={() => toggleFlavor(flavor.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={{ borderColor: isSelected ? "var(--color-wine)" : undefined, backgroundColor: isSelected ? "var(--color-wine)" : undefined }}
                >
                  {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                </button>

                {/* name + ingredients (tappable to select) */}
                <button
                  onClick={() => toggleFlavor(flavor.id)}
                  className="min-w-0 flex-1 text-left"
                  disabled={isDisabled && !isSelected}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{flavor.name}</p>
                    {flavorUnavailable && (
                      <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-xs font-medium text-zinc-400">Indisponível</span>
                    )}
                    {flavorPrice != null && (
                      <span className="text-xs font-semibold text-wine">{formatCurrency(flavorPrice)}</span>
                    )}
                    {flavor.is_sweet && selectedSize && (() => {
                      const fp = flavorSizePrices.find((p) => p.flavor_id === flavor.id && p.size_id === selectedSize.id);
                      return fp?.price ? <span className="text-xs font-semibold text-pink-400">+{formatCurrency(fp.price)}</span> : null;
                    })()}
                  </div>
                  {ingredients && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{ingredients}</p>
                  )}
                  {isSelected && flavorAddonsTotal > 0 && (
                    <p className="mt-0.5 text-xs text-wine">+{formatCurrency(flavorAddonsTotal)} em adicionais</p>
                  )}
                </button>

                {/* expand arrow — only shown when selected and addons exist */}
                {isSelected && hasAddons && (
                  <button
                    onClick={() => toggleExpand(flavor.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine/10 text-wine transition-transform"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    aria-label={isExpanded ? "Recolher adicionais" : "Ver adicionais"}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* collapsible addons panel */}
              {isSelected && hasAddons && isExpanded && (
                <div className="border-t border-border bg-card-hover px-4 pb-3 pt-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Adicionais para este sabor
                  </p>
                  <div className="space-y-2">
                    {addons.map((addon) => {
                      const qty = flavorAddonQtys[addon.id] ?? 0;
                      return (
                        <div key={addon.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-foreground">{addon.name}</p>
                            {addon.price > 0 && <p className="text-xs text-wine">+{formatCurrency(addon.price)}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <button
                                onClick={() => decAddon(flavor.id, addon.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground active:bg-card-hover"
                              >
                                −
                              </button>
                            )}
                            {qty > 0 && <span className="w-4 text-center text-sm font-medium">{qty}</span>}
                            <button
                              onClick={() => incAddon(flavor.id, addon.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine active:bg-wine/20"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
            </div>
          ));
        })()}
      </div>

      {/* notes */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Observações</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex: sem cebola, bem assada..."
          className="mt-2 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-wine"
        />
      </div>

      {/* add to cart */}
      {canAdd && (
        <div className="flex items-center gap-3 rounded-xl border border-wine bg-card p-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card-hover text-foreground">−</button>
            <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine">+</button>
          </div>
          <button
            onClick={addToCart}
            className="flex-1 rounded-xl bg-wine px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            {added ? "Adicionado!" : `Adicionar · ${formatCurrency((basePrice + addonsTotal) * quantity)}`}
          </button>
        </div>
      )}
    </div>
  );
}
