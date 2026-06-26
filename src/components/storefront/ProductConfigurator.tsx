"use client";

import { useMemo, useState } from "react";
import type { Product, Flavor, Addon, Border } from "@/types/domain";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";

export function ProductConfigurator({
  product,
  flavors,
  addons,
  borders,
  onClose,
}: {
  product: Product;
  flavors: Flavor[];
  addons: Addon[];
  borders: Border[];
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

  const [sizeId, setSizeId] = useState<string>(sizes[0]?.id ?? "");
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [borderId, setBorderId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedSize = sizes.find((s) => s.id === sizeId);
  const selectedBorder = borders.find((b) => b.id === borderId);
  const selectedFlavors = productFlavors.filter((f) => selectedFlavorIds.includes(f.id));

  const removableIngredients = useMemo(() => {
    const names = new Set<string>();
    selectedFlavors.forEach((f) => f.ingredients.filter((i) => i.removable).forEach((i) => names.add(i.name)));
    return Array.from(names);
  }, [selectedFlavors]);

  const borderPrice = selectedBorder ? (Object.values(selectedBorder.prices)[0] as number) ?? 0 : 0;
  const addonsTotal = addons.filter((a) => selectedAddonIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const basePrice = isPizza ? selectedSize?.price ?? 0 : product.base_price;
  const unitPrice = basePrice + borderPrice + addonsTotal;

  function toggleFlavor(id: string) {
    setSelectedFlavorIds((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      const max = selectedSize?.max_flavors ?? 1;
      if (prev.length >= max) return prev;
      return [...prev, id];
    });
  }

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function toggleRemoved(name: string) {
    setRemovedIngredients((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function confirm() {
    if (isPizza && selectedFlavorIds.length === 0) return;
    addItem({
      product_name: product.name,
      quantity,
      size_id: selectedSize?.id ?? null,
      size_name: selectedSize?.name ?? null,
      flavors: isPizza ? selectedFlavors.map((f) => ({ flavor_id: f.id, name: f.name })) : null,
      border_id: selectedBorder?.id ?? null,
      border_name: selectedBorder?.name ?? null,
      border_price: selectedBorder ? borderPrice : null,
      additions: selectedAddonIds.length ? addons.filter((a) => selectedAddonIds.includes(a.id)).map((a) => a.name) : null,
      removed_ingredients: removedIngredients.length ? removedIngredients : null,
      notes: notes.trim() || null,
      price: unitPrice,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{product.name}</h2>
            {product.description && <p className="mt-1 text-sm text-muted">{product.description}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>

        {isPizza && sizes.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Tamanho</p>
            <div className="mt-2 space-y-2">
              {sizes.map((size) => (
                <label key={size.id} className="flex items-center justify-between rounded-lg border border-border bg-card-hover px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <input
                      type="radio"
                      checked={sizeId === size.id}
                      onChange={() => {
                        setSizeId(size.id);
                        setSelectedFlavorIds([]);
                      }}
                    />
                    {size.name} {size.slices ? `(${size.slices} fatias)` : ""} — até {size.max_flavors} sabor(es)
                  </span>
                  <span className="text-muted">{formatCurrency(size.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {isPizza && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">
              Sabores ({selectedFlavorIds.length}/{selectedSize?.max_flavors ?? 1})
            </p>
            <div className="mt-2 space-y-2">
              {productFlavors.map((flavor) => (
                <label key={flavor.id} className="flex items-center justify-between rounded-lg border border-border bg-card-hover px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <input type="checkbox" checked={selectedFlavorIds.includes(flavor.id)} onChange={() => toggleFlavor(flavor.id)} />
                    {flavor.name}
                  </span>
                </label>
              ))}
              {productFlavors.length === 0 && <p className="text-xs text-muted">Nenhum sabor disponível.</p>}
            </div>
          </div>
        )}

        {isPizza && removableIngredients.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Remover ingredientes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {removableIngredients.map((name) => (
                <button
                  key={name}
                  onClick={() => toggleRemoved(name)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    removedIngredients.includes(name) ? "border-wine bg-wine/20 text-foreground" : "border-border bg-card-hover text-muted"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isPizza && borders.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Borda</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-center justify-between rounded-lg border border-border bg-card-hover px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <input type="radio" checked={borderId === ""} onChange={() => setBorderId("")} />
                  Sem borda
                </span>
              </label>
              {borders.map((border) => (
                <label key={border.id} className="flex items-center justify-between rounded-lg border border-border bg-card-hover px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <input type="radio" checked={borderId === border.id} onChange={() => setBorderId(border.id)} />
                    {border.name}
                  </span>
                  <span className="text-muted">+{formatCurrency((Object.values(border.prices)[0] as number) ?? 0)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {addons.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Adicionais</p>
            <div className="mt-2 space-y-2">
              {addons.map((addon) => (
                <label key={addon.id} className="flex items-center justify-between rounded-lg border border-border bg-card-hover px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <input type="checkbox" checked={selectedAddonIds.includes(addon.id)} onChange={() => toggleAddon(addon.id)} />
                    {addon.name}
                  </span>
                  <span className="text-muted">+{formatCurrency(addon.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Observações</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: sem cebola, caprichar no molho..."
            className="mt-2 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Quantidade</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-lg bg-card-hover text-foreground hover:bg-border"
            >
              −
            </button>
            <span className="w-6 text-center text-foreground">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} className="h-8 w-8 rounded-lg bg-card-hover text-foreground hover:bg-border">
              +
            </button>
          </div>
        </div>

        <button
          onClick={confirm}
          disabled={isPizza && selectedFlavorIds.length === 0}
          className="mt-5 w-full rounded-lg bg-wine px-4 py-3 text-sm font-medium text-white hover:bg-wine-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Adicionar — {formatCurrency(unitPrice * quantity)}
        </button>
      </div>
    </div>
  );
}
