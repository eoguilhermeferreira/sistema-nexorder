"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product, Flavor, Addon } from "@/types/domain";

export function useCatalog(companyId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const [categoriesRes, productsRes, flavorsRes, addonsRes] = await Promise.all([
      supabase.from("categories").select("*").eq("company_id", companyId).order("display_order"),
      supabase
        .from("products")
        .select("*, product_sizes(*), product_flavors(flavor_id)")
        .eq("company_id", companyId)
        .order("created_at"),
      supabase.from("flavors").select("*").eq("company_id", companyId).order("name"),
      supabase.from("addons").select("*").eq("company_id", companyId).order("name"),
    ]);

    setCategories((categoriesRes.data as unknown as Category[]) ?? []);
    setProducts((productsRes.data as unknown as Product[]) ?? []);
    setFlavors((flavorsRes.data as unknown as Flavor[]) ?? []);
    setAddons((addonsRes.data as unknown as Addon[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { categories, products, flavors, addons, loading, refetch: fetchAll };
}
