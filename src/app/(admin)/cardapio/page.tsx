"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useCatalog } from "@/lib/hooks/useCatalog";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { Category, Product, Addon } from "@/types/domain";

type Tab = "categorias" | "adicionais" | "importar";

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
          ["adicionais", "Adicionais"],
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
        {tab === "adicionais" && <AdicionaisTab companyId={company.id} catalog={catalog} />}
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

// ─── AdicionaisTab ─────────────────────────────────────────────────────────────

const PREDEFINED_GROUPS = ["Borda Recheada", "Molhos", "Extras"];

function AdicionaisTab({ companyId, catalog }: { companyId: string; catalog: Catalog }) {
  const { addons, refetch } = catalog;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [group, setGroup] = useState("");
  const [customGroup, setCustomGroup] = useState("");

  const effectiveGroup = group === "__custom" ? customGroup.trim() : group.trim();

  async function addAddon() {
    if (!name.trim()) return;
    const parsedPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("addons").insert({
      company_id: companyId,
      name: name.trim(),
      price: parsedPrice,
      group: effectiveGroup || null,
    } as any);
    setName("");
    setPrice("");
    refetch();
  }

  async function toggleActive(addon: Addon) {
    const supabase = createClient();
    await supabase.from("addons").update({ active: !addon.active }).eq("id", addon.id);
    refetch();
  }

  async function deleteAddon(id: string) {
    const supabase = createClient();
    await supabase.from("addons").delete().eq("id", id);
    refetch();
  }

  // group addons for display
  const grouped = new Map<string, Addon[]>();
  for (const a of addons) {
    const key = a.group ?? "Sem grupo";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Novo adicional</p>
        <p className="text-xs text-muted">
          Tudo que pode personalizar um produto: extras, ingredientes adicionais, bordas recheadas, molhos, etc.
          Use grupos para organizar (ex: &quot;Borda Recheada&quot; aparece como seção separada no pedido do cliente).
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (ex: Bacon)"
            className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço (ex: 8,00)"
            className="w-32 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sem grupo (adicional geral)</option>
            {PREDEFINED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            <option value="__custom">Outro grupo...</option>
          </select>
          {group === "__custom" && (
            <input
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              placeholder="Nome do grupo"
              className="flex-1 rounded-lg border border-border bg-card-hover px-3 py-2 text-sm text-foreground"
            />
          )}
        </div>
        <button
          onClick={addAddon}
          disabled={!name.trim()}
          className="w-full rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white hover:bg-wine-hover disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      {Array.from(grouped.entries()).map(([groupName, items]) => (
        <div key={groupName} className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="border-b border-border bg-card-hover px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
            {groupName}
          </p>
          {items.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <div>
                <span className="text-sm text-foreground">{addon.name}</span>
                <span className="ml-2 text-sm text-wine">+{formatCurrency(addon.price)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(addon)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${addon.active ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted"}`}
                >
                  {addon.active ? "Ativo" : "Inativo"}
                </button>
                <button
                  onClick={() => deleteAddon(addon.id)}
                  className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-400/10"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {addons.length === 0 && (
        <p className="text-sm text-muted">Nenhum adicional cadastrado ainda.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type ParsedMenu = {
  sizes: { name: string; price: number }[];
  products: { name: string; description: string | null; price: number }[];
  flavors: { name: string; ingredients: string[] }[];
  addons: { name: string; price: number; group: string | null }[];
};

type SectionKey = "sizes" | "products" | "flavors" | "addons" | "borders" | "ignore";

function stripLeadingSymbols(line: string): string {
  // Remove leading emoji and non-letter/non-digit characters (keep letters, digits, and accented chars)
  return line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function extractPrice(segment: string): number {
  const m = segment.match(/R\$\s*([\d]+(?:[.,]\d+)?)/);
  if (m) {
    const v = Number(m[1].replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  }
  const m2 = segment.match(/([\d]+(?:[.,]\d+)?)/);
  if (m2) {
    const v = Number(m2[1].replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

function detectSection(line: string): SectionKey | null {
  const lower = line.toLowerCase();
  if (/tamanho|tamanhos/.test(lower)) return "sizes";
  if (/borda|bordas/.test(lower)) return "borders";
  if (/adicional|adicionais/.test(lower)) return "addons";
  if (/sabor|sabores/.test(lower)) return "flavors";
  if (/promo/.test(lower)) return "ignore";
  if (/produto|produtos/.test(lower)) return "products";
  return null;
}

function parseMenuText(text: string): ParsedMenu {
  const result: ParsedMenu = { sizes: [], products: [], flavors: [], addons: [] };
  let currentSection: SectionKey = "products";
  let pendingFlavorName: string | null = null;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const clean = stripLeadingSymbols(line);
    if (!clean) continue;

    // Section header detection (stripped line, no price-like content)
    const sec = detectSection(clean);
    if (sec && !clean.match(/R\$/) && !clean.match(/—|–/)) {
      currentSection = sec;
      pendingFlavorName = null;
      continue;
    }

    if (currentSection === "ignore") continue;

    if (currentSection === "flavors") {
      // Check for "Ingredientes:" line
      const ingMatch = clean.match(/^[Ii]ngredientes?:\s*(.+)/);
      if (ingMatch && pendingFlavorName) {
        const raw = ingMatch[1].replace(/\.$/, "");
        // split on comma, then handle trailing " e " before last item
        const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const ingredients: string[] = [];
        for (let i = 0; i < parts.length; i++) {
          if (i === parts.length - 1 && parts[i].includes(" e ")) {
            const sub = parts[i].split(" e ").map((s) => s.trim()).filter(Boolean);
            ingredients.push(...sub);
          } else {
            ingredients.push(parts[i]);
          }
        }
        result.flavors.push({ name: pendingFlavorName, ingredients });
        pendingFlavorName = null;
        continue;
      }
      // Numbered flavor line: "01 – Nome" or "01 - Nome"
      const numMatch = clean.match(/^\d+\s*[–—\-]\s*(.+)/);
      if (numMatch) {
        pendingFlavorName = numMatch[1].trim();
        continue;
      }
      // Plain flavor line (legacy): "Nome - ingrediente1, ingrediente2"
      const dashIdx = clean.search(/[–—\-]/);
      if (dashIdx > 0) {
        const name = clean.slice(0, dashIdx).trim();
        const rest = clean.slice(dashIdx + 1).trim();
        const ingredients = rest.split(",").map((s) => s.trim()).filter(Boolean);
        result.flavors.push({ name, ingredients });
      }
      continue;
    }

    // For sizes/borders/addons/products: split on em/en-dash or plain hyphen
    const dashIdx = clean.search(/[–—]/);
    if (dashIdx > 0) {
      const namePart = clean.slice(0, dashIdx).trim();
      const pricePart = clean.slice(dashIdx + 1).trim();
      const price = extractPrice(pricePart);
      if (!namePart) continue;
      if (currentSection === "sizes") { result.sizes.push({ name: namePart, price }); continue; }
      if (currentSection === "borders") { result.addons.push({ name: namePart, price, group: "Borda Recheada" }); continue; }
      if (currentSection === "addons") { result.addons.push({ name: namePart, price, group: null }); continue; }
      result.products.push({ name: namePart, description: null, price });
      continue;
    }

    // Legacy plain-hyphen format: "Name - desc - price"
    const parts = clean.split("-").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const price = extractPrice(last);
      const nameParts = price > 0 ? parts.slice(0, -1) : parts;
      const name = nameParts[0];
      if (!name) continue;
      if (currentSection === "sizes") { result.sizes.push({ name, price }); continue; }
      if (currentSection === "borders") { result.addons.push({ name, price, group: "Borda Recheada" }); continue; }
      if (currentSection === "addons") { result.addons.push({ name, price, group: null }); continue; }
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
    const hasContent =
      parsed.sizes.length > 0 ||
      parsed.products.length > 0 ||
      parsed.flavors.length > 0 ||
      parsed.addons.length > 0;
    if (!hasContent) {
      setError("Não foi possível identificar nenhum item no texto colado.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      let pizzaProductId: string | null = null;

      // Pizza-type product: created when sizes are detected
      if (parsed.sizes.length > 0) {
        const { data: prod, error: err } = await supabase
          .from("products")
          .insert({
            company_id: companyId,
            category_id: categoryId,
            name: "Pizza",
            description: null,
            base_price: parsed.sizes[0]?.price ?? 0,
            product_type: "pizza" as const,
          })
          .select("id")
          .single();
        if (err) throw err;
        pizzaProductId = prod.id;

        const { error: szErr } = await supabase.from("product_sizes").insert(
          parsed.sizes.map((s) => ({
            product_id: pizzaProductId!,
            name: s.name,
            price: s.price,
            max_flavors: 1,
          }))
        );
        if (szErr) throw szErr;
      }

      // Legacy plain-products (non-pizza categories)
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

      // Flavors + link to pizza product if one was created
      if (parsed.flavors.length > 0) {
        const { data: insertedFlavors, error: flErr } = await supabase
          .from("flavors")
          .insert(
            parsed.flavors.map((f) => ({
              company_id: companyId,
              name: f.name,
              ingredients: f.ingredients.map((i) => ({ name: i, removable: true })),
            }))
          )
          .select("id");
        if (flErr) throw flErr;

        if (pizzaProductId && insertedFlavors && insertedFlavors.length > 0) {
          const { error: pfErr } = await supabase.from("product_flavors").insert(
            insertedFlavors.map((f: { id: string }) => ({
              product_id: pizzaProductId,
              flavor_id: f.id,
            }))
          );
          if (pfErr) throw pfErr;
        }
      }

      if (parsed.addons.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: err } = await supabase.from("addons").insert(
          parsed.addons.map((a) => ({ company_id: companyId, name: a.name, price: a.price, group: a.group })) as any
        );
        if (err) throw err;
      }

      const total =
        (pizzaProductId ? 1 : 0) +
        parsed.products.length +
        parsed.sizes.length +
        parsed.flavors.length +
        parsed.addons.length;
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
          Cole o texto completo do cardápio. O sistema reconhece automaticamente seções como &quot;Tamanhos&quot;,
          &quot;Sabores&quot;, &quot;Adicionais&quot; e &quot;Bordas&quot; — mesmo com emojis e símbolos.
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
