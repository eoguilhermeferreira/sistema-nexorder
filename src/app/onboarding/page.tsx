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

const nichos = [
  { value: "pizzaria", label: "Pizzaria" },
  { value: "lanchonete", label: "Lanchonete" },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "restaurante", label: "Restaurante" },
  { value: "esfiharia", label: "Esfiharia" },
  { value: "pastelaria", label: "Pastelaria" },
  { value: "outros", label: "Outros" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [nicho, setNicho] = useState("");
  const [fantasyName, setFantasyName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nicho) { setError("Selecione o tipo de estabelecimento."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const displayName = fantasyName || companyName;
    const slug = `${slugify(displayName)}-${user.id.slice(0, 6)}`;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName || fantasyName,
        fantasy_name: fantasyName || undefined,
        slug,
        owner_id: user.id,
        email: user.email,
        phone: phone || undefined,
        nicho,
      } as any)
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Quase lá!</h1>
        <p className="mt-1 text-sm text-muted">Cadastre os dados do seu estabelecimento para começar</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-sm text-muted">Tipo de estabelecimento <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {nichos.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNicho(n.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    nicho === n.value
                      ? "border-wine bg-wine/10 text-foreground font-medium"
                      : "border-border bg-card-hover text-muted hover:border-wine/50"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="text-muted">Nome fantasia <span className="text-red-400">*</span></span>
            <input
              required
              placeholder="Ex: Pizzaria do João"
              value={fantasyName}
              onChange={(e) => setFantasyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground placeholder:text-muted/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted">Razão social <span className="text-xs">(opcional)</span></span>
            <input
              placeholder="Ex: João Silva ME"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground placeholder:text-muted/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted">Telefone / WhatsApp</span>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground placeholder:text-muted/50"
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
