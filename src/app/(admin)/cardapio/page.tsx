"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, CategorySize, Addon, Flavor, Product } from "@/types/domain";

type Tab = "categorias" | "adicionais" | "produtos";

export default function CardapioPage() {
  const company = useCompany();
  const [tab, setTab] = useState<Tab>("categorias");

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

      <div className="mt-6 flex gap-1 rounded-lg bg-card-hover p-1 w-fit">
        {(["categorias", "adicionais", "produtos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t === "categorias" ? "Categorias" : t === "adicionais" ? "Adicionais" : "Produtos"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "categorias" && <CategoriasTab companyId={company.id} />}
        {tab === "adicionais" && <AdicionaisTab companyId={company.id} />}
        {tab === "produtos" && <ProdutosTab companyId={company.id} />}
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
          {selectedCat.is_pizza && <TamanhosSection categoryId={selectedCatId} />}
          <AdicionaisSection companyId={companyId} categoryId={selectedCatId} />
        </>
      )}
    </div>
  );
}

function TamanhosSection({ categoryId }: { categoryId: string }) {
  const [sizes, setSizes] = useState<CategorySize[]>([]);
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

  useEffect(() => { load(); }, [categoryId]);

  async function addSize() {
    if (!name.trim() || !price) return;
    setSaving(true);
    const supabase = createClient();
    const maxOrder = sizes.length > 0 ? Math.max(...sizes.map((s) => s.display_order)) + 1 : 0;
    await (supabase as any).from("category_sizes").insert({ category_id: categoryId, name: name.trim(), price: Number(price), max_flavors: Number(maxFlavors), display_order: maxOrder });
    setName(""); setPrice(""); setMaxFlavors("2"); setSaving(false); load();
  }

  async function saveEdit(id: string) {
    await (createClient() as any).from("category_sizes").update({ name: editName.trim(), price: Number(editPrice), max_flavors: Number(editMaxFlavors) }).eq("id", id);
    setEditId(null); load();
  }

  async function deleteSize(id: string) {
    await (createClient() as any).from("category_sizes").delete().eq("id", id);
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Tamanhos</h3>
      <div className="grid grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Grande" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço (R$)" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={maxFlavors} onChange={(e) => setMaxFlavors(e.target.value)} type="number" min="1" placeholder="Máx sabores" className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
      </div>
      <button onClick={addSize} disabled={saving || !name.trim() || !price} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">Adicionar tamanho</button>
      <div className="space-y-2">
        {sizes.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === s.id ? (
              <div className="grid grid-cols-3 gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editMaxFlavors} onChange={(e) => setEditMaxFlavors(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <div className="col-span-3 flex gap-2">
                  <button onClick={() => saveEdit(s.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white">Salvar</button>
                  <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <span className="ml-3 text-sm text-muted">{formatCurrency(s.price)}</span>
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
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function load() {
    const { data } = await (createClient() as any).from("addons").select("*").eq("company_id", companyId).eq("category_id", categoryId).order("name");
    setAddons((data as Addon[]) ?? []);
  }

  useEffect(() => { load(); }, [categoryId]);

  async function addAddon() {
    if (!name.trim()) return;
    setSaving(true);
    await (createClient() as any).from("addons").insert({ company_id: companyId, category_id: categoryId, name: name.trim(), price: price ? Number(price) : 0, active: true });
    setName(""); setPrice(""); setSaving(false); load();
  }

  async function saveEdit(id: string) {
    await createClient().from("addons").update({ name: editName.trim(), price: Number(editPrice) }).eq("id", id);
    setEditId(null); load();
  }

  async function deleteAddon(id: string) {
    await createClient().from("addons").delete().eq("id", id);
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Adicionais</h3>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Borda Catupiry, Bacon extra" className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço" className="w-28 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addAddon} disabled={saving || !name.trim()} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">Adicionar</button>
      </div>
      <div className="space-y-2">
        {addons.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === a.id ? (
              <div className="flex gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <button onClick={() => saveEdit(a.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white">Salvar</button>
                <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{a.name}</span>
                  {a.price > 0 && <span className="ml-3 text-sm text-muted">+{formatCurrency(a.price)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(a.id); setEditName(a.name); setEditPrice(String(a.price)); }} className="text-xs text-muted hover:text-foreground">Editar</button>
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

  // form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");

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
    setEditId(null);
    setName(""); setDescription(""); setPrice("");
  }, [selectedCatId, categories]);

  async function addItem() {
    if (!name.trim() || !selectedCat) return;
    setSaving(true);
    if (selectedCat.is_pizza) {
      const ingredients = description.trim()
        ? description.split(",").map((s) => ({ name: s.trim(), removable: true })).filter((i) => i.name)
        : [];
      await (createClient() as any).from("flavors").insert({ company_id: companyId, category_id: selectedCatId, name: name.trim(), ingredients, available: true });
    } else {
      await createClient().from("products").insert({
        company_id: companyId, category_id: selectedCatId, product_type: "comum",
        name: name.trim(), description: description.trim() || null,
        base_price: price ? Number(price) : 0, active: true,
      });
    }
    setName(""); setDescription(""); setPrice("");
    setSaving(false);
    loadItems(selectedCatId, selectedCat.is_pizza);
  }

  async function saveEdit() {
    if (!editId || !selectedCat) return;
    if (selectedCat.is_pizza) {
      const ingredients = editDescription.trim()
        ? editDescription.split(",").map((s) => ({ name: s.trim(), removable: true })).filter((i) => i.name)
        : [];
      await (createClient() as any).from("flavors").update({ name: editName.trim(), ingredients }).eq("id", editId);
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
    if (selectedCat?.is_pizza) {
      const f = item as Flavor;
      setEditDescription((f.ingredients ?? []).map((i) => i.name).join(", "));
      setEditPrice("");
    } else {
      const p = item as Product;
      setEditDescription(p.description ?? "");
      setEditPrice(String(p.base_price));
    }
  }

  if (loadingCats) return <p className="text-sm text-muted">Carregando...</p>;
  if (categories.length === 0) return <p className="text-sm text-muted">Crie categorias primeiro.</p>;

  const isPizza = selectedCat?.is_pizza ?? false;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm font-medium text-foreground">Categoria</label>
        <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* add form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {isPizza ? "Novo sabor" : "Novo produto"}
        </h3>
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
          placeholder={isPizza ? "Ingredientes separados por vírgula (ex: muçarela, alho, tomate, parmesão)" : "Ingredientes / descrição (ex: carne moída, cebola, tomate)"}
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        {!isPizza && (
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number" min="0" step="0.01"
            placeholder="Preço (R$)"
            className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          />
        )}
        <button onClick={addItem} disabled={saving || !name.trim()} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">
          Adicionar
        </button>
      </div>

      {/* list */}
      {loadingItems ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted">Nenhum item cadastrado.</p>}
          {items.map((item) => {
            const desc = isPizza
              ? ((item as Flavor).ingredients ?? []).map((i) => i.name).join(", ")
              : (item as Product).description ?? "";
            const itemPrice = isPizza ? null : (item as Product).base_price;

            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                {editId === item.id ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    {!isPizza && (
                      <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
                    )}
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-white">Salvar</button>
                      <button onClick={() => setEditId(null)} className="rounded-lg bg-card-hover px-3 py-1.5 text-xs text-muted">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
                      {itemPrice != null && <p className="mt-1 text-sm font-semibold text-wine">{formatCurrency(itemPrice)}</p>}
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
