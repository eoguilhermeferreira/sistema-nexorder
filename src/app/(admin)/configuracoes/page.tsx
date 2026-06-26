"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { BusinessHours, CompanySettings, TableRestaurant } from "@/types/domain";

type Tab = "empresa" | "horarios" | "mesas" | "impressoras" | "pagamento" | "notificacoes" | "sistema";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

const weekdayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ConfiguracoesPage() {
  const company = useCompany();
  const [tab, setTab] = useState<Tab>("empresa");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>

      <div className="mt-6 flex flex-wrap gap-1 rounded-lg bg-card-hover p-1 w-fit">
        {([
          ["empresa", "Empresa"],
          ["horarios", "Horários"],
          ["mesas", "Mesas"],
          ["impressoras", "Impressoras"],
          ["pagamento", "Pagamento"],
          ["notificacoes", "Notificações"],
          ["sistema", "Sistema"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === key ? "bg-wine text-white" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "empresa" && <EmpresaTab companyId={company.id} />}
        {tab === "horarios" && <HorariosTab companyId={company.id} />}
        {tab === "mesas" && <MesasTab companyId={company.id} slug={company.slug} />}
        {tab === "impressoras" && <ImpressorasTab companyId={company.id} />}
        {tab === "pagamento" && <PagamentoTab companyId={company.id} />}
        {tab === "notificacoes" && <NotificacoesTab companyId={company.id} />}
        {tab === "sistema" && <SistemaTab companyId={company.id} />}
      </div>
    </div>
  );
}

function useCompanyRow(companyId: string) {
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        setCompany(data);
        setLoading(false);
      });
  }, [companyId]);

  return { company, setCompany, loading };
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
    >
      {saving ? "Salvando..." : "Salvar"}
    </button>
  );
}

function EmpresaTab({ companyId }: { companyId: string }) {
  const { company, setCompany, loading } = useCompanyRow(companyId);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({
        name: company.name,
        fantasy_name: company.fantasy_name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone,
        whatsapp: company.whatsapp,
        address: company.address,
        city: company.city,
        state: company.state,
        zip_code: company.zip_code,
        description: company.description,
        instagram: company.instagram,
        facebook: company.facebook,
        website: company.website,
        logo_url: company.logo_url,
        banner_url: company.banner_url,
        primary_color: company.primary_color,
        secondary_color: company.secondary_color,
        highlight_color: company.highlight_color,
        is_open: company.is_open,
      })
      .eq("id", companyId);
    setSaving(false);
  }

  if (loading || !company) return <p className="text-sm text-muted">Carregando...</p>;

  const field = (key: keyof CompanyRow, label: string, type = "text") => (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        type={type}
        value={(company[key] as string) ?? ""}
        onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
      />
    </label>
  );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field("name", "Razão social")}
        {field("fantasy_name", "Nome fantasia")}
        {field("cnpj", "CNPJ")}
        {field("email", "E-mail")}
        {field("phone", "Telefone")}
        {field("whatsapp", "WhatsApp")}
      </div>
      {field("address", "Endereço")}
      <div className="grid grid-cols-3 gap-4">
        {field("city", "Cidade")}
        {field("state", "Estado")}
        {field("zip_code", "CEP")}
      </div>
      <label className="block text-sm">
        <span className="text-muted">Descrição</span>
        <textarea
          value={company.description ?? ""}
          onChange={(e) => setCompany({ ...company, description: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
        />
      </label>
      <div className="grid grid-cols-3 gap-4">
        {field("instagram", "Instagram")}
        {field("facebook", "Facebook")}
        {field("website", "Website")}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field("logo_url", "URL do logo")}
        {field("banner_url", "URL do banner")}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field("primary_color", "Cor primária", "color")}
        {field("secondary_color", "Cor secundária", "color")}
        {field("highlight_color", "Cor de destaque", "color")}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={company.is_open ?? false}
          onChange={(e) => setCompany({ ...company, is_open: e.target.checked })}
        />
        <span className="text-muted">Loja aberta para pedidos</span>
      </label>
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}

