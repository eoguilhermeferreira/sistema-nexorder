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

function ImageUpload({
  label,
  hint,
  currentUrl,
  onUploaded,
  companyId,
  field,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  companyId: string;
  field: "logo" | "banner";
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Apenas imagens são aceitas."); return; }
    setUploading(true); setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${field}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-images").upload(path, file, { upsert: true });
    if (upErr) { setError("Erro ao enviar imagem."); setUploading(false); return; }
    const { data } = supabase.storage.from("company-images").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
          dragging ? "border-wine bg-wine/5" : "border-border bg-card-hover hover:border-wine/50"
        }`}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={label}
            className={`rounded-lg object-cover ${field === "logo" ? "h-20 w-20" : "h-20 w-full"}`}
          />
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs text-muted text-center px-4">
              {uploading ? "Enviando..." : "Arraste a imagem aqui ou clique para selecionar"}
            </p>
          </>
        )}
        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileChange} />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <p className="text-sm text-muted">Enviando...</p>
          </div>
        )}
      </label>
      {currentUrl && (
        <p className="text-xs text-muted truncate">{currentUrl}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const COLOR_DEFAULTS: Record<string, string> = {
  primary: "#7c1f3d",
  secondary: "#93234a",
  highlight: "#e11d48",
};

function ColorPicker({
  label,
  colorKey,
  value,
  onChange,
}: {
  label: string;
  colorKey: "primary" | "secondary" | "highlight";
  value: string | null;
  onChange: (v: string) => void;
}) {
  const safeVal = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : COLOR_DEFAULTS[colorKey];

  function handleChange(v: string) {
    // only update if valid full hex
    onChange(v.startsWith("#") ? v : "#" + v);
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeVal}
          onChange={(e) => handleChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border border-border p-0.5"
          style={{ backgroundColor: safeVal }}
        />
        <input
          type="text"
          value={safeVal}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={7}
          className="w-28 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground font-mono"
        />
        <div className="h-8 w-8 rounded-xl border border-border shadow-sm" style={{ backgroundColor: safeVal }} />
      </div>
    </div>
  );
}

function EmpresaTab({ companyId }: { companyId: string }) {
  const { company, setCompany, loading } = useCompanyRow(companyId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    <div className="max-w-2xl space-y-6">
      {/* imagens */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Imagens do estabelecimento</h3>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Logo / Foto de perfil"
            hint="Recomendado: 400 × 400 px"
            currentUrl={company.logo_url}
            companyId={companyId}
            field="logo"
            onUploaded={(url) => setCompany({ ...company, logo_url: url })}
          />
          <ImageUpload
            label="Capa / Banner"
            hint="Recomendado: 1200 × 400 px"
            currentUrl={company.banner_url}
            companyId={companyId}
            field="banner"
            onUploaded={(url) => setCompany({ ...company, banner_url: url })}
          />
        </div>
      </div>

      {/* dados gerais */}
      {field("fantasy_name", "Nome da empresa")}
      <div className="grid grid-cols-3 gap-4">
        {field("instagram", "Instagram")}
        {field("facebook", "Facebook")}
        {field("website", "Website")}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={company.is_open ?? false}
          onChange={(e) => setCompany({ ...company, is_open: e.target.checked })}
        />
        <span className="text-muted">Loja aberta para pedidos</span>
      </label>
      <button
        onClick={save}
        disabled={saving}
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${saved ? "bg-green-600" : "bg-wine hover:bg-wine-hover"}`}
      >
        {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
      </button>
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
