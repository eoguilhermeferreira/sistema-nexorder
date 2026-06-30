"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useCatalog } from "@/lib/hooks/useCatalog";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, Product } from "@/types/domain";

type Tab = "categorias" | "importar";

export default function CardapioAdminPage() {
  const company = useCompany();
  const catalog = useCatalog(company.id);
  const [tab, setTab] = useState<Tab>("categorias");

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/cardapio/${company.slug}`
      : `/cardapio/${company.slug}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(menuUrl)}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Cardápio</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <img src={qrUrl} alt="QR Code do cardápio" className="h-24 w-24 rounded-lg bg-white p-1" />
        <div>
          <p className="text-sm text-muted">Link do seu cardápio digital</p>
          <a href={menuUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground underline">
            {menuUrl}
          </a>
        </div>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg bg-card-hover p-1 w-fit">
        {([
          ["categorias", "Categorias"],
          ["importar", "Importar Cardápio"],
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
        {tab === "categorias" && <CategoriasTab companyId={company.id} catalog={catalog} />}
        {tab === "importar" && <ImportarCardapioTab companyId={company.id} catalog={catalog} />}
      </div>
    </div>
  );
}

type Catalog = ReturnType<typeof useCatalog>;

function CategoriasTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { categories, refetch } = catalog;
  const [name, setName] = useState("");

  async function addCategory() {
    if (!name.trim()) return;
    const supabase = createClient();
    await supabase.from("categories").insert({
      company_id: companyId,
      name: name.trim(),
      display_order: categories.length,
    });
    setName("");
    refetch();
  }

  async function move(category: Category, direction: -1 | 1) {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex((c) => c.id === category.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;

    const supabase = createClient();
    await supabase.from("categories").update({ display_order: swapWith.display_order }).eq("id", category.id);
    await supabase.from("categories").update({ display_order: category.display_order }).eq("id", swapWith.id);
    refetch();
  }

  async function toggleActive(category: Category) {
    const supabase = createClient();
    await supabase.from("categories").update({ active: !category.active }).eq("id", category.id);
    refetch();
  }

  async function remove(category: Category) {
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", category.id);
    refetch();
  }

  return (
    <div className="max-w-xl space-y-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova categoria"
          className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        <button onClick={addCategory} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">
          Adicionar
        </button>
      </div>

      {[...categories]
        .sort((a, b) => a.display_order - b.display_order)
        .map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <span className={`text-sm ${category.active ? "text-foreground" : "text-muted line-through"}`}>{category.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(category, -1)} className="rounded px-2 py-1 text-muted hover:bg-card-hover">↑</button>
              <button onClick={() => move(category, 1)} className="rounded px-2 py-1 text-muted hover:bg-card-hover">↓</button>
              <button onClick={() => toggleActive(category)} className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover">
                {category.active ? "Ocultar" : "Mostrar"}
              </button>
              <button onClick={() => remove(category)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-card-hover">
                Excluir
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

function ProdutosLista({ catalog }: { catalog: Catalog }) {
  const { categories, products, flavors, refetch } = catalog;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function removeProduct(id: string) {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    refetch();
  }

  async function toggleActive(product: Product) {
    const supabase = createClient();
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    refetch();
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Produtos cadastrados</p>
      {categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id}>
              <p className="mt-4 text-sm font-medium text-muted">{category.name}</p>
              <div className="mt-2 space-y-2">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${product.active ? "text-foreground" : "text-muted line-through"}`}>
                          {product.name}
                        </p>
                        <p className="text-xs text-muted">
                          {formatCurrency(product.base_price)} • {product.product_type === "pizza" ? "Pizza" : "Comum"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {product.product_type === "pizza" && (
                          <button
                            onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                            className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover"
                          >
                            {expandedId === product.id ? "Fechar" : "Configurar"}
                          </button>
                        )}
                        <button onClick={() => toggleActive(product)} className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover">
                          {product.active ? "Ocultar" : "Mostrar"}
                        </button>
                        <button onClick={() => removeProduct(product.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-card-hover">
                          Excluir
                        </button>
                      </div>
                    </div>

                    {expandedId === product.id && (
                      <PizzaConfig product={product} flavors={flavors} onChange={refetch} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PizzaConfig({
  product,
  flavors,
  onChange,
}: {
  product: Product;
  flavors: { id: string; name: string }[];
  onChange: () => void;
}) {
  const [sizeName, setSizeName] = useState("");
  const [sizePrice, setSizePrice] = useState("");
  const [maxFlavors, setMaxFlavors] = useState("1");

  const linkedFlavorIds = new Set((product.product_flavors ?? []).map((pf) => pf.flavor_id));

  async function addSize() {
    if (!sizeName.trim()) return;
    const supabase = createClient();
    await supabase.from("product_sizes").insert({
      product_id: product.id,
      name: sizeName.trim(),
      price: Number(sizePrice) || 0,
      max_flavors: Number(maxFlavors) || 1,
      display_order: (product.product_sizes ?? []).length,
    });
    setSizeName("");
    setSizePrice("");
    setMaxFlavors("1");
    onChange();
  }

  async function removeSize(sizeId: string) {
    const supabase = createClient();
    await supabase.from("product_sizes").delete().eq("id", sizeId);
    onChange();
  }

  async function toggleFlavor(flavorId: string) {
    const supabase = createClient();
    if (linkedFlavorIds.has(flavorId)) {
      await supabase.from("product_flavors").delete().eq("product_id", product.id).eq("flavor_id", flavorId);
    } else {
      await supabase.from("product_flavors").insert({ product_id: product.id, flavor_id: flavorId });
    }
    onChange();
  }

  return (
    <div className="mt-3 space-y-4 border-t border-border pt-3">
      <div>
        <p className="text-xs font-medium text-muted">Tamanhos</p>
        <div className="mt-2 space-y-1">
          {(product.product_sizes ?? []).map((size) => (
            <div key={size.id} className="flex items-center justify-between rounded-lg bg-card-hover px-3 py-1.5 text-sm">
              <span className="text-foreground">{size.name} • {formatCurrency(size.price)} • até {size.max_flavors} sabor(es)</span>
              <button onClick={() => removeSize(size.id)} className="text-xs text-red-400">Excluir</button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={sizeName} onChange={(e) => setSizeName(e.target.value)} placeholder="Nome" className="w-24 rounded-lg border border-border bg-card-hover px-2 py-1.5 text-sm text-foreground" />
          <input value={sizePrice} onChange={(e) => setSizePrice(e.target.value)} placeholder="Preço" type="number" className="w-24 rounded-lg border border-border bg-card-hover px-2 py-1.5 text-sm text-foreground" />
          <input value={maxFlavors} onChange={(e) => setMaxFlavors(e.target.value)} placeholder="Máx sabores" type="number" className="w-28 rounded-lg border border-border bg-card-hover px-2 py-1.5 text-sm text-foreground" />
          <button onClick={addSize} className="rounded-lg bg-wine px-3 py-1.5 text-sm font-medium text-white hover:bg-wine-hover">+</button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted">Sabores disponíveis para este produto</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {flavors.map((flavor) => (
            <button
              key={flavor.id}
              onClick={() => toggleFlavor(flavor.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                linkedFlavorIds.has(flavor.id) ? "bg-wine text-white" : "bg-card-hover text-muted"
              }`}
            >
              {flavor.name}
            </button>
          ))}
          {flavors.length === 0 && <p className="text-xs text-muted">Cadastre sabores na aba &quot;Sabores&quot;.</p>}
        </div>
      </div>
    </div>
  );
}

type ParsedMenu = {
  products: { name: string; description: string | null; price: number }[];
  flavors: { name: string; ingredients: string[] }[];
  addons: { name: string; price: number }[];
  borders: { name: string; price: number }[];
};

const SECTION_HEADERS: Record<string, keyof ParsedMenu> = {
  PRODUTOS: "products",
  PRODUTO: "products",
  SABORES: "flavors",
  SABOR: "flavors",
  ADICIONAIS: "addons",
  ADICIONAL: "addons",
  BORDAS: "borders",
  BORDA: "borders",
};

function parseMenuText(text: string): ParsedMenu {
  const result: ParsedMenu = { products: [], flavors: [], addons: [], borders: [] };
  let currentSection: keyof ParsedMenu = "products";

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const headerKey = line.replace(/:$/, "").trim().toUpperCase();
    if (SECTION_HEADERS[headerKey]) {
      currentSection = SECTION_HEADERS[headerKey];
      continue;
    }

    const parts = line.split("-").map((p) => p.trim()).filter(Boolean);

    if (currentSection === "flavors") {
      const [name, ...rest] = parts;
      if (!name) continue;
      const ingredients = rest
        .join(" - ")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      result.flavors.push({ name, ingredients });
      continue;
    }

    const last = parts[parts.length - 1];
    const priceMatch = last?.match(/[\d.,]+/);
    const parsedPrice = priceMatch ? Number(priceMatch[0].replace(",", ".")) : 0;
    const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    const nameParts = priceMatch ? parts.slice(0, -1) : parts;
    const name = nameParts[0] ?? line;
    if (!name) continue;

    if (currentSection === "addons" || currentSection === "borders") {
      result[currentSection].push({ name, price });
    } else {
      result.products.push({ name, description: nameParts.slice(1).join(" - ") || null, price });
    }
  }

  return result;
}

function ImportarCardapioTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { categories, refetch } = catalog;
  const [categoryId, setCategoryId] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function runImport() {
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError("Selecione a categoria antes de importar.");
      return;
    }
    if (!text.trim()) {
      setError("Cole o texto do cardápio antes de importar.");
      return;
    }

    const parsed = parseMenuText(text);
    if (
      parsed.products.length === 0 &&
      parsed.flavors.length === 0 &&
      parsed.addons.length === 0 &&
      parsed.borders.length === 0
    ) {
      setError("Não foi possível identificar nenhum item no texto colado.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (parsed.products.length > 0) {
        const { error: err } = await supabase.from("products").insert(
          parsed.products.map((p) => ({
            company_id: companyId,
            category_id: categoryId,
            name: p.name,
            description: p.description,
            base_price: p.price,
            product_type: "comum" as const,
          }))
        );
        if (err) throw err;
      }

      if (parsed.flavors.length > 0) {
        const { error: err } = await supabase.from("flavors").insert(
          parsed.flavors.map((f) => ({
            company_id: companyId,
            name: f.name,
            ingredients: f.ingredients.map((i) => ({ name: i, removable: true })),
          }))
        );
        if (err) throw err;
      }

      if (parsed.addons.length > 0) {
        const { error: err } = await supabase.from("addons").insert(
          parsed.addons.map((a) => ({ company_id: companyId, name: a.name, price: a.price }))
        );
        if (err) throw err;
      }

      if (parsed.borders.length > 0) {
        const { error: err } = await supabase.from("borders").insert(
          parsed.borders.map((b) => ({ company_id: companyId, name: b.name, prices: { default: b.price } }))
        );
        if (err) throw err;
      }

      const total =
        parsed.products.length + parsed.flavors.length + parsed.addons.length + parsed.borders.length;
      setSuccess(`Importado com sucesso: ${total} item(ns).`);
      setText("");
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar o cardápio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Importar cardápio por categoria</p>
        <p className="text-xs text-muted">
          Selecione a categoria, cole o cardápio completo dela (produtos, sabores, adicionais e bordas) e o
          sistema organiza tudo automaticamente. Use os cabeçalhos abaixo para separar cada parte (não é
          obrigatório usar todos):
        </p>
        <pre className="rounded-lg bg-card-hover p-3 text-xs text-muted whitespace-pre-wrap">{`PRODUTOS
Pizza Calabresa - Molho, calabresa, cebola - 45.00
Pizza Marguerita - Molho, mussarela, manjericão - 42.00

SABORES
Calabresa - calabresa, cebola, azeitona
Marguerita - mussarela, tomate, manjericão

ADICIONAIS
Borda recheada - 8.00
Bacon extra - 5.00

BORDAS
Catupiry - 8.00
Cheddar - 8.00`}</pre>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        >
          <option value="">Selecione a categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={"Cole aqui o cardápio completo desta categoria..."}
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground font-mono"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          onClick={runImport}
          disabled={loading}
          className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
        >
          {loading ? "Importando..." : "Importar Cardápio"}
        </button>
      </div>

      <ProdutosLista catalog={catalog} />
    </div>
  );
}
