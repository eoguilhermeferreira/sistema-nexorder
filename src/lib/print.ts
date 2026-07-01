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
      const flavorsPart =
        item.flavors && item.flavors.length > 0
          ? `<div style="margin-left:12px;color:#555;">Sabor: ${item.flavors.map((f) => f.name).join(" + ")}</div>`
          : "";
      const borderPart = item.border_name
        ? `<div style="margin-left:12px;color:#555;">Borda: ${item.border_name}</div>`
        : "";
      const additionsPart =
        item.additions && item.additions.length > 0
          ? `<div style="margin-left:12px;color:#555;">+ ${item.additions
              .map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name))
              .join(", ")}</div>`
          : "";
      const removedPart =
        item.removed_ingredients && item.removed_ingredients.length > 0
          ? `<div style="margin-left:12px;color:#c00;">Sem: ${item.removed_ingredients.join(", ")}</div>`
          : "";
      const notesPart = item.notes
        ? `<div style="margin-left:12px;font-style:italic;color:#666;">Obs: ${item.notes}</div>`
        : "";
      const pricePart = `<div style="text-align:right;font-size:12px;color:#555;">${formatCurrency(item.price * item.quantity)}</div>`;

      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <strong>${item.quantity}x ${item.product_name}${sizePart}</strong>
            ${pricePart}
          </div>
          ${flavorsPart}${borderPart}${additionsPart}${removedPart}${notesPart}
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
        return `<p>Endereço: ${parts.join(" — ")}</p>`;
      })()
    : "";

  const changePart =
    order.payment_method === "dinheiro" && order.change_for
      ? `<p>Troco para: ${formatCurrency(order.change_for)}</p>`
      : "";

  const win = window.open("", "_blank", "width=340,height=700");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Pedido #${order.order_code}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            width: 300px;
            margin: 0 auto;
            padding: 16px 8px;
            color: #000;
          }
          h2 { font-size: 18px; text-align: center; margin-bottom: 4px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px dashed #888; margin: 10px 0; }
          .total { font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 6px; }
          @media print {
            body { width: 100%; padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h2>PEDIDO #${order.order_code}</h2>
        <p class="center">${formatTime(order.created_at)}</p>
        <hr/>
        <p><strong>Cliente:</strong> ${order.customer_name}</p>
        ${order.customer_phone ? `<p><strong>Tel:</strong> ${order.customer_phone}</p>` : ""}
        <p><strong>Tipo:</strong> ${orderTypeLabels[order.type]}</p>
        ${addressHtml}
        <p><strong>Pagamento:</strong> ${paymentLabels[order.payment_method ?? ""] ?? order.payment_method ?? "-"}</p>
        ${changePart}
        <hr/>
        ${itemsHtml}
        <hr/>
        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        ${order.notes ? `<hr/><p><em>Obs: ${order.notes}</em></p>` : ""}
        <hr/>
        <p class="center" style="font-size:11px;color:#888;margin-top:8px;">NexOrder</p>
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
