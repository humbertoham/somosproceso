export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const labels: Record<string, string> = {
    draft: "Borrador", published: "Publicado", archived: "Archivado", pending: "Pendiente",
    paid: "Pagado", failed: "Fallido", expired: "Expirado", refunded: "Reembolsado",
    open: "Inscripciones abiertas", soon: "Próximamente", "sold-out": "Agotado", finished: "Finalizado",
  };
  return <span className={`status-badge status-${status}`}>{label ?? labels[status] ?? status}</span>;
}
