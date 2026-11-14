import { gmailComposeUrl, type PurchaseRow } from "@/lib/purchases";

export function GmailComposeButton({ buyer }: { buyer: Pick<PurchaseRow, "buyerName" | "buyerEmail" | "course"> }) {
  if (!buyer.buyerEmail) return <small>Correo no proporcionado</small>;
  return <a className="small-admin-button" href={gmailComposeUrl(buyer)} target="_blank" rel="noopener noreferrer">Enviar correo</a>;
}
