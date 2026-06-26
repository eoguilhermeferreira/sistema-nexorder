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

export default function CadastroPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    const slug = `${slugify(companyName)}-${data.user!.id.slice(0, 6)}`;

    const { error: companyError } = await supabase.from("companies").insert({
      name: companyName,
      slug,
      owner_id: data.user!.id,
      email,
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted">Cadastre sua empresa no NexOrder</p>

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

          <label className="block text-sm">
            <span className="text-muted">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
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
