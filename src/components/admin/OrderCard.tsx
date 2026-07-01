import type { Order } from "@/types/domain";
import { formatCurrency, formatTime, orderStatusLabels, orderTypeLabels } from "@/lib/format";

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
}

const statusColors: Record<string, string> = {
  aguardando_aceite: "bg-yellow-500/20 text-yellow-400",
  em_preparo: "bg-blue-500/20 text-blue-400",
  pronto: "bg-green-500/20 text-green-400",
  saiu_entrega: "bg-purple-500/20 text-purple-400",
  em_entrega_mesa: "bg-purple-500/20 text-purple-400",
  concluido: "bg-zinc-500/20 text-zinc-400",
  cancelado: "bg-red-500/20 text-red-400",
};

export function OrderCard({ order, children }: OrderCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground">#{order.order_code}</p>
          <p className="text-sm text-muted">{order.customer_name}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}>
          {orderStatusLabels[order.status]}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted">
        <span>{orderTypeLabels[order.type]}</span>
        <span>•</span>
        <span>{formatTime(order.created_at)}</span>
        <span>•</span>
        <span className="font-medium text-foreground">{formatCurrency(order.total)}</span>
      </div>

      {order.order_items && order.order_items.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-border pt-3">
          {order.order_items.map((item) => (
            <li key={item.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {item.quantity}x {item.product_name}
                  {item.size_name ? ` (${item.size_name})` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              {item.flavors && item.flavors.length > 0 && (
                <p className="mt-0.5 text-xs text-muted">
                  Sabor: {item.flavors.map((f) => f.name).join(" + ")}
                </p>
              )}
              {item.border_name && (
                <p className="text-xs text-muted">Borda: {item.border_name}</p>
              )}
              {item.additions && item.additions.length > 0 && (
                <p className="text-xs text-muted">
                  + {item.additions.map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name)).join(", ")}
                </p>
              )}
              {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                <p className="text-xs text-red-400">
                  Sem: {item.removed_ingredients.join(", ")}
                </p>
              )}
              {item.notes && (
                <p className="text-xs italic text-muted">Obs: {item.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {order.notes && <p className="mt-2 border-t border-border pt-2 text-sm italic text-muted">Obs geral: {order.notes}</p>}

      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </div>
  );
}
