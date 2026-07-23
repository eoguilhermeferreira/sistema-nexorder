"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CaixaSession {
  id: string;
  company_id: string;
  opened_at: string;
  closed_at: string | null;
  faturamento: number | null;
}

export function useCaixa(companyId: string) {
  const [caixa, setCaixa] = useState<CaixaSession | null | undefined>(undefined);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("caixa_sessions")
      .select("*")
      .eq("company_id", companyId)
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCaixa((data as CaixaSession) ?? null);
  }, [companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function abrir() {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("caixa_sessions")
      .insert({ company_id: companyId })
      .select()
      .single();
    setCaixa(data as CaixaSession);
  }

  async function fechar(faturamento: number) {
    if (!caixa) return;
    const supabase = createClient();
    await (supabase as any)
      .from("caixa_sessions")
      .update({ closed_at: new Date().toISOString(), faturamento })
      .eq("id", caixa.id);
    setCaixa(null);
  }

  return { caixa, isOpen: !!caixa, loading: caixa === undefined, abrir, fechar, refetch: fetch };
}
