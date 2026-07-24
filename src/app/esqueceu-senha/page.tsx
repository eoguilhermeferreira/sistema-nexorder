"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);

    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <div className="mb-3 text-4xl">✉️</div>
          <h1 className="text-xl font-semibold text-foreground">E-mail enviado!</h1>
          <p className="mt-2 text-sm text-muted">
            Enviamos um link para <strong className="text-foreground">{email}</strong> para redefinir sua senha. Verifique sua caixa de entrada.
          </p>
          <Link href="/login" className="mt-6 block text-sm text-foreground underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Esqueceu a senha?</h1>
        <p className="mt-1 text-sm text-muted">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Lembrou a senha?{" "}
          <Link href="/login" className="text-foreground underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
