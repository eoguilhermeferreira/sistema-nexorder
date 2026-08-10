import type { Order } from "@/types/domain";
import { formatCurrency, formatTime, orderTypeLabels } from "@/lib/format";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
};

export function printOrder(order: Order) {
  const itemsHtml = (order.order_items ?? [])
    .map((item) => {
      const sizePart = item.size_name ? ` (${item.size_name})` : "";
      const pricePart = `<span style="font-size:12px;color:#111;font-weight:600;">${formatCurrency(item.price * item.quantity)}</span>`;

      // flavors with their specific addons grouped below each flavor
      let flavorsPart = "";
      if (item.flavors && item.flavors.length > 0) {
        flavorsPart = item.flavors
          .map((f) => {
            const flavorAddons = (item.additions ?? []).filter((a) => a.flavor_name === f.name);
            const addonText =
              flavorAddons.length > 0
                ? ` <span style="color:#111;font-weight:600;">(${flavorAddons
                    .map((a) => {
                      const modeLabel = a.mode === "half" ? " (metade)" : a.mode === "whole" ? " (inteiro)" : "";
                      return a.qty > 1 ? `${a.name}${modeLabel} x${a.qty}` : `${a.name}${modeLabel}`;
                    })
                    .join(", ")})</span>`
                : "";
            return `<div style="margin-left:12px;color:#111;font-weight:600;">• ${f.name}${addonText}</div>`;
          })
          .join("");
      }

      // addons without flavor association (non-pizza)
      const hasPerFlavorAddons = (item.additions ?? []).some((a) => a.flavor_name);
      const genericAddonsPart =
        !hasPerFlavorAddons && item.additions && item.additions.length > 0
          ? `<div style="margin-left:12px;color:#111;font-weight:600;">+ ${item.additions
              .map((a) => {
                const modeLabel = a.mode === "half" ? " (metade)" : a.mode === "whole" ? " (inteiro)" : "";
                return a.qty > 1 ? `${a.name}${modeLabel} x${a.qty}` : `${a.name}${modeLabel}`;
              })
              .join(", ")}</div>`
          : "";

      const borderPart = item.border_name
        ? `<div style="margin-left:12px;color:#555;">Borda: ${item.border_name}</div>`
        : "";
      const removedPart =
        item.removed_ingredients && item.removed_ingredients.length > 0
          ? `<div style="margin-left:12px;color:#c00;font-weight:bold;">SEM: ${item.removed_ingredients.join(", ")}</div>`
          : "";
      const notesPart = item.notes
        ? `<div style="margin-left:12px;font-style:italic;color:#111;font-weight:600;">Obs: ${item.notes}</div>`
        : "";

      const categoryPart = item.category_name
        ? `<div style="font-size:12px;color:#111;font-weight:600;">${item.category_name}</div>`
        : "";

      return `
        <div style="margin-bottom:10px;">
          ${categoryPart}
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <strong>${item.quantity}x ${item.product_name}${sizePart}</strong>
            ${pricePart}
          </div>
          ${flavorsPart}${genericAddonsPart}${borderPart}${removedPart}${notesPart}
        </div>`;
    })
    .join("");

  const addressHtml = order.addresses && order.addresses.length > 0
    ? (() => {
        const addr = order.addresses[0];
        const parts = [
          `${addr.street}, ${addr.number}`,
          addr.complement,
          addr.neighborhood,
          addr.city && addr.state ? `${addr.city} - ${addr.state}` : addr.city ?? addr.state ?? "",
          addr.reference ? `Ref: ${addr.reference}` : "",
        ].filter(Boolean);
        return `<p><strong>Endereço:</strong> <span style="color:#111;font-weight:600;">${parts.join(" — ")}</span></p>`;
      })()
    : "";

  const changePart =
    order.payment_method === "dinheiro" && order.change_for
      ? `<p><strong>Troco para:</strong> <span style="color:#111;font-weight:600;">${formatCurrency(order.change_for)}</span></p>`
      : "";

  const win = window.open("", "_blank", "width=340,height=700");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Pedido #${order.order_code}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 22px;
            width: 80mm;
            padding: 4mm 6mm;
            color: #000;
          }
          h2 { font-size: 18px; text-align: center; margin-bottom: 4px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px dashed #888; margin: 6px 0; }
          .total { font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 6px; }
          @media print {
            body { width: 80mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h2>PEDIDO #${order.order_code}</h2>
        <p class="center">${formatTime(order.created_at)}</p>
        <hr/>
        <p><strong>Cliente:</strong> <span style="color:#111;font-weight:600;">${order.customer_name}</span></p>
        ${order.customer_phone ? `<p><strong>Tel:</strong> <span style="color:#111;font-weight:600;">${order.customer_phone}</span></p>` : ""}
        <p><strong>Tipo:</strong> <span style="color:#111;font-weight:600;">${orderTypeLabels[order.type]}</span></p>
        ${addressHtml}
        <p><strong>Pagamento:</strong> <span style="color:#111;font-weight:600;">${paymentLabels[order.payment_method ?? ""] ?? order.payment_method ?? "-"}</span></p>
        ${changePart}
        <hr/>
        ${itemsHtml}
        <hr/>
        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        ${order.notes ? `<hr/><p style="font-weight:600;color:#111;"><em>Obs: ${order.notes}</em></p>` : ""}
        <hr/>
        <p class="center" style="font-size:11px;color:#111;font-weight:600;margin-top:8px;">Sistema FoodNex</p>
        <br/><br/>
        <div style="text-align:center;">
          <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;">🖨️ Imprimir</button>
        </div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
}
