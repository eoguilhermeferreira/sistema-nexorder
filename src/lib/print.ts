import type { Order } from "@/types/domain";
import { formatTime, orderTypeLabels } from "@/lib/format";

export function printOrder(order: Order) {
  const itemsHtml = (order.order_items ?? [])
    .map(
      (item) => `
      <div style="margin-bottom:6px;">
        <strong>${item.quantity}x ${item.product_name}</strong>
        ${item.additions?.length ? `<div>+ ${item.additions.join(", ")}</div>` : ""}
        ${item.removed_ingredients?.length ? `<div>- ${item.removed_ingredients.join(", ")}</div>` : ""}
        ${item.notes ? `<div><em>${item.notes}</em></div>` : ""}
      </div>`
    )
    .join("");

  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;

  win.document.write(`
    <html>
      <head><title>Pedido #${order.order_code}</title></head>
      <body style="font-family: monospace; padding: 16px; font-size: 14px;">
        <h2>Pedido #${order.order_code}</h2>
        <p>Cliente: ${order.customer_name}</p>
        <p>Tipo: ${orderTypeLabels[order.type]}</p>
        <p>Horário: ${formatTime(order.created_at)}</p>
        <p>Pagamento: ${order.payment_method ?? "-"}</p>
        <hr/>
        ${itemsHtml}
        <hr/>
        ${order.notes ? `<p>Observações: ${order.notes}</p>` : ""}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
