"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, CategorySize, Addon, Flavor, Product, FlavorSizePrice } from "@/types/domain";

type Tab = "categorias" | "adicionais" | "produtos" | "disponibilidade";

export default function CardapioPage() {
  const company = useCompany();
  const [tab, setTab] = useState<Tab>("categorias");
  const [copied, setCopied] = useState(false);

  const cardapioUrl = typeof window !== "undefined"
    ? `${window.location.origin}/cardapio/${company.slug}`
    : `/cardapio/${company.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(cardapioUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Cardápio</h1>
        <a
          href={`/cardapio/${company.slug}`}
          target="_blank"
          className="rounded-lg bg-card-hover px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Ver cardápio →
        </a>
      </div>

      {/* shareable link */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted mb-0.5">Link do cardápio para clientes</p>
          <p className="truncate text-sm text-foreground font-mono">{cardapioUrl}</p>
        </div>
        <button
          onClick={copyLink}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            copied ? "bg-green-500/20 text-green-400" : "bg-wine text-white hover:bg-wine-hover"
          }`}
        >
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg bg-card-hover p-1 w-fit">
        {(["categorias", "adicionais", "produtos", "disponibilidade"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t === "categorias" ? "Categorias" : t === "adicionais" ? "Adicionais" : t === "produtos" ? "Produtos" : "Disponibilidade"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "categorias" && <CategoriasTab companyId={company.id} />}
        {tab === "adicionais" && <AdicionaisTab companyId={company.id} />}
        {tab === "produtos" && <ProdutosTab companyId={company.id} />}
        {tab === "disponibilidade" && <DisponibilidadeTab companyId={company.id} />}
      </div>
    </div>
  );
}

// ─── Categorias Tab ───────────────────────────────────────────────────────────

function CategoriasTab({ companyId }: { companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [isPizza, setIsPizza] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsPizza, setEditIsPizza] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("display_order");
    setCategories((data as unknown as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [companyId]);

  async function addCategory() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.display_order)) + 1 : 0;
    await (supabase.from("categories") as any).insert({
      company_id: companyId,
      name: name.trim(),
      is_pizza: isPizza,
      pricing_mode: "fixed",
      display_order: maxOrder,
      active: true,
    });
    setName("");
    setIsPizza(false);
    setSaving(false);
    load();
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await (supabase.from("categories") as any).update({ name: editName.trim(), is_pizza: editIsPizza }).eq("id", id);
    setEditId(null);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Apagar categoria?")) return;
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Nova categoria</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Pizza, Esfirra, Bebidas"
            className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
          <input type="checkbox" checked={isPizza} onChange={(e) => setIsPizza(e.target.checked)} className="rounded" />
          Tem tamanhos
        </label>
      </div>

      <div className="space-y-2">
        {categories.length === 0 && <p className="text-sm text-muted">Nenhuma categoria cadastrada.</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-border bg-card p-4">
            {editId === cat.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
                  <input type="checkbox" checked={editIsPizza} onChange={(e) => setEditIsPizza(e.target.checked)} className="rounded" />
                  Tem tamanhos
                </label>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(cat.id)} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white hover:bg-wine-hover">Salvar</button>
                  <button onClick={() => setEditId(null)} className="rounded-lg bg-card-hover px-3 py-1.5 text-xs text-muted hover:text-foreground">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  {cat.is_pizza && <p className="text-xs text-muted">Com tamanhos</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditIsPizza(cat.is_pizza); }} className="text-xs text-muted hover:text-foreground">Editar</button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-400 hover:text-red-300">Apagar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Disponibilidade Tab ──────────────────────────────────────────────────────

