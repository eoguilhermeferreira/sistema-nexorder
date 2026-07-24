"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  { value: "pizzaria", label: "🍕 Pizzaria" },
  { value: "lanchonete", label: "🍔 Lanchonete" },
  { value: "hamburgueria", label: "🍔 Hamburgueria" },
  { value: "restaurante", label: "🍽️ Restaurante" },
  { value: "esfiharia", label: "🥙 Esfiharia" },
  { value: "pastelaria", label: "🥟 Pastelaria" },
  { value: "outros", label: "🏪 Outros" },
];

export default function CadastroPage() {
  const router = useRouter();
  const [nicho, setNicho] = useState("");
  const [fantasyName, setFantasyName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nicho) { setError("Selecione o tipo de estabelecimento."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes("already registered")
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar a conta."
      );
      return;
    }

    if (!data.session) {
      setLoading(false);
      setConfirmationSent(true);
      return;
    }

    const displayName = fantasyName || companyName;
    const slug = `${slugify(displayName)}-${data.user!.id.slice(0, 6)}`;

    const { error: companyError } = await supabase.from("companies").insert({
      name: companyName || fantasyName,
      fantasy_name: fantasyName || undefined,
      slug,
      owner_id: data.user!.id,
      email,
      phone: phone || undefined,
      nicho,
    });

    if (companyError) {
      setLoading(false);
      setError("Conta criada, mas houve um erro ao criar a empresa.");
      return;
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", data.user!.id)
      .single();

    if (company) {
      await supabase.from("prep_times").insert({ company_id: company.id });
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted">
            Enviamos um link de confirmação para {email}. Após confirmar, faça login para
            continuar o cadastro da sua empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted">Cadastre sua empresa no NexOrder</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Nicho selector */}
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

          <label className="block text-sm">
            <span className="text-muted">E-mail <span className="text-red-400">*</span></span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted">Senha <span className="text-red-400">*</span></span>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground placeholder:text-muted/50"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-foreground underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
