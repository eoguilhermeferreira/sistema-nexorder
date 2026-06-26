"use client";

import { useState } from "react";
import type { Category, Product, Flavor, Addon, Border } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { ProductConfigurator } from "./ProductConfigurator";

export function MenuBrowser({
  categories,
  products,
  flavors,
  addons,
  borders,
}: {
  categories: Category[];
  products: Product[];
  flavors: Flavor[];
  addons: Addon[];
  borders: Border[];
}) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => {
        const categoryProducts = products.filter((p) => p.category_id === category.id);
        if (categoryProducts.length === 0) return null;
        return (
          <div key={category.id}>
            <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {categoryProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-wine"
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-card-hover" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    {product.description && <p className="mt-0.5 text-xs text-muted line-clamp-2">{product.description}</p>}
                    <p className="mt-1 text-sm font-semibold text-wine">
                      {product.product_type === "pizza" && product.product_sizes?.length
                        ? `A partir de ${formatCurrency(Math.min(...product.product_sizes.map((s) => s.price)))}`
                        : formatCurrency(product.base_price)}
                    </p>
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
          borders={borders}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </div>
  );
}
