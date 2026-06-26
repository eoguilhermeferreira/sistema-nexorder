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
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {order.order_items.map((item) => (
            <li key={item.id}>
              {item.quantity}x {item.product_name}
            </li>
          ))}
        </ul>
      )}

      {order.notes && <p className="mt-2 text-sm italic text-muted">Obs: {order.notes}</p>}

      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </div>
  );
}
