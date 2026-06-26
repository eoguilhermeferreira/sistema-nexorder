"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const slug = `${slugify(companyName)}-${user.id.slice(0, 6)}`;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName,
        slug,
        owner_id: user.id,
        email: user.email,
      })
      .select("id")
      .single();

    if (companyError || !company) {
      setLoading(false);
      setError("Não foi possível criar a empresa. Tente novamente.");
      return;
    }

    await supabase.from("prep_times").insert({ company_id: company.id });

    setLoading(false);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Quase lá!</h1>
        <p className="mt-1 text-sm text-muted">Cadastre o nome da sua empresa para continuar</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-muted">Nome da empresa</span>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            {loading ? "Criando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