function DisponibilidadeTab({ companyId }: { companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [catsRes, flavorsRes, productsRes] = await Promise.all([
      supabase.from("categories").select("*").eq("company_id", companyId).order("display_order"),
      (supabase as any).from("flavors").select("*").eq("company_id", companyId).order("name"),
      supabase.from("products").select("*").eq("company_id", companyId).order("name"),
    ]);
    setCategories((catsRes.data as unknown as Category[]) ?? []);
    setFlavors((flavorsRes.data as Flavor[]) ?? []);
    setProducts((productsRes.data as unknown as Product[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [companyId]);

  async function toggleCategory(cat: Category) {
    await (createClient() as any).from("categories").update({ available: !cat.available }).eq("id", cat.id);
    load();
  }

  async function toggleFlavor(flavor: Flavor) {
    await (createClient() as any).from("flavors").update({ available: !flavor.available }).eq("id", flavor.id);
    load();
  }

  async function toggleProduct(product: Product) {
    await createClient().from("products").update({ active: !product.active } as any).eq("id", product.id);
    load();
  }

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${on ? "bg-wine" : "bg-border"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    );
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-sm text-muted">
        Desative categorias ou itens que estão temporariamente indisponíveis. Continuam visíveis no cardápio mas aparecem cinzas com "Indisponível no momento".
      </p>

      {categories.map((cat) => {
        const catFlavors = flavors.filter((f) => (f as any).category_id === cat.id);
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const items = cat.is_pizza ? catFlavors : catProducts;

        return (
          <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* category toggle */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className={`text-sm font-semibold ${!cat.available ? "text-muted line-through" : "text-foreground"}`}>
                  {cat.name}
                </p>
                {!cat.available && <p className="text-xs text-yellow-500">Categoria inteira desativada</p>}
              </div>
              <Toggle on={cat.available} onToggle={() => toggleCategory(cat)} />
            </div>

            {/* individual items */}
            {items.length > 0 && (
              <div className="border-t border-border divide-y divide-border bg-card-hover">
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  {cat.is_pizza ? "Sabores" : "Produtos"}
                </p>
                {cat.is_pizza
                  ? catFlavors.map((flavor) => (
                      <div key={flavor.id} className="flex items-center justify-between px-4 py-2.5">
                        <p className={`text-sm ${!flavor.available ? "text-muted line-through" : "text-foreground"}`}>
                          {flavor.name}
                        </p>
                        <Toggle on={flavor.available} onToggle={() => toggleFlavor(flavor)} />
                      </div>
                    ))
                  : catProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
                        <p className={`text-sm ${!product.active ? "text-muted line-through" : "text-foreground"}`}>
                          {product.name}
                        </p>
                        <Toggle on={product.active} onToggle={() => toggleProduct(product)} />
                      </div>
                    ))}
              </div>
            )}
          </div>
        );
      })}

      {categories.length === 0 && <p className="text-sm text-muted">Nenhuma categoria cadastrada.</p>}
    </div>
  );
}

// ─── Adicionais Tab ───────────────────────────────────────────────────────────

function AdicionaisTab({ companyId }: { companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("categories").select("*").eq("company_id", companyId).order("display_order").then(({ data }) => {
      const cats = (data as unknown as Category[]) ?? [];
      setCategories(cats);
      if (cats.length > 0) setSelectedCatId(cats[0].id);
      setLoading(false);
    });
  }, [companyId]);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (categories.length === 0) return <p className="text-sm text-muted">Crie categorias primeiro.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm font-medium text-foreground">Categoria</label>
        <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedCat && (
        <>
          {selectedCat.is_pizza && <TamanhosSection category={selectedCat} />}
          <AdicionaisSection companyId={companyId} categoryId={selectedCatId} />
        </>
      )}
    </div>
  );
}

