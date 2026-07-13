"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product, Flavor, Addon, CompanySettings, BusinessHours, FlavorSizePrice } from "@/types/domain";

export interface StorefrontCompany {
  id: string;
  slug: string;
  name: string;
  fantasy_name: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  highlight_color: string | null;
  is_open: boolean | null;
  address: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  logo_shape: string | null;
}

export function useStorefront(slug: string) {
  const [company, setCompany] = useState<StorefrontCompany | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [flavorSizePrices, setFlavorSizePrices] = useState<FlavorSizePrice[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const { data: companyRow } = await supabase
      .from("companies")
      .select(
        "id, slug, name, fantasy_name, description, logo_url, banner_url, primary_color, secondary_color, highlight_color, is_open, address, city, state, whatsapp, instagram, facebook, website, logo_shape"
      )
      .eq("slug", slug)
      .single();

    if (!companyRow) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setCompany(companyRow);

    const companyId = companyRow.id;
    const [categoriesRes, productsRes, flavorsRes, addonsRes, flavorPricesRes, settingsRes, hoursRes] =
      await Promise.all([
        supabase.from("categories").select("*").eq("company_id", companyId).eq("active", true).order("display_order"),
        supabase
          .from("products")
          .select("*, product_sizes(*), product_flavors(flavor_id)")
          .eq("company_id", companyId)
          .eq("active", true)
          .order("created_at"),
        supabase.from("flavors").select("*").eq("company_id", companyId).eq("available", true).order("name"),
        supabase.from("addons").select("*").eq("company_id", companyId).eq("active", true).order("name"),
        (supabase as any).from("flavor_size_prices").select("*"),
        supabase.from("company_settings").select("*").eq("company_id", companyId).single(),
        supabase.from("business_hours").select("*").eq("company_id", companyId).order("weekday"),
      ]);

    setCategories((categoriesRes.data as unknown as Category[]) ?? []);
    setProducts((productsRes.data as unknown as Product[]) ?? []);
    setFlavors((flavorsRes.data as unknown as Flavor[]) ?? []);
    setAddons((addonsRes.data as unknown as Addon[]) ?? []);
    setFlavorSizePrices((flavorPricesRes.data as unknown as FlavorSizePrice[]) ?? []);
    setSettings((settingsRes.data as unknown as CompanySettings) ?? null);
    setBusinessHours((hoursRes.data as unknown as BusinessHours[]) ?? []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { company, categories, products, flavors, addons, flavorSizePrices, settings, businessHours, loading, notFound, refetch: fetchAll };
}
