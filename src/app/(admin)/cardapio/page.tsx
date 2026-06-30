"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, CategorySize, Addon } from "@/types/domain";

type Tab = "categorias" | "adicionais" | "importar";

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
        {(["categorias", "adicionais", "importar"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t === "categorias" ? "Categorias" : t === "adicionais" ? "Adicionais" : "Importar Cardápio"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "categorias" && <CategoriasTab companyId={company.id} />}
        {tab === "adicionais" && <AdicionaisTab companyId={company.id} />}
        {tab === "importar" && <ImportarTab companyId={company.id} />}
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
    if (!confirm("Apagar categoria? Os produtos e sabores vinculados serão desvinculados.")) return;
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
          <input
            type="checkbox"
            checked={isPizza}
            onChange={(e) => setIsPizza(e.target.checked)}
            className="rounded"
          />
          Tem tamanhos (pizza / bordas)
        </label>
      </div>

      <div className="space-y-2">
        {categories.length === 0 && <p className="text-sm text-muted">Nenhuma categoria cadastrada.</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-border bg-card p-4">
            {editId === cat.id ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
                />
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
                  <button
                    onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditIsPizza(cat.is_pizza); }}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Editar
                  </button>
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
    supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("display_order")
      .then(({ data }) => {
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
        <select
          value={selectedCatId}
          onChange={(e) => setSelectedCatId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
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
    const { data } = await (supabase as any)
      .from("category_sizes")
      .select("*")
      .eq("category_id", categoryId)
      .order("display_order");
    setSizes((data as CategorySize[]) ?? []);
  }

  useEffect(() => { load(); }, [categoryId]);

  async function addSize() {
    if (!name.trim() || !price) return;
    setSaving(true);
    const supabase = createClient();
    const maxOrder = sizes.length > 0 ? Math.max(...sizes.map((s) => s.display_order)) + 1 : 0;
    await (supabase as any).from("category_sizes").insert({
      category_id: categoryId,
      name: name.trim(),
      price: Number(price),
      max_flavors: Number(maxFlavors),
      display_order: maxOrder,
    });
    setName("");
    setPrice("");
    setMaxFlavors("2");
    setSaving(false);
    load();
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await (supabase as any).from("category_sizes").update({
      name: editName.trim(),
      price: Number(editPrice),
      max_flavors: Number(editMaxFlavors),
    }).eq("id", id);
    setEditId(null);
    load();
  }

  async function deleteSize(id: string) {
    const supabase = createClient();
    await (supabase as any).from("category_sizes").delete().eq("id", id);
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
      <button
        onClick={addSize}
        disabled={saving || !name.trim() || !price}
        className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
      >
        Adicionar tamanho
      </button>

      <div className="space-y-2">
        {sizes.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === s.id ? (
              <div className="grid grid-cols-3 gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editMaxFlavors} onChange={(e) => setEditMaxFlavors(e.target.value)} type="number" className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <div className="col-span-3 flex gap-2">
                  <button onClick={() => saveEdit(s.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white hover:bg-wine-hover">Salvar</button>
                  <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted hover:text-foreground">Cancelar</button>
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
                  <button onClick={() => deleteSize(s.id)} className="text-xs text-red-400 hover:text-red-300">Apagar</button>
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
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("addons")
      .select("*")
      .eq("company_id", companyId)
      .eq("category_id", categoryId)
      .order("name");
    setAddons((data as Addon[]) ?? []);
  }

  useEffect(() => { load(); }, [categoryId]);

  async function addAddon() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await (supabase.from("addons") as any).insert({
      company_id: companyId,
      category_id: categoryId,
      name: name.trim(),
      price: price ? Number(price) : 0,
      active: true,
    });
    setName("");
    setPrice("");
    setSaving(false);
    load();
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await supabase.from("addons").update({ name: editName.trim(), price: Number(editPrice) }).eq("id", id);
    setEditId(null);
    load();
  }

  async function deleteAddon(id: string) {
    const supabase = createClient();
    await supabase.from("addons").delete().eq("id", id);
    load();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Adicionais</h3>

      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Borda Catupiry, Bacon extra" className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço" className="w-28 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addAddon} disabled={saving || !name.trim()} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50">
          Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {addons.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card-hover p-3">
            {editId === a.id ? (
              <div className="flex gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <button onClick={() => saveEdit(a.id)} className="rounded-lg bg-wine px-3 py-1 text-xs text-white hover:bg-wine-hover">Salvar</button>
                <button onClick={() => setEditId(null)} className="rounded-lg bg-card px-3 py-1 text-xs text-muted hover:text-foreground">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{a.name}</span>
                  {a.price > 0 && <span className="ml-3 text-sm text-muted">+{formatCurrency(a.price)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(a.id); setEditName(a.name); setEditPrice(String(a.price)); }} className="text-xs text-muted hover:text-foreground">Editar</button>
                  <button onClick={() => deleteAddon(a.id)} className="text-xs text-red-400 hover:text-red-300">Apagar</button>
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

// ─── Importar Cardápio Tab ────────────────────────────────────────────────────

function ImportarTab({ companyId }: { companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("display_order")
      .then(({ data }) => {
        const cats = (data as unknown as Category[]) ?? [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCatId(cats[0].id);
      });
  }, [companyId]);

  function parseBlocks(raw: string): { name: string; ingredients: string[] }[] {
    const blocks = raw.trim().split(/\n{2,}/);
    const parsed: { name: string; ingredients: string[] }[] = [];

    for (const block of blocks) {
      const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const nameLine = lines[0];
      // Strip leading numbering like "01 –", "1.", "01 -"
      const name = nameLine.replace(/^\d+\s*[–\-\.]\s*/, "").trim();
      if (!name) continue;

      let ingredients: string[] = [];
      const ingredLine = lines.find((l) => /ingredientes?:/i.test(l));
      if (ingredLine) {
        const rest = ingredLine.replace(/ingredientes?:\s*/i, "");
        ingredients = rest.split(",").map((s) => s.trim()).filter(Boolean);
      }

      parsed.push({ name, ingredients });
    }

    return parsed;
  }

  async function importar() {
    if (!selectedCatId || !text.trim()) return;
    setImporting(true);
    setError("");
    setResult(null);

    const selectedCat = categories.find((c) => c.id === selectedCatId)!;
    const blocks = parseBlocks(text);
    const supabase = createClient();
    let imported = 0;
    let skipped = 0;

    for (const block of blocks) {
      try {
        if (selectedCat.is_pizza) {
          const { error: err } = await (supabase.from("flavors") as any).insert({
            company_id: companyId,
            category_id: selectedCatId,
            name: block.name,
            ingredients: block.ingredients.map((i) => ({ name: i, removable: true })),
            available: true,
          });
          if (err) { skipped++; } else { imported++; }
        } else {
          const { error: err } = await supabase.from("products").insert({
            company_id: companyId,
            category_id: selectedCatId,
            product_type: "comum",
            name: block.name,
            description: block.ingredients.join(", ") || null,
            base_price: 0,
            active: true,
          });
          if (err) { skipped++; } else { imported++; }
        }
      } catch {
        skipped++;
      }
    }

    setImporting(false);
    setResult({ imported, skipped });
    if (imported > 0) setText("");
  }

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Categoria de destino</label>
        <select
          value={selectedCatId}
          onChange={(e) => setSelectedCatId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.is_pizza ? " (pizza)" : ""}</option>
          ))}
        </select>
      </div>

      {selectedCat && (
        <p className="text-xs text-muted">
          {selectedCat.is_pizza
            ? "Cada bloco será importado como um sabor. Forneça nome e opcionalmente \"Ingredientes: molho, muçarela...\"."
            : "Cada bloco será importado como um produto. Forneça nome e opcionalmente \"Ingredientes: ...\" (vira a descrição)."}
        </p>
      )}

      <div>
        <label className="text-sm font-medium text-foreground">Texto do cardápio</label>
        <p className="mt-0.5 text-xs text-muted">Separe cada item por uma linha em branco. Nome na 1ª linha, depois "Ingredientes: ..." na 2ª.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          placeholder={"Margherita\nIngredientes: molho, muçarela, manjericão\n\nCalabresa\nIngredientes: molho, muçarela, calabresa"}
          className="mt-2 w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground font-mono"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="rounded-lg bg-card-hover px-4 py-3 text-sm">
          <p className="text-foreground font-medium">Importação concluída</p>
          <p className="text-muted">{result.imported} item(ns) importado(s){result.skipped > 0 ? `, ${result.skipped} ignorado(s)` : ""}.</p>
        </div>
      )}

      <button
        onClick={importar}
        disabled={importing || !text.trim() || !selectedCatId}
        className="rounded-lg bg-wine px-5 py-2.5 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
      >
        {importing ? "Importando..." : "Importar cardápio"}
      </button>
    </div>
  );
}