function TamanhosSection({ category }: { category: Category }) {
  const categoryId = category.id;
  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [pricingMode, setPricingMode] = useState<"fixed" | "per_flavor">(category.pricing_mode ?? "fixed");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [maxFlavors, setMaxFlavors] = useState("2");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMaxFlavors, setEditMaxFlavors] = useState("2");

  async function load() {
    const supabase = createClient();
    const { data } = await (supabase as any).from("category_sizes").select("*").eq("category_id", categoryId).order("display_order");
    setSizes((data as CategorySize[]) ?? []);
  }

  useEffect(() => {
    setPricingMode(category.pricing_mode ?? "fixed");
    load();
  }, [categoryId]);

  async function savePricingMode(mode: "fixed" | "per_flavor") {
    setPricingMode(mode);
    await (createClient() as any).from("categories").update({ pricing_mode: mode }).eq("id", categoryId);
  }

  async function addSize() {
    if (!name.trim()) return;
    if (pricingMode === "fixed" && !price) return;
    setSaving(true);
    const supabase = createClient();
    const maxOrder = sizes.length > 0 ? Math.max(...sizes.map((s) => s.display_order)) + 1 : 0;
    await (supabase as any).from("category_sizes").insert({
      category_id: categoryId,
      name: name.trim(),
      price: pricingMode === "fixed" ? Number(price) : 0,
      max_flavors: Number(maxFlavors),
      display_order: maxOrder,
    });
    setName(""); setPrice(""); setMaxFlavors("2"); setSaving(false); load();
  }

  async function saveEdit(id: string) {
    await (createClient() as any).from("category_sizes").update({ name: editName.trim(), price: pricingMode === "fixed" ? Number(editPrice) : 0, max_flavors: Number(editMaxFlavors) }).eq("id", id);
    setEditId(null); load();
  }

  async function deleteSize(id: string) {
    await (createClient() as any).from("category_sizes").delete().eq("id", id);
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Tamanhos</h3>

      {/* pricing mode toggle */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">Modelo de preço</p>
        <div className="flex gap-2">
          <button
            onClick={() => savePricingMode("fixed")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pricingMode === "fixed" ? "bg-wine text-white" : "bg-card-hover text-muted hover:text-foreground"}`}
          >
            Preço fixo por tamanho
          </button>
          <button
            onClick={() => savePricingMode("per_flavor")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pricingMode === "per_flavor" ? "bg-wine text-white" : "bg-card-hover text-muted hover:text-foreground"}`}
          >
            Preço por sabor
          </button>
        </div>
        {pricingMode === "per_flavor" && (
          <p className="mt-1.5 text-xs text-muted">O preço será o do sabor mais caro entre os selecionados.</p>
        )}
      </div>

      {/* add size */}
      <div className={`grid gap-2 ${pricingMode === "fixed" ? "grid-cols-3" : "grid-cols-2"}`}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Grande" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        {pricingMode === "fixed" && (
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço (R$)" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        )}
        <input value={maxFlavors} onChange={(e) => setMaxFlavors(e.target.value)} type="number" min="1" placeholder="Máx sabores" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
      </div>
      <button onClick={addSize} disabled={saving || !name.trim() || (pricingMode === "fixed" && !price)} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">
        Adicionar tamanho
      </button>

      <div className="space-y-2">
        {sizes.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === s.id ? (
              <div className={`grid gap-2 ${pricingMode === "fixed" ? "grid-cols-3" : "grid-cols-2"}`}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                {pricingMode === "fixed" && (
                  <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                )}
                <input value={editMaxFlavors} onChange={(e) => setEditMaxFlavors(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <div className="col-span-full flex gap-2">
                  <button onClick={() => saveEdit(s.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white">Salvar</button>
                  <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  {pricingMode === "fixed" && <span className="ml-3 text-sm text-muted">{formatCurrency(s.price)}</span>}
                  <span className="ml-3 text-xs text-muted">até {s.max_flavors} sabor(es)</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(s.id); setEditName(s.name); setEditPrice(String(s.price)); setEditMaxFlavors(String(s.max_flavors)); }} className="text-xs text-muted hover:text-foreground">Editar</button>
                  <button onClick={() => deleteSize(s.id)} className="text-xs text-red-400">Apagar</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {sizes.length === 0 && <p className="text-sm text-muted">Nenhum tamanho cadastrado.</p>}
      </div>
    </div>
  );
}

function AdicionaisSection({ companyId, categoryId }: { companyId: string; categoryId: string }) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  // per-size price editing
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, { half: string; whole: string }>>({});

  async function load() {
    const supabase = createClient();
    const [addonsRes, sizesRes] = await Promise.all([
      (supabase as any).from("addons").select("*").eq("company_id", companyId).eq("category_id", categoryId).order("name"),
      (supabase as any).from("category_sizes").select("*").eq("category_id", categoryId).order("display_order"),
    ]);
    setAddons((addonsRes.data as Addon[]) ?? []);
    setSizes((sizesRes.data as CategorySize[]) ?? []);
  }

  useEffect(() => { load(); }, [categoryId]);

  async function addAddon() {
    if (!name.trim()) return;
    setSaving(true);
    await (createClient() as any).from("addons").insert({ company_id: companyId, category_id: categoryId, name: name.trim(), price: price ? Number(price) : 0, active: true });
    setName(""); setPrice(""); setSaving(false); load();
  }

  async function saveEdit(id: string) {
    await (createClient() as any).from("addons").update({ name: editName.trim(), price: editPrice ? Number(editPrice) : 0 }).eq("id", id);
    setEditId(null); load();
  }

  async function deleteAddon(id: string) {
    await createClient().from("addons").delete().eq("id", id);
    load();
  }

  async function openPriceEdit(addonId: string) {
    setEditId(null);
    setPriceEditId(addonId);
    const { data } = await (createClient() as any).from("addon_size_prices").select("*").eq("addon_id", addonId);
    const rows = (data ?? []) as { size_id: string; price_half: number; price_whole: number }[];
    const inputs: Record<string, { half: string; whole: string }> = {};
    for (const s of sizes) {
      const existing = rows.find((r) => r.size_id === s.id);
      inputs[s.id] = { half: existing ? String(existing.price_half) : "", whole: existing ? String(existing.price_whole) : "" };
    }
    setPriceInputs(inputs);
  }

  async function savePrices() {
    if (!priceEditId) return;
    const upserts = sizes
      .filter((s) => priceInputs[s.id]?.whole !== "" || priceInputs[s.id]?.half !== "")
      .map((s) => ({
        addon_id: priceEditId,
        size_id: s.id,
        price_half: Number(priceInputs[s.id]?.half || 0),
        price_whole: Number(priceInputs[s.id]?.whole || 0),
      }));
    await (createClient() as any).from("addon_size_prices").upsert(upserts, { onConflict: "addon_id,size_id" });
    setPriceEditId(null);
  }

  const hasSizes = sizes.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Adicionais</h3>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bacon extra, Queijo duplo" className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="R$" className="w-24 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addAddon} disabled={saving || !name.trim()} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">Adicionar</button>
      </div>
      <div className="space-y-2">
        {addons.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === a.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground" />
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço (R$)" className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(a.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white">Salvar</button>
                  <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted">Cancelar</button>
                </div>
              </div>
            ) : priceEditId === a.id ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{a.name} — Preços por tamanho</p>
                {!hasSizes ? (
                  <p className="text-xs text-muted">Cadastre tamanhos primeiro na seção acima.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted mb-1">
                      <span>Tamanho</span><span>Metade (R$)</span><span>Inteira (R$)</span>
                    </div>
                    {sizes.map((s) => (
                      <div key={s.id} className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-sm text-foreground">{s.name}</span>
                        <input
                          value={priceInputs[s.id]?.half ?? ""}
                          onChange={(e) => setPriceInputs((prev) => ({ ...prev, [s.id]: { ...prev[s.id], half: e.target.value } }))}
                          type="number" min="0" step="0.01" placeholder="R$"
                          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                        />
                        <input
                          value={priceInputs[s.id]?.whole ?? ""}
                          onChange={(e) => setPriceInputs((prev) => ({ ...prev, [s.id]: { ...prev[s.id], whole: e.target.value } }))}
                          type="number" min="0" step="0.01" placeholder="R$"
                          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                        />
                      </div>
                    ))}
                  </>
                )}
                <div className="flex gap-2">
                  <button onClick={savePrices} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white">Salvar preços</button>
                  <button onClick={() => setPriceEditId(null)} className="rounded-lg bg-card px-3 py-1.5 text-xs text-muted">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{a.name}</span>
                  {a.price > 0 && <span className="ml-2 text-xs font-semibold text-wine">+{formatCurrency(a.price)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(a.id); setEditName(a.name); setEditPrice(a.price > 0 ? String(a.price) : ""); }} className="text-xs text-muted hover:text-foreground">Editar</button>
                  {hasSizes && <button onClick={() => openPriceEdit(a.id)} className="text-xs text-wine hover:underline">Preços por tamanho</button>}
                  <button onClick={() => deleteAddon(a.id)} className="text-xs text-red-400">Apagar</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {addons.length === 0 && <p className="text-sm text-muted">Nenhum adicional cadastrado.</p>}
      </div>
    </div>
  );
}

