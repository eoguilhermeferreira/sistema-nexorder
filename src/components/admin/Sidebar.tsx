"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/cozinha", label: "Cozinha", icon: "👨‍🍳" },
  { href: "/retiradas", label: "Retiradas", icon: "🛍" },
  { href: "/entregas", label: "Entregas", icon: "🛵" },
  { href: "/mesas", label: "Mesas", icon: "🍽" },
  { href: "/cardapio", label: "Cardápio", icon: "📖" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙" },
];

interface SidebarProps {
  companyName: string;
  companyEmoji?: string;
  badges?: Partial<Record<string, number>>;
}

export function Sidebar({ companyName, companyEmoji = "🍕", badges = {} }: SidebarProps) {
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
        <p className="text-lg font-semibold text-foreground">FoodNex</p>
        <p className="text-xs text-muted">Gestão Inteligente de Pedidos</p>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg bg-card-hover px-3 py-2">
        <span className="text-lg">{companyEmoji}</span>
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
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
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
        className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
      >
        <span>🚪</span>
        <span>Sair</span>
      </button>
    </aside>
  );
}
