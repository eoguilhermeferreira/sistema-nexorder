"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, CategorySize, Product, Flavor, Addon } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { ProductConfigurator } from "./ProductConfigurator";
import { useCart } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";

export function MenuBrowser({
  categories,
  products,
  flavors,
  addons,
}: {
  categories: Category[];
  products: Product[];
  flavors: Flavor[];
  addons: Addon[];
}) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  function scrollToCategory(catId: string) {
    setActiveCatId(catId);
    sectionRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      {/* category pills */}
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCatId === cat.id
                  ? "border-wine bg-wine text-white"
                  : "border-border bg-card text-muted hover:border-wine hover:text-foreground"
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
          const categoryFlavors = (flavors as any[]).filter((f) => f.category_id === category.id) as Flavor[];

          if (category.is_pizza) {
            if (categoryFlavors.length === 0) return null;
            return (
              <div key={category.id} ref={(el) => { sectionRefs.current[category.id] = el; }}>
                <h2 className="text-base font-bold text-foreground">{category.name}</h2>
                <PizzaSection
                  category={category}
                  flavors={categoryFlavors}
                  addons={addons}
                />
              </div>
            );
          }

          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id} ref={(el) => { sectionRefs.current[category.id] = el; }}>
              <h2 className="text-base font-bold text-foreground">{category.name}</h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {categoryProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setActiveProduct(product)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-card-hover"
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
          product={activeProduct}
          flavors={flavors}
          addons={addons}
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
}: {
  category: Category;
  flavors: Flavor[];
  addons: Addon[];
}) {
  const { addItem } = useCart();
  const sizeRef = useRef<HTMLDivElement>(null);

  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
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

  const selectedSize = sizes.find((s) => s.id === selectedSizeId);
  const maxFlavors = selectedSize?.max_flavors ?? 1;

  function selectSize(id: string) {
    setSelectedSizeId(id);
    setSelectedFlavorIds([]);
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
      if (prev.includes(flavorId)) return prev.filter((id) => id !== flavorId);
      if (prev.length >= maxFlavors) {
        // replace first selected if at max and max === 1, otherwise ignore
        if (maxFlavors === 1) return [flavorId];
        return prev;
      }
      return [...prev, flavorId];
    });
  }

  function addToCart() {
    if (!selectedSize || selectedFlavorIds.length === 0) return;
    const selected = flavors.filter((f) => selectedFlavorIds.includes(f.id));
    addItem({
      product_name: category.name,
      quantity,
      size_id: selectedSize.id,
      size_name: selectedSize.name,
      flavors: selected.map((f) => ({ flavor_id: f.id, name: f.name })),
      border_id: null,
      border_name: null,
      border_price: null,
      additions: null,
      removed_ingredients: null,
      notes: null,
      price: selectedSize.price,
    });
    setSelectedSizeId("");
    setSelectedFlavorIds([]);
    setQuantity(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const canAdd = !!selectedSize && selectedFlavorIds.length > 0;

  return (
    <div className="mt-3 space-y-3">
      {/* size selector */}
      <div
        ref={sizeRef}
        className={`rounded-xl border p-4 transition-all duration-300 ${
          sizeHighlight
            ? "border-wine bg-wine/5 ring-2 ring-wine"
            : "border-border bg-card"
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
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => selectSize(size.id)}
                className={`flex flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors ${
                  selectedSizeId === size.id
                    ? "border-wine bg-wine text-white"
                    : "border-border bg-card-hover text-foreground hover:border-wine"
                }`}
              >
                <span className="text-sm font-semibold">{size.name}</span>
                <span className={`text-xs ${selectedSizeId === size.id ? "text-white/80" : "text-muted"}`}>
                  {formatCurrency(size.price)} · até {size.max_flavors} sabor(es)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* flavor list */}
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
        {flavors.map((flavor) => {
          const isSelected = selectedFlavorIds.includes(flavor.id);
          const ingredients = flavor.ingredients.map((i) => i.name).join(", ");
          const isDisabled = !isSelected && selectedFlavorIds.length >= maxFlavors;

          return (
            <button
              key={flavor.id}
              onClick={() => toggleFlavor(flavor.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isDisabled ? "opacity-40" : "hover:bg-card-hover"
              } ${isSelected ? "bg-wine/5" : ""}`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isSelected ? "border-wine bg-wine" : "border-border"
              }`}>
                {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{flavor.name}</p>
                {ingredients && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{ingredients}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* add to cart */}
      {canAdd && (
        <div className="flex items-center gap-3 rounded-xl border border-wine bg-card p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card-hover text-foreground"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-semibold text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-wine bg-wine/10 text-wine"
            >
              +
            </button>
          </div>
          <button
            onClick={addToCart}
            className="flex-1 rounded-lg bg-wine px-4 py-2 text-sm font-semibold text-white hover:bg-wine-hover"
          >
            {added ? "Adicionado!" : `Adicionar · ${formatCurrency(selectedSize!.price * quantity)}`}
          </button>
        </div>
      )}
    </div>
  );
}