// ─── Produtos Tab ─────────────────────────────────────────────────────────────

function ProdutosTab({ companyId }: { companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [items, setItems] = useState<(Product | Flavor)[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // single add form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isSweet, setIsSweet] = useState(false);
  const [sweetSurcharge, setSweetSurcharge] = useState("");
  const [isBundle, setIsBundle] = useState(false);
  const [bundlePizzaCount, setBundlePizzaCount] = useState("2");
  const [bundleMaxFlavors, setBundleMaxFlavors] = useState("2");
  const [bundleFlavorCatId, setBundleFlavorCatId] = useState("");
  const [saving, setSaving] = useState(false);

  // bulk import
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState("");

  // edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsSweet, setEditIsSweet] = useState(false);
  const [editSweetSurcharge, setEditSweetSurcharge] = useState("");

  // per-flavor price editing
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [flavorPrices, setFlavorPrices] = useState<FlavorSizePrice[]>([]);
  const [flavorPriceInputs, setFlavorPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    createClient().from("categories").select("*").eq("company_id", companyId).order("display_order").then(({ data }) => {
      const cats = (data as unknown as Category[]) ?? [];
      setCategories(cats);
      if (cats.length > 0) setSelectedCatId(cats[0].id);
      setLoadingCats(false);
    });
  }, [companyId]);

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  async function loadItems(catId: string, isPizza: boolean) {
    setLoadingItems(true);
    if (isPizza) {
      const { data } = await (createClient() as any).from("flavors").select("*").eq("company_id", companyId).eq("category_id", catId).order("name");
      setItems((data as Flavor[]) ?? []);
    } else {
      const { data } = await createClient().from("products").select("*").eq("company_id", companyId).eq("category_id", catId).order("name");
      setItems((data as unknown as Product[]) ?? []);
    }
    setLoadingItems(false);
  }

  useEffect(() => {
    if (!selectedCatId || categories.length === 0) return;
    const cat = categories.find((c) => c.id === selectedCatId);
    if (!cat) return;
    loadItems(selectedCatId, cat.is_pizza);
    setEditId(null); setPriceEditId(null);
    setName(""); setDescription(""); setPrice("");
    setBulkMode(false); setBulkText(""); setBulkResult("");
    // load sizes for per-flavor pricing
    if (cat.is_pizza) {
      (createClient() as any).from("category_sizes").select("*").eq("category_id", selectedCatId).order("display_order").then(({ data }: any) => {
        setSizes((data as CategorySize[]) ?? []);
      });
    } else {
      setSizes([]);
    }
  }, [selectedCatId, categories]);

  async function addItem() {
    if (!name.trim() || !selectedCat) return;
    setSaving(true);
    if (selectedCat.is_pizza) {
      const ingredients = description.trim()
        ? description.split(",").map((s) => ({ name: s.trim(), removable: true })).filter((i) => i.name)
        : [];
      await (createClient() as any).from("flavors").insert({ company_id: companyId, category_id: selectedCatId, name: name.trim(), ingredients, available: true, is_sweet: isSweet, sweet_surcharge: isSweet ? Number(sweetSurcharge || 0) : 0 });
    } else {
      await (createClient() as any).from("products").insert({
        company_id: companyId, category_id: selectedCatId, product_type: "comum",
        name: name.trim(), description: description.trim() || null,
        base_price: price ? Number(price) : 0, active: true,
        bundle_pizza_count: isBundle ? Number(bundlePizzaCount) : 1,
        bundle_max_flavors: isBundle ? Number(bundleMaxFlavors) : 2,
        bundle_flavor_category_id: isBundle && bundleFlavorCatId ? bundleFlavorCatId : null,
      });
    }
    setName(""); setDescription(""); setPrice(""); setIsSweet(false); setSweetSurcharge("");
    setIsBundle(false); setBundlePizzaCount("2"); setBundleMaxFlavors("2"); setBundleFlavorCatId("");
    setSaving(false);
    loadItems(selectedCatId, selectedCat.is_pizza);
  }

  async function bulkImport() {
    if (!selectedCat?.is_pizza || !bulkText.trim()) return;
    setBulkSaving(true);
    setBulkResult("");

    // Normalize line endings (Windows \r\n → \n) then split into blocks by blank lines
    const normalized = bulkText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rawBlocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

    const rows = rawBlocks.map((block) => {
      const blockLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      // First line is always the name
      const namePart = blockLines[0];
      // Second line (if exists) is the ingredients string
      const ingLine = blockLines[1] ? blockLines[1].replace(/\.$/, "") : "";
      // Split by comma, handle last item joined by " e " (Portuguese: "tomate e azeitona")
      const rawParts = ingLine ? ingLine.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const ingredients: { name: string; removable: boolean }[] = [];
      rawParts.forEach((part, i) => {
        if (i === rawParts.length - 1 && part.includes(" e ")) {
          // last part may be "tomate e azeitona" → split into two
          part.split(" e ").map((s) => s.trim()).filter(Boolean).forEach((s) => {
            ingredients.push({ name: s, removable: true });
          });
        } else {
          ingredients.push({ name: part, removable: true });
        }
      });
      return { company_id: companyId, category_id: selectedCatId, name: namePart, ingredients, available: true };
    });

    const { error } = await (createClient() as any).from("flavors").insert(rows);
    if (error) {
      setBulkResult(`Erro: ${error.message}`);
    } else {
      setBulkResult(`${rows.length} sabor(es) importado(s) com sucesso!`);
      setBulkText("");
      loadItems(selectedCatId, true);
    }
    setBulkSaving(false);
  }

  async function saveEdit() {
    if (!editId || !selectedCat) return;
    if (selectedCat.is_pizza) {
      const ingredients = editDescription.trim()
        ? editDescription.split(",").map((s) => ({ name: s.trim(), removable: true })).filter((i) => i.name)
        : [];
      await (createClient() as any).from("flavors").update({ name: editName.trim(), ingredients, is_sweet: editIsSweet, sweet_surcharge: editIsSweet ? Number(editSweetSurcharge || 0) : 0 }).eq("id", editId);
    } else {
      await createClient().from("products").update({ name: editName.trim(), description: editDescription.trim() || null, base_price: Number(editPrice) }).eq("id", editId);
    }
    setEditId(null);
    loadItems(selectedCatId, selectedCat.is_pizza);
  }

  async function deleteItem(id: string) {
    if (!selectedCat) return;
    if (!confirm("Apagar este item?")) return;
    if (selectedCat.is_pizza) {
      await (createClient() as any).from("flavors").delete().eq("id", id);
    } else {
      await createClient().from("products").delete().eq("id", id);
    }
    loadItems(selectedCatId, selectedCat.is_pizza);
  }

  function startEdit(item: Product | Flavor) {
    setEditId(item.id);
    setEditName(item.name);
    setPriceEditId(null);
    if (selectedCat?.is_pizza) {
      const f = item as Flavor;
      setEditDescription((f.ingredients ?? []).map((i) => i.name).join(", "));
      setEditIsSweet(f.is_sweet ?? false);
      setEditSweetSurcharge(f.sweet_surcharge ? String(f.sweet_surcharge) : "");
      setEditPrice("");
    } else {
      const p = item as Product;
      setEditDescription(p.description ?? "");
      setEditPrice(String(p.base_price));
    }
  }

  async function openPriceEdit(flavorId: string) {
    setEditId(null);
    setPriceEditId(flavorId);
    const { data } = await (createClient() as any).from("flavor_size_prices").select("*").eq("flavor_id", flavorId);
    const rows = (data as FlavorSizePrice[]) ?? [];
    setFlavorPrices(rows);
    const inputs: Record<string, string> = {};
    for (const s of sizes) {
      const existing = rows.find((r) => r.size_id === s.id);
      inputs[s.id] = existing ? String(existing.price) : "";
    }
    setFlavorPriceInputs(inputs);
  }

  async function saveFlavorPrices() {
    if (!priceEditId) return;
    const upserts = sizes
      .filter((s) => flavorPriceInputs[s.id] !== "")
      .map((s) => ({ flavor_id: priceEditId, size_id: s.id, price: Number(flavorPriceInputs[s.id] || 0) }));
    await (createClient() as any).from("flavor_size_prices").upsert(upserts, { onConflict: "flavor_id,size_id" });
    setPriceEditId(null);
  }

  if (loadingCats) return <p className="text-sm text-muted">Carregando...</p>;
  if (categories.length === 0) return <p className="text-sm text-muted">Crie categorias primeiro.</p>;

  const isPizza = selectedCat?.is_pizza ?? false;
  const isPerFlavor = selectedCat?.pricing_mode === "per_flavor";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm font-medium text-foreground">Categoria</label>
        <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* add / bulk import */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {isPizza ? "Novo sabor" : "Novo produto"}
          </h3>
          {isPizza && (
            <button
              onClick={() => { setBulkMode(!bulkMode); setBulkResult(""); }}
              className="text-xs text-wine hover:underline"
            >
              {bulkMode ? "← Adicionar um" : "Importar vários de uma vez →"}
            </button>
          )}
        </div>

        {bulkMode ? (
          <>
            <p className="text-xs text-muted">
              Cole nome na primeira linha e ingredientes na segunda. Separe cada sabor com uma linha em branco:
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={12}
              placeholder={"Calabresa\nCalabresa, cebola, tomate e azeitona.\n\nMargherita\nMuçarela, parmesão, manjericão, tomate e azeitona.\n\nFrango com Catupiry\nFrango, catupiry, tomate e azeitona."}
              className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground font-mono"
            />
            {bulkResult && (
              <p className={`text-sm ${bulkResult.startsWith("Erro") ? "text-red-400" : "text-green-400"}`}>{bulkResult}</p>
            )}
            <button
              onClick={bulkImport}
              disabled={bulkSaving || !bulkText.trim()}
              className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
            >
              {bulkSaving ? "Importando..." : `Importar ${bulkText.split(/\n\s*\n/).filter((b) => b.trim()).length} sabor(es)`}
            </button>
          </>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isPizza ? "Nome do sabor (ex: Alho e Óleo)" : "Nome do produto (ex: Esfirra de Carne)"}
              className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={isPizza ? "Ingredientes separados por vírgula (ex: muçarela, alho, tomate)" : "Ingredientes / descrição"}
              className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            />
            {isPizza && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Tipo:</span>
                <button
                  type="button"
                  onClick={() => setIsSweet(false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!isSweet ? "bg-wine text-white" : "bg-card-hover text-muted"}`}
                >
                  🧀 Salgado
                </button>
                <button
                  type="button"
                  onClick={() => setIsSweet(true)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isSweet ? "bg-pink-500 text-white" : "bg-card-hover text-muted"}`}
                >
                  🍫 Doce
                </button>
              </div>
            )}
            {!isPizza && (
              <>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number" min="0" step="0.01"
                  placeholder="Preço (R$)"
                  className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
                />
                {/* Bundle toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBundle((v) => !v)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isBundle ? "bg-wine text-white" : "bg-card-hover text-muted"}`}
                  >
                    🍕 É uma Promoção (bundle de pizzas)?
                  </button>
                </div>
                {isBundle && (
                  <div className="space-y-2 rounded-xl border border-wine/30 bg-wine/5 p-3">
                    <p className="text-xs font-semibold text-wine">Configurar Promoção</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted">Qtd. de pizzas</label>
                        <input value={bundlePizzaCount} onChange={(e) => setBundlePizzaCount(e.target.value)} type="number" min="1" max="10" className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted">Max sabores por pizza</label>
                        <input value={bundleMaxFlavors} onChange={(e) => setBundleMaxFlavors(e.target.value)} type="number" min="1" max="8" className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted">Categoria de sabores</label>
                      <select value={bundleFlavorCatId} onChange={(e) => setBundleFlavorCatId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground">
                        <option value="">Selecione a categoria de pizza...</option>
                        {categories.filter((c) => c.is_pizza).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
            <button onClick={addItem} disabled={saving || !name.trim()} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">
              Adicionar
            </button>
          </>
        )}
      </div>

      {/* list */}
      {loadingItems ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted">Nenhum item cadastrado.</p>}
          {isPizza && items.length > 0 && (
            <p className="text-xs text-muted">{items.length} sabor(es) cadastrado(s)</p>
          )}
          {isPizza && (() => {
            const salgados = (items as Flavor[]).filter((f) => !f.is_sweet);
            const doces = (items as Flavor[]).filter((f) => f.is_sweet);
            const renderItem = (item: Flavor) => {
              const desc = (item.ingredients ?? []).map((i) => i.name).join(", ");
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                  {editId === item.id ? (
                    <div className="space-y-2">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Tipo:</span>
                        <button type="button" onClick={() => setEditIsSweet(false)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!editIsSweet ? "bg-wine text-white" : "bg-card-hover text-muted"}`}>🧀 Salgado</button>
                        <button type="button" onClick={() => setEditIsSweet(true)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${editIsSweet ? "bg-pink-500 text-white" : "bg-card-hover text-muted"}`}>🍫 Doce</button>
                        {editIsSweet && (
                          <input value={editSweetSurcharge} onChange={(e) => setEditSweetSurcharge(e.target.value)} type="number" min="0" step="0.01" placeholder="Acréscimo R$" className="ml-2 w-36 rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white">Salvar</button>
                        <button onClick={() => setEditId(null)} className="rounded-lg bg-card-hover px-3 py-1.5 text-xs text-muted">Cancelar</button>
                      </div>
                    </div>
                  ) : priceEditId === item.id ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">{item.name} — Preços por tamanho</p>
                      {sizes.length === 0 ? (
                        <p className="text-xs text-muted">Cadastre tamanhos primeiro na aba Adicionais.</p>
                      ) : (
                        <div className="space-y-2">
                          {sizes.map((s) => (
                            <div key={s.id} className="flex items-center gap-3">
                              <span className="w-28 text-sm text-foreground">{s.name}</span>
                              <input value={flavorPriceInputs[s.id] ?? ""} onChange={(e) => setFlavorPriceInputs((prev) => ({ ...prev, [s.id]: e.target.value }))} type="number" min="0" step="0.01" placeholder="R$" className="w-28 rounded-lg border border-border bg-card-hover px-3 py-1.5 text-sm text-foreground" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={saveFlavorPrices} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white">Salvar preços</button>
                        <button onClick={() => setPriceEditId(null)} className="rounded-lg bg-card-hover px-3 py-1.5 text-xs text-muted">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {item.is_sweet && (
                            <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-400">
                              🍫 Doce {item.sweet_surcharge > 0 ? `+${formatCurrency(item.sweet_surcharge)}` : ""}
                            </span>
                          )}
                        </div>
                        {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => startEdit(item)} className="text-xs text-muted hover:text-foreground">Editar</button>
                        <button onClick={() => openPriceEdit(item.id)} className="text-xs text-wine hover:underline">Preços</button>
                        <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400">Apagar</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            };
            return (
              <>
                {salgados.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-2">🧀 Pizzas Salgadas ({salgados.length})</p>
                    {salgados.map(renderItem)}
                  </>
                )}
                {doces.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mt-4">🍫 Pizzas Doces ({doces.length})</p>
                    {doces.map(renderItem)}
                  </>
                )}
              </>
            );
          })()}
          {!isPizza && items.map((item) => {
            const p = item as Product;
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                {editId === item.id ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white">Salvar</button>
                      <button onClick={() => setEditId(null)} className="rounded-lg bg-card-hover px-3 py-1.5 text-xs text-muted">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        {p.bundle_flavor_category_id && (
                          <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs font-medium text-wine">
                            🍕 Bundle {p.bundle_pizza_count}x pizza
                          </span>
                        )}
                      </div>
                      {p.description && <p className="mt-0.5 text-xs text-muted">{p.description}</p>}
                      <p className="mt-1 text-sm font-semibold text-wine">{formatCurrency(p.base_price)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => startEdit(item)} className="text-xs text-muted hover:text-foreground">Editar</button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400">Apagar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
