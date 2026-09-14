"use client";

import { ImagePlus, LoaderCircle, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Course } from "@/lib/utils";
import { slugify } from "@/lib/utils";

function dateInput(date: Date | null | undefined) {
  if (!date) return "";
  const value = new Date(date); value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

type FormState = {
  title: string; slug: string; shortDescription: string; description: string; imageKey: string; imageUrl: string;
  price: string; status: "draft" | "published" | "archived"; modality: "online" | "in_person" | "hybrid";
  startDate: string; endDate: string; timeText: string; timezone: string; durationText: string; facilitators: string;
  targetAudience: string; learningOutcomes: string; includes: string; additionalInfo: string; capacity: string; salesOpen: boolean;
};

function initialState(course?: Course | null): FormState {
  return {
    title: course?.title ?? "", slug: course?.slug ?? "", shortDescription: course?.shortDescription ?? "", description: course?.description ?? "",
    imageKey: course?.imageKey ?? "", imageUrl: course?.imageUrl ?? "", price: course ? String(course.priceCents / 100) : "",
    status: course?.status ?? "draft", modality: course?.modality ?? "online", startDate: dateInput(course?.startDate), endDate: dateInput(course?.endDate),
    timeText: course?.timeText ?? "", timezone: course?.timezone ?? "America/Mexico_City", durationText: course?.durationText ?? "",
    facilitators: course?.facilitators ?? "", targetAudience: course?.targetAudience ?? "", learningOutcomes: course?.learningOutcomes.join("\n") ?? "",
    includes: course?.includes.join("\n") ?? "", additionalInfo: course?.additionalInfo ?? "", capacity: course?.capacity ? String(course.capacity) : "", salesOpen: course?.salesOpen ?? false,
  };
}

export function CourseForm({ course }: { course?: Course | null }) {
  const router = useRouter(); const [form, setForm] = useState(() => initialState(course)); const [slugEdited, setSlugEdited] = useState(Boolean(course));
  const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((state) => ({ ...state, [key]: value }));

  async function upload(file?: File) {
    if (!file) return; setUploading(true); setError("");
    try { const body = new FormData(); body.set("file", file); const response = await fetch("/api/admin/upload", { method: "POST", body }); const data = await response.json() as { key?: string; url?: string; error?: string }; if (!response.ok || !data.key || !data.url) throw new Error(data.error ?? "No fue posible subir la imagen."); setForm((state) => ({ ...state, imageKey: data.key!, imageUrl: data.url! })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible subir la imagen."); } finally { setUploading(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (form.status === "archived" && course?.status !== "archived" && !window.confirm("¿Archivar este curso? Dejará de mostrarse al público.")) return;
    setSaving(true); setError(""); setMessage("");
    const payload = { ...form, price: Number(form.price), startDate: form.startDate ? new Date(form.startDate).toISOString() : "", endDate: form.endDate ? new Date(form.endDate).toISOString() : "", capacity: form.capacity, learningOutcomes: form.learningOutcomes.split("\n").map((item) => item.trim()).filter(Boolean), includes: form.includes.split("\n").map((item) => item.trim()).filter(Boolean) };
    try { const url = course ? `/api/admin/courses/${course.id}` : "/api/admin/courses"; const response = await fetch(url, { method: course ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json() as { id?: string; message?: string; error?: string }; if (!response.ok) throw new Error(data.error ?? "No fue posible guardar."); setMessage(data.message ?? "Cambios guardados"); if (!course && data.id) router.replace(`/admin/cursos/${data.id}?created=1`); else router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible guardar."); } finally { setSaving(false); }
  }

  return <form className="course-form" onSubmit={save}>
    <div className="admin-form-main"><section className="admin-card"><h2>Información principal</h2><Field label="Título" required><input value={form.title} onChange={(event) => { const title = event.target.value; setForm((state) => ({ ...state, title, slug: slugEdited ? state.slug : slugify(title) })); }} required minLength={3} /></Field><Field label="Slug" hint="Dirección pública del curso"><input value={form.slug} onChange={(event) => { setSlugEdited(true); set("slug", event.target.value.toLowerCase()); }} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field><Field label="Descripción corta" hint={`${form.shortDescription.length}/320`}><textarea value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} rows={3} required maxLength={320} /></Field><Field label="Descripción completa" hint="Puedes usar Markdown sencillo"><textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={10} required /></Field></section>
      <section className="admin-card"><h2>Detalles del encuentro</h2><div className="form-grid"><Field label="Fecha de inicio"><input type="datetime-local" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field><Field label="Fecha de fin"><input type="datetime-local" value={form.endDate} onChange={(event) => set("endDate", event.target.value)} /></Field><Field label="Horario como texto"><input value={form.timeText} onChange={(event) => set("timeText", event.target.value)} placeholder="10:00 a 13:00 h" /></Field><Field label="Zona horaria"><input value={form.timezone} onChange={(event) => set("timezone", event.target.value)} /></Field><Field label="Duración"><input value={form.durationText} onChange={(event) => set("durationText", event.target.value)} placeholder="2 sesiones de 3 horas" /></Field><Field label="Facilitador/es"><input value={form.facilitators} onChange={(event) => set("facilitators", event.target.value)} /></Field></div><Field label="Dirigido a"><textarea value={form.targetAudience} onChange={(event) => set("targetAudience", event.target.value)} rows={3} /></Field><div className="form-grid"><Field label="Aprendizajes" hint="Uno por línea"><textarea value={form.learningOutcomes} onChange={(event) => set("learningOutcomes", event.target.value)} rows={6} /></Field><Field label="Qué incluye" hint="Uno por línea"><textarea value={form.includes} onChange={(event) => set("includes", event.target.value)} rows={6} /></Field></div><Field label="Información adicional"><textarea value={form.additionalInfo} onChange={(event) => set("additionalInfo", event.target.value)} rows={5} /></Field></section>
    </div>
    <aside className="admin-form-side"><section className="admin-card sticky-card"><h2>Publicación</h2><Field label="Estado"><select value={form.status} onChange={(event) => set("status", event.target.value as FormState["status"])}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></Field><label className="switch-row"><input type="checkbox" checked={form.salesOpen} onChange={(event) => set("salesOpen", event.target.checked)} /><span><strong>Ventas abiertas</strong><small>Permitir crear pagos</small></span></label><Field label="Modalidad"><select value={form.modality} onChange={(event) => set("modality", event.target.value as FormState["modality"])}><option value="online">En línea</option><option value="in_person">Presencial</option><option value="hybrid">Híbrido</option></select></Field><Field label="Precio MXN"><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} required /></Field><Field label="Cupo máximo" hint="Opcional"><input type="number" min="1" step="1" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} /></Field><div className="image-upload">{form.imageUrl ? <Image src={form.imageUrl} alt="Vista previa" fill sizes="320px" /> : <ImagePlus aria-hidden="true" />}<label><span>{uploading ? "Subiendo…" : form.imageUrl ? "Cambiar imagen" : "Subir imagen"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} /></label></div>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="admin-button" type="submit" disabled={saving || uploading}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "Guardando…" : "Guardar curso"}</button></section></aside>
  </form>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="field"><span>{label}{required && " *"}<small>{hint}</small></span>{children}</label>;
}
