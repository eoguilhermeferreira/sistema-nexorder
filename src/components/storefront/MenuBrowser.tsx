"use client";

import { useState } from "react";
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

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => {
        const categoryProducts = products.filter((p) => p.category_id === category.id);
        const categoryFlavors = flavors.filter((f) => (f as any).category_id === category.id);

        // pizza categories: show flavor list + a "Monte sua pizza" button
        if (category.is_pizza) {
          const pizzaProduct = categoryProducts[0] ?? null;
          if (categoryFlavors.length === 0 && !pizzaProduct) return null;
          return (
            <div key={category.id}>
              <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>

              {/* flavor listing */}
              {categoryFlavors.length > 0 && (
                <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                  {categoryFlavors.map((flavor) => {
                    const ingredients = flavor.ingredients.map((i) => i.name).join(", ");
                    return (
                      <div key={flavor.id} className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{flavor.name}</p>
                        {ingredients && (
                          <p className="mt-0.5 text-xs text-muted">{ingredients}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* add to cart button */}
              {pizzaProduct && (
                <button
                  onClick={() => setActiveProduct(pizzaProduct)}
                  className="mt-3 w-full rounded-xl border border-wine bg-wine/10 px-4 py-3 text-sm font-semibold text-wine hover:bg-wine/20"
                >
                  Monte sua pizza
                  {pizzaProduct.product_sizes?.length
                    ? ` · a partir de ${formatCurrency(Math.min(...pizzaProduct.product_sizes.map((s) => s.price)))}`
                    : ""}
                </button>
              )}
            </div>
          );
        }

        // regular categories: show product cards
        if (categoryProducts.length === 0) return null;
        return (
          <div key={category.id}>
            <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {categoryProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-hover"
                >
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    {product.description && (
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{product.description}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-wine">{formatCurrency(product.base_price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

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
