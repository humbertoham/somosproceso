"use client";

import { Check, ChevronDown, ChevronUp, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { GmailComposeButton } from "@/components/admin/GmailComposeButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { whatsappUrl, type PurchaseRow } from "@/lib/purchases";
import { formatDate, formatPrice } from "@/lib/utils";

export function PurchaseTable({ initialRows }: { initialRows: PurchaseRow[] }) {
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  return <div className="purchase-table-wrap">
    {toast && <div className="toast" role="status"><Check />{toast}</div>}
    {error && <div className="toast toast-error" role="alert">{error}</div>}
    <table className="purchase-table">
      <thead><tr><th>Fecha de compra</th><th>Comprador</th><th>Curso</th><th>Monto</th><th>Pago</th><th>Correo enviado</th><th>Acciones</th></tr></thead>
      <tbody>{initialRows.map((row) => <PurchaseLine key={`${row.id}:${row.emailSentAt}:${row.adminNotes}`} row={row} onResult={(message, failed) => { setToast(failed ? "" : message); setError(failed ? message : ""); }} />)}</tbody>
    </table>
  </div>;
}

function PurchaseLine({ row, onResult }: { row: PurchaseRow; onResult: (message: string, failed: boolean) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(row.adminNotes ?? "");
  const [emailSent, setEmailSent] = useState(row.emailSent);
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const processing = useRef(false);
  const disabled = busy || refreshing;
  const whatsapp = whatsappUrl(row.buyerPhone);

  async function patch(body: { emailSent?: boolean; adminNotes?: string | null }) {
    if (processing.current || refreshing) return;
    processing.current = true; setBusy(true); onResult("", false);
    if (body.emailSent !== undefined) setEmailSent(body.emailSent);
    try {
      const response = await fetch(`/api/admin/purchases/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Error al guardar.");
      onResult(data.message ?? "Cambios guardados", false);
      startTransition(() => router.refresh());
    } catch (cause) {
      if (body.emailSent !== undefined) setEmailSent(row.emailSent);
      onResult(cause instanceof Error ? cause.message : "Error al guardar.", true);
    }
    finally { processing.current = false; setBusy(false); }
  }

  return <>
    <tr className={row.paymentStatus === "paid" && !row.emailSent ? "needs-followup" : ""}>
      <td data-label="Fecha de compra">{formatDate(row.createdAt, true, row.course.timezone)}</td>
      <td data-label="Comprador"><strong>{row.buyerName || "Sin nombre"}</strong>{row.buyerEmail ? <a href={`mailto:${row.buyerEmail}`}>{row.buyerEmail}</a> : <small>Correo no proporcionado</small>}{row.buyerPhone ? <><span>{row.buyerPhone}</span>{whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</> : <small>Teléfono no proporcionado</small>}</td>
      <td data-label="Curso">{row.course.title}{row.adminNotes && <small className="note-preview">Nota: {row.adminNotes}</small>}</td>
      <td data-label="Monto"><strong>{formatPrice(row.amountCents, row.currency)}</strong></td>
      <td data-label="Estado del pago"><StatusBadge status={row.paymentStatus} /></td>
      <td data-label="Correo enviado"><label className="admin-checkbox"><input type="checkbox" checked={emailSent} disabled={disabled} onChange={(event) => patch({ emailSent: event.target.checked })} /><span>{disabled ? "Guardando..." : emailSent ? "Enviado" : "Pendiente"}</span></label>{row.emailSentAt && <small>{formatDate(row.emailSentAt, true, row.course.timezone)}</small>}</td>
      <td data-label="Acciones"><div className="purchase-actions"><GmailComposeButton buyer={row} /><button className="admin-secondary-button" type="button" aria-expanded={open} aria-controls={`notes-${row.id}`} onClick={() => setOpen(!open)}>{open ? <ChevronUp /> : <ChevronDown />}Notas</button></div></td>
    </tr>
    {open && <tr className="purchase-detail-row"><td colSpan={7}><div>
      <p>Enviar correo abre un borrador en Gmail. Marca «Correo enviado» después de enviarlo manualmente.</p>
      <div className="notes-editor" id={`notes-${row.id}`}><label htmlFor={`note-${row.id}`}>Notas internas</label><textarea id={`note-${row.id}`} value={notes} disabled={disabled} onChange={(event) => setNotes(event.target.value)} maxLength={5000} rows={3} placeholder="Agrega contexto para el seguimiento..." /><button className="small-admin-button" type="button" disabled={disabled || notes === (row.adminNotes ?? "")} onClick={() => patch({ adminNotes: notes || null })}>{disabled ? <LoaderCircle className="spin" /> : <Save />}{disabled ? "Guardando..." : "Guardar nota"}</button></div>
    </div></td></tr>}
  </>;
}
