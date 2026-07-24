"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cozinha", label: "Cozinha" },
  { href: "/retiradas", label: "Retiradas" },
  { href: "/entregas", label: "Entregas" },
  { href: "/mesas", label: "Mesas" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
];

interface SidebarProps {
  companyName: string;
  badges?: Partial<Record<string, number>>;
}

export function Sidebar({ companyName, badges = {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6">
      <div>
        <p className="text-lg font-semibold text-foreground">NexOrder</p>
        <p className="text-xs text-muted">Gestão Inteligente de Pedidos</p>
      </div>

      <div className="mt-6 rounded-lg bg-card-hover px-3 py-2">
        <span className="truncate text-sm font-medium text-foreground">{companyName}</span>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {menuItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const badge = badges[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-wine text-white"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <span>{item.label}</span>
              {!!badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-card-hover hover:text-foreground"
      >
        Sair
      </button>
    </aside>
  );
}
