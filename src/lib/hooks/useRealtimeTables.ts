"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TableRestaurant } from "@/types/domain";

export function useRealtimeTables(companyId: string) {
  const [tables, setTables] = useState<TableRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tables_restaurant")
      .select("*, table_customers(*)")
      .eq("company_id", companyId)
      .order("number", { ascending: true });

    setTables((data as unknown as TableRestaurant[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchTables();

    const supabase = createClient();
    const channel = supabase
      .channel(`tables-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables_restaurant", filter: `company_id=eq.${companyId}` },
        () => fetchTables()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_customers" },
        () => fetchTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchTables]);

  return { tables, loading, refetch: fetchTables };
}
