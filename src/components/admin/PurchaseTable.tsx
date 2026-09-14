"use client";

import { Check, ChevronDown, ChevronUp, LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";

export type PurchaseRow = {
  id: string; createdAt: string; buyerName: string; buyerEmail: string; buyerPhone: string | null; courseTitle: string;
  amountCents: number; currency: string; paymentStatus: "pending" | "paid" | "failed" | "expired" | "refunded";
  emailSent: boolean; emailSentAt: string | null; adminNotes: string | null;
};

export function PurchaseTable({ initialRows }: { initialRows: PurchaseRow[] }) {
  const [rows, setRows] = useState(initialRows); const [expanded, setExpanded] = useState<string | null>(null); const [confirm, setConfirm] = useState<{ id: string; value: boolean } | null>(null); const [busy, setBusy] = useState<string | null>(null); const [toast, setToast] = useState(""); const [error, setError] = useState("");
  const patch = async (id: string, body: { emailSent?: boolean; adminNotes?: string | null }) => {
    setBusy(id); setError(""); setToast("");
    try { const response = await fetch(`/api/admin/purchases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json() as { message?: string; emailSentAt?: string | null; error?: string }; if (!response.ok) throw new Error(data.error ?? "No fue posible guardar."); setRows((current) => current.map((row) => row.id === id ? { ...row, ...body, ...(body.emailSent !== undefined ? { emailSentAt: data.emailSentAt ?? null } : {}) } : row)); setToast(data.message ?? "Cambios guardados"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible guardar."); } finally { setBusy(null); setConfirm(null); }
  };
  return <div className="purchase-table-wrap">{toast && <div className="toast" role="status"><Check />{toast}</div>}{error && <div className="toast toast-error" role="alert">{error}</div>}
    <table className="purchase-table"><thead><tr><th>Fecha</th><th>Comprador</th><th>Curso</th><th>Monto</th><th>Pago</th><th>Correo enviado</th><th><span className="sr-only">Detalle</span></th></tr></thead><tbody>{rows.map((row) => <PurchaseLine key={row.id} row={row} open={expanded === row.id} busy={busy === row.id} confirm={confirm?.id === row.id ? confirm.value : null} onExpand={() => setExpanded(expanded === row.id ? null : row.id)} onAsk={(value) => setConfirm({ id: row.id, value })} onCancel={() => setConfirm(null)} onPatch={(body) => patch(row.id, body)} />)}</tbody></table>
  </div>;
}

function PurchaseLine({ row, open, busy, confirm, onExpand, onAsk, onCancel, onPatch }: { row: PurchaseRow; open: boolean; busy: boolean; confirm: boolean | null; onExpand: () => void; onAsk: (value: boolean) => void; onCancel: () => void; onPatch: (body: { emailSent?: boolean; adminNotes?: string | null }) => void }) {
  const [notes, setNotes] = useState(row.adminNotes ?? "");
  return <>
    <tr className={row.paymentStatus === "paid" && !row.emailSent ? "needs-followup" : ""}>
      <td data-label="Fecha">{formatDate(row.createdAt, true)}</td><td data-label="Comprador"><strong>{row.buyerName || "Sin nombre"}</strong><a href={`mailto:${row.buyerEmail}`}>{row.buyerEmail || "Correo pendiente"}</a>{row.buyerPhone && <a href={`tel:${row.buyerPhone}`}>{row.buyerPhone}</a>}</td><td data-label="Curso">{row.courseTitle}</td><td data-label="Monto"><strong>{formatPrice(row.amountCents, row.currency)}</strong></td><td data-label="Pago"><StatusBadge status={row.paymentStatus} /></td>
      <td data-label="Correo enviado"><label className="admin-checkbox"><input type="checkbox" checked={row.emailSent} disabled={busy} onChange={(event) => onAsk(event.target.checked)} /><span>{row.emailSent ? "Enviado" : "Pendiente"}</span></label>{row.emailSentAt && <small>{formatDate(row.emailSentAt, true)}</small>}{confirm !== null && <span className="inline-confirm">¿Confirmar? <button type="button" onClick={() => onPatch({ emailSent: confirm })}>Sí</button><button type="button" onClick={onCancel}>No</button></span>}</td>
      <td><button className="icon-button" type="button" aria-expanded={open} aria-label={open ? "Cerrar detalle" : "Ver detalle"} onClick={onExpand}>{open ? <ChevronUp /> : <ChevronDown />}</button></td>
    </tr>
    {open && <tr className="purchase-detail-row"><td colSpan={7}><div><div><strong>Teléfono</strong><span>{row.buyerPhone || "No proporcionado"}</span></div><label><strong>Notas internas</strong><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} rows={3} placeholder="Agrega contexto para el seguimiento…" /><button className="small-admin-button" type="button" disabled={busy || notes === (row.adminNotes ?? "")} onClick={() => onPatch({ adminNotes: notes || null })}>{busy ? <LoaderCircle className="spin" /> : <Save />} Guardar nota</button></label></div></td></tr>}
  </>;
}
