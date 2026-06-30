"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { OrderItemFlavor, AddonSelection } from "@/types/domain";

export interface CartItem {
  id: string;
  product_name: string;
  quantity: number;
  size_id: string | null;
  size_name: string | null;
  flavors: OrderItemFlavor[] | null;
  border_id: string | null;
  border_name: string | null;
  border_price: number | null;
  additions: AddonSelection[] | null;
  removed_ingredients: string[] | null;
  notes: string | null;
  price: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [storageKey, items]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