function HorariosTab({ companyId }: { companyId: string }) {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("business_hours")
      .select("*")
      .eq("company_id", companyId)
      .order("weekday")
      .then(({ data }) => {
        setHours((data as unknown as BusinessHours[]) ?? []);
        setLoading(false);
      });
  }, [companyId]);

  function update(weekday: number, patch: Partial<BusinessHours>) {
    setHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all(
      hours.map((h) =>
        supabase
          .from("business_hours")
          .update({ opens_at: h.opens_at, closes_at: h.closes_at, closed: h.closed })
          .eq("id", h.id)
      )
    );
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-xl space-y-2">
      {hours.map((h) => (
        <div key={h.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <span className="w-24 text-sm text-foreground">{weekdayLabels[h.weekday]}</span>
          <input
            type="time"
            value={h.opens_at ?? ""}
            disabled={h.closed}
            onChange={(e) => update(h.weekday, { opens_at: e.target.value })}
            className="rounded-lg border border-border bg-card-hover px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
          <span className="text-muted">às</span>
          <input
            type="time"
            value={h.closes_at ?? ""}
            disabled={h.closed}
            onChange={(e) => update(h.weekday, { closes_at: e.target.value })}
            className="rounded-lg border border-border bg-card-hover px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
          <label className="ml-auto flex items-center gap-1 text-xs text-muted">
            <input type="checkbox" checked={h.closed} onChange={(e) => update(h.weekday, { closed: e.target.checked })} />
            Fechado
          </label>
        </div>
      ))}
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}

function MesasTab({ companyId, slug }: { companyId: string; slug: string }) {
  const [tables, setTables] = useState<TableRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState("5");

  async function fetchTables() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tables_restaurant")
      .select("*")
      .eq("company_id", companyId)
      .order("number");
    setTables((data as unknown as TableRestaurant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTables();
  }, [companyId]);

  async function generateTables() {
    const n = Number(count);
    if (!n) return;
    const supabase = createClient();
    const startAt = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    const rows = Array.from({ length: n }, (_, i) => ({ company_id: companyId, number: startAt + i }));
    await supabase.from("tables_restaurant").insert(rows);
    fetchTables();
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-24 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        <button onClick={generateTables} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">
          Gerar Mesas
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tables.map((table) => {
          const url =
            typeof window !== "undefined"
              ? `${window.location.origin}/cardapio/${slug}/mesa/${table.number}`
              : `/cardapio/${slug}/mesa/${table.number}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;
          return (
            <div key={table.id} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">Mesa {table.number}</p>
              <img src={qrUrl} alt={`QR mesa ${table.number}`} className="h-20 w-20 rounded bg-white p-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpressorasTab({ companyId }: { companyId: string }) {
  const { company, setCompany, loading } = useCompanyRow(companyId);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({
        printer_name: company.printer_name,
        print_copies: company.print_copies,
        auto_print: company.auto_print,
      })
      .eq("id", companyId);
    setSaving(false);
  }

  if (loading || !company) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-md space-y-4">
      <label className="block text-sm">
        <span className="text-muted">Nome da impressora</span>
        <input
          value={company.printer_name ?? ""}
          onChange={(e) => setCompany({ ...company, printer_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Cópias por pedido</span>
        <input
          type="number"
          value={company.print_copies ?? 1}
          onChange={(e) => setCompany({ ...company, print_copies: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-foreground"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={company.auto_print ?? false}
          onChange={(e) => setCompany({ ...company, auto_print: e.target.checked })}
        />
        <span className="text-muted">Imprimir automaticamente novos pedidos</span>
      </label>
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}

function useCompanySettings(companyId: string) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .single()
      .then(({ data }) => {
        setSettings(data as unknown as CompanySettings);
        setLoading(false);
      });
  }, [companyId]);

  return { settings, setSettings, loading };
}

const paymentOptions = ["dinheiro", "pix", "cartao_credito", "cartao_debito"];
const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
};

function PagamentoTab({ companyId }: { companyId: string }) {
  const { settings, setSettings, loading } = useCompanySettings(companyId);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("company_settings")
      .update({
        payment_methods: settings.payment_methods,
        ask_change_for_cash: settings.ask_change_for_cash,
      })
      .eq("company_id", companyId);
    setSaving(false);
  }

  if (loading || !settings) return <p className="text-sm text-muted">Carregando...</p>;

  function toggleMethod(method: string) {
    const current = settings!;
    const methods = current.payment_methods.includes(method)
      ? current.payment_methods.filter((m) => m !== method)
      : [...current.payment_methods, method];
    setSettings({ ...current, payment_methods: methods });
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        {paymentOptions.map((method) => (
          <label key={method} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.payment_methods.includes(method)} onChange={() => toggleMethod(method)} />
            <span className="text-muted">{paymentLabels[method]}</span>
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.ask_change_for_cash}
          onChange={(e) => setSettings({ ...settings, ask_change_for_cash: e.target.checked })}
        />
        <span className="text-muted">Perguntar troco para pagamentos em dinheiro</span>
      </label>
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}

const notificationOptions = [
  ["novo_pedido", "Novo pedido recebido"],
  ["pedido_pronto", "Pedido pronto"],
  ["pedido_cancelado", "Pedido cancelado"],
];

function NotificacoesTab({ companyId }: { companyId: string }) {
  const { settings, setSettings, loading } = useCompanySettings(companyId);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("company_settings").update({ notifications: settings.notifications }).eq("company_id", companyId);
    setSaving(false);
  }

  if (loading || !settings) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-md space-y-3">
      {notificationOptions.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!settings.notifications[key]}
            onChange={(e) =>
              setSettings({ ...settings, notifications: { ...settings.notifications, [key]: e.target.checked } })
            }
          />
          <span className="text-muted">{label}</span>
        </label>
      ))}
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}

function SistemaTab({ companyId }: { companyId: string }) {
  const { settings, setSettings, loading } = useCompanySettings(companyId);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("company_settings").update({ realtime_enabled: settings.realtime_enabled }).eq("company_id", companyId);
    setSaving(false);
  }

  if (loading || !settings) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-md space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.realtime_enabled}
          onChange={(e) => setSettings({ ...settings, realtime_enabled: e.target.checked })}
        />
        <span className="text-muted">Atualizações em tempo real</span>
      </label>
      <SaveButton onClick={save} saving={saving} />
    </div>
  );
}
