"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useCatalog } from "@/lib/hooks/useCatalog";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, Product } from "@/types/domain";

type Tab = "categorias" | "produtos" | "sabores" | "adicionais" | "bordas";

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
          ["produtos", "Produtos"],
          ["sabores", "Sabores"],
          ["adicionais", "Adicionais"],
          ["bordas", "Bordas"],
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
        {tab === "produtos" && <ProdutosTab companyId={company.id} catalog={catalog} />}
        {tab === "sabores" && <SaboresTab companyId={company.id} catalog={catalog} />}
        {tab === "adicionais" && <AdicionaisTab companyId={company.id} catalog={catalog} />}
        {tab === "bordas" && <BordasTab companyId={company.id} catalog={catalog} />}
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

function ProdutosTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { categories, products, flavors, refetch } = catalog;
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState<"comum" | "pizza">("comum");
  const [bulkText, setBulkText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function addProduct() {
    if (!name.trim() || !categoryId) return;
    const supabase = createClient();
    await supabase.from("products").insert({
      company_id: companyId,
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      base_price: Number(price) || 0,
      product_type: productType,
    });
    setName("");
    setDescription("");
    setPrice("");
    refetch();
  }

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

  async function runBulkImport() {
    if (!categoryId || !bulkText.trim()) return;
    const supabase = createClient();
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);

    const rows = lines.map((line) => {
      const parts = line.split("-").map((p) => p.trim());
      const last = parts[parts.length - 1];
      const priceMatch = last.match(/[\d.,]+/);
      const parsedPrice = priceMatch ? Number(priceMatch[0].replace(",", ".")) : 0;
      const hasPrice = !!priceMatch;
      const nameParts = hasPrice ? parts.slice(0, -1) : parts;

      return {
        company_id: companyId,
        category_id: categoryId,
        name: nameParts[0] ?? line,
        description: nameParts.slice(1).join(" - ") || null,
        base_price: parsedPrice,
        product_type: "comum" as const,
      };
    });

    await supabase.from("products").insert(rows);
    setBulkText("");
    refetch();
  }

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Novo produto</p>
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
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do produto"
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        <div className="flex gap-2">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço base"
            type="number"
            className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          />
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value as "comum" | "pizza")}
            className="rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          >
            <option value="comum">Comum</option>
            <option value="pizza">Pizza</option>
          </select>
        </div>
        <button onClick={addProduct} className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">
          Adicionar Produto
        </button>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Cadastro inteligente</p>
        <p className="text-xs text-muted">
          Cole uma lista, uma por linha, no formato &quot;Nome - Descrição - Preço&quot;.
        </p>
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
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          placeholder={"Coca-Cola 2L - Refrigerante - 12.00\nSuco de Laranja - 8.50"}
          className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
        />
        <button onClick={runBulkImport} className="w-full rounded-lg bg-card-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-border">
          Importar Lista
        </button>
      </div>

      <div className="space-y-2">
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

function SaboresTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { flavors, refetch } = catalog;
  const [name, setName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  async function addFlavor() {
    if (!name.trim()) return;
    const supabase = createClient();
    const ingredients = ingredientsText
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => ({ name: i, removable: true }));

    await supabase.from("flavors").insert({ company_id: companyId, name: name.trim(), ingredients });
    setName("");
    setIngredientsText("");
    refetch();
  }

  async function toggleAvailable(id: string, available: boolean) {
    const supabase = createClient();
    await supabase.from("flavors").update({ available: !available }).eq("id", id);
    refetch();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("flavors").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="max-w-xl space-y-3">
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do sabor" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder="Ingredientes, separados por vírgula" className="w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addFlavor} className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">Adicionar Sabor</button>
      </div>

      {flavors.map((flavor) => (
        <div key={flavor.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <div>
            <p className={`text-sm ${flavor.available ? "text-foreground" : "text-muted line-through"}`}>{flavor.name}</p>
            <p className="text-xs text-muted">{flavor.ingredients.map((i) => i.name).join(", ")}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => toggleAvailable(flavor.id, flavor.available)} className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover">
              {flavor.available ? "Ocultar" : "Mostrar"}
            </button>
            <button onClick={() => remove(flavor.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-card-hover">Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdicionaisTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { addons, refetch } = catalog;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function addAddon() {
    if (!name.trim()) return;
    const supabase = createClient();
    await supabase.from("addons").insert({ company_id: companyId, name: name.trim(), price: Number(price) || 0 });
    setName("");
    setPrice("");
    refetch();
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient();
    await supabase.from("addons").update({ active: !active }).eq("id", id);
    refetch();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("addons").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="max-w-xl space-y-3">
      <div className="flex gap-2 rounded-xl border border-border bg-card p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do adicional" className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" type="number" className="w-28 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addAddon} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">+</button>
      </div>

      {addons.map((addon) => (
        <div key={addon.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <span className={`text-sm ${addon.active ? "text-foreground" : "text-muted line-through"}`}>{addon.name} • {formatCurrency(addon.price)}</span>
          <div className="flex gap-1">
            <button onClick={() => toggleActive(addon.id, addon.active)} className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover">
              {addon.active ? "Ocultar" : "Mostrar"}
            </button>
            <button onClick={() => remove(addon.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-card-hover">Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BordasTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { borders, refetch } = catalog;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function addBorder() {
    if (!name.trim()) return;
    const supabase = createClient();
    await supabase.from("borders").insert({ company_id: companyId, name: name.trim(), prices: { default: Number(price) || 0 } });
    setName("");
    setPrice("");
    refetch();
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient();
    await supabase.from("borders").update({ active: !active }).eq("id", id);
    refetch();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("borders").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="max-w-xl space-y-3">
      <div className="flex gap-2 rounded-xl border border-border bg-card p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da borda" className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" type="number" className="w-28 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground" />
        <button onClick={addBorder} className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover">+</button>
      </div>

      {borders.map((border) => (
        <div key={border.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <span className={`text-sm ${border.active ? "text-foreground" : "text-muted line-through"}`}>
            {border.name} • {formatCurrency(Object.values(border.prices)[0] ?? 0)}
          </span>
          <div className="flex gap-1">
            <button onClick={() => toggleActive(border.id, border.active)} className="rounded px-2 py-1 text-xs text-muted hover:bg-card-hover">
              {border.active ? "Ocultar" : "Mostrar"}
            </button>
            <button onClick={() => remove(border.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-card-hover">Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}
