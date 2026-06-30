"use client";

import { useRef, useState } from "react";
import type { Category, Product, Flavor, Addon } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { ProductConfigurator } from "./ProductConfigurator";

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
      {/* ── category pills ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

      {/* ── product sections ───────────────────────────────────── */}
      <div className="mt-4 space-y-8">
        {sortedCategories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          const categoryFlavors = (flavors as any[]).filter((f) => f.category_id === category.id) as Flavor[];

          const hasContent = category.is_pizza
            ? categoryFlavors.length > 0 || categoryProducts.length > 0
            : categoryProducts.length > 0;

          if (!hasContent) return null;

          return (
            <div
              key={category.id}
              ref={(el) => { sectionRefs.current[category.id] = el; }}
            >
              <h2 className="text-base font-bold text-foreground">{category.name}</h2>

              {category.is_pizza ? (
                /* ── pizza: list flavors as iFood-style rows ── */
                <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {categoryFlavors.map((flavor) => {
                    const ingredients = flavor.ingredients.map((i) => i.name).join(", ");
                    return (
                      <div key={flavor.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{flavor.name}</p>
                          {ingredients && (
                            <p className="mt-0.5 text-xs leading-relaxed text-muted">{ingredients}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* mount button at bottom of list */}
                  {categoryProducts[0] && (
                    <button
                      onClick={() => setActiveProduct(categoryProducts[0])}
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-card-hover"
                    >
                      <span className="text-sm font-semibold text-wine">Monte sua pizza →</span>
                      {categoryProducts[0].product_sizes?.length ? (
                        <span className="text-xs text-muted">
                          a partir de {formatCurrency(Math.min(...categoryProducts[0].product_sizes.map((s) => s.price)))}
                        </span>
                      ) : null}
                    </button>
                  )}
                </div>
              ) : (
                /* ── regular: iFood-style product cards ── */
                <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {categoryProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setActiveProduct(product)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-card-hover"
                    >
                      {/* text left */}
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
                      {/* image right */}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-card-hover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
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
