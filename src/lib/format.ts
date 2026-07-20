export function formatCurrency(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function isToday(dateIso: string) {
  const date = new Date(dateIso);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export const orderTypeLabels: Record<string, string> = {
  entrega: "Entrega",
  retirada: "Retirada",
  mesa: "Mesa",
};

export const orderStatusLabels: Record<string, string> = {
  aguardando_aceite: "Aguardando aceite",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  em_entrega_mesa: "Em entrega na mesa",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
