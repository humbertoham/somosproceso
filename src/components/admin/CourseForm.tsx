"use client";

import { ImagePlus, LoaderCircle, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { dateTimeInput, DEFAULT_TIMEZONE, zonedDateTimeToIso } from "@/lib/dates";
import { imageValidationError } from "@/lib/image-validation";
import { slugify, type Course } from "@/lib/utils";
import { courseInputSchema, priceInput } from "@/lib/validations/course";

type FormState = {
  title: string; slug: string; shortDescription: string; description: string; imageKey: string; imageUrl: string;
  price: string; currency: "MXN"; status: "draft" | "published" | "archived"; modality: "online" | "in_person" | "hybrid";
  startDate: string; endDate: string; timeText: string; timezone: string; durationText: string; facilitators: string;
  targetAudience: string; learningOutcomes: string; includes: string; additionalInfo: string; capacity: string; salesOpen: boolean;
};

function initialState(course?: Course | null): FormState {
  const timezone = course?.timezone ?? DEFAULT_TIMEZONE;
  return {
    title: course?.title ?? "", slug: course?.slug ?? "", shortDescription: course?.shortDescription ?? "", description: course?.description ?? "",
    imageKey: course?.imageKey ?? "", imageUrl: course?.imageUrl ?? "", price: course ? priceInput(course.priceCents) : "", currency: "MXN",
    status: course?.status ?? "draft", modality: course?.modality ?? "online", startDate: dateTimeInput(course?.startDate, timezone), endDate: dateTimeInput(course?.endDate, timezone),
    timeText: course?.timeText ?? "", timezone, durationText: course?.durationText ?? "", facilitators: course?.facilitators ?? "",
    targetAudience: course?.targetAudience ?? "", learningOutcomes: course?.learningOutcomes.join("\n") ?? "", includes: course?.includes.join("\n") ?? "",
    additionalInfo: course?.additionalInfo ?? "", capacity: course?.capacity ? String(course.capacity) : "", salesOpen: course?.salesOpen ?? false,
  };
}

export function CourseForm({ course, created = false }: { course?: Course | null; created?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialState(course));
  const revision = course?.updatedAt.toISOString() ?? "new";
  const [previousRevision, setPreviousRevision] = useState(revision);
  const [slugEdited, setSlugEdited] = useState(Boolean(course));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(created ? "Curso creado. Cambios guardados." : "");
  const [imageMessage, setImageMessage] = useState("");
  const [error, setError] = useState("");
  const processing = useRef(false);
  if (previousRevision !== revision) {
    setPreviousRevision(revision);
    setForm(initialState(course));
  }
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((state) => ({ ...state, [key]: value }));

  async function upload(file?: File) {
    if (!file || processing.current) return;
    const invalid = imageValidationError(file);
    if (invalid) { setError(invalid); return; }
    processing.current = true;
    setUploading(true); setError(""); setImageMessage("");
    try {
      const body = new FormData(); body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json() as { key?: string; url?: string; error?: string };
      if (!response.ok || !data.key || !data.url) throw new Error(data.error ?? "Error al subir imagen.");
      setForm((state) => ({ ...state, imageKey: data.key!, imageUrl: data.url! }));
      setImageMessage("Imagen subida. Guarda los cambios para usarla en el curso.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error al subir imagen."); }
    finally { processing.current = false; setUploading(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (processing.current) return;
    processing.current = true;
    setSaving(true); setError(""); setMessage("");
    try {
      const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
      const payload = { ...form, startDate: zonedDateTimeToIso(form.startDate, form.timezone), endDate: zonedDateTimeToIso(form.endDate, form.timezone), learningOutcomes: lines(form.learningOutcomes), includes: lines(form.includes) };
      const validation = courseInputSchema.safeParse(payload);
      if (!validation.success) throw new Error(validation.error.issues[0].message);
      if (form.status === "archived" && course?.status !== "archived" && !window.confirm("¿Archivar este curso? Dejará de mostrarse al público y conservará sus compradores.")) return;
      const response = await fetch(course ? `/api/admin/courses/${course.id}` : "/api/admin/courses", {
        method: course ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Error al guardar.");
      setMessage("Cambios guardados"); setImageMessage("");
      if (!course && data.id) router.replace(`/admin/cursos/${data.id}?created=1`);
      else router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error al guardar."); }
    finally { processing.current = false; setSaving(false); }
  }

  return <form onSubmit={save}>
    <fieldset className="course-form" disabled={saving || uploading}>
      <div className="admin-form-main">
        <section className="admin-card">
          <h2>Información principal</h2>
          <Field label="Título" required><input value={form.title} maxLength={180} onChange={(event) => { const title = event.target.value; setForm((state) => ({ ...state, title, slug: slugEdited ? state.slug : slugify(title).slice(0, 180).replace(/-$/, "") })); }} required /></Field>
          <Field label="Slug" hint="Dirección pública del curso" required><input value={form.slug} onChange={(event) => { setSlugEdited(true); set("slug", event.target.value.toLowerCase()); }} required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field>
          <Field label="Descripción corta" hint={`${form.shortDescription.length}/320`} required><textarea value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} rows={3} required maxLength={320} /></Field>
          <Field label="Descripción completa" hint="Puedes usar Markdown sencillo" required><textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={10} maxLength={30000} required /></Field>
        </section>
        <section className="admin-card">
          <h2>Detalles del encuentro</h2>
          <div className="form-grid">
            <Field label="Fecha de inicio" hint="Hora de la zona del curso"><input type="datetime-local" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
            <Field label="Fecha de finalización" hint="Opcional"><input type="datetime-local" value={form.endDate} onChange={(event) => set("endDate", event.target.value)} /></Field>
            <Field label="Horario como texto"><input value={form.timeText} maxLength={120} onChange={(event) => set("timeText", event.target.value)} placeholder="10:00 a 13:00 h" /></Field>
            <Field label="Zona horaria"><input value={form.timezone} maxLength={80} required onChange={(event) => set("timezone", event.target.value)} placeholder={DEFAULT_TIMEZONE} /></Field>
            <Field label="Duración"><input value={form.durationText} maxLength={120} onChange={(event) => set("durationText", event.target.value)} placeholder="2 sesiones de 3 horas" /></Field>
            <Field label="Facilitadores"><input value={form.facilitators} maxLength={10000} onChange={(event) => set("facilitators", event.target.value)} /></Field>
          </div>
          <Field label="Dirigido a"><textarea value={form.targetAudience} maxLength={10000} onChange={(event) => set("targetAudience", event.target.value)} rows={3} /></Field>
          <div className="form-grid">
            <Field label="Qué aprenderás" hint="Uno por línea"><textarea value={form.learningOutcomes} onChange={(event) => set("learningOutcomes", event.target.value)} rows={6} /></Field>
            <Field label="Qué incluye" hint="Uno por línea"><textarea value={form.includes} onChange={(event) => set("includes", event.target.value)} rows={6} /></Field>
          </div>
          <Field label="Información adicional"><textarea value={form.additionalInfo} maxLength={10000} onChange={(event) => set("additionalInfo", event.target.value)} rows={5} /></Field>
        </section>
      </div>
      <aside className="admin-form-side">
        <section className="admin-card sticky-card">
          <h2>Publicación</h2>
          <Field label="Estado"><select value={form.status} onChange={(event) => set("status", event.target.value as FormState["status"])}><option value="draft">Borrador</option><option value="published">Publicado</option>{course?.status === "archived" && <option value="archived">Archivado</option>}</select></Field>
          <label className="switch-row"><input type="checkbox" checked={form.salesOpen} onChange={(event) => set("salesOpen", event.target.checked)} /><span><strong>Ventas abiertas</strong><small>Permitir inscripciones cuando el curso esté disponible</small></span></label>
          <Field label="Modalidad"><select value={form.modality} onChange={(event) => set("modality", event.target.value as FormState["modality"])}><option value="online">En línea</option><option value="in_person">Presencial</option><option value="hybrid">Híbrido</option></select></Field>
          <Field label="Precio" required><input type="number" min="0" max="1000000" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} required /></Field>
          <Field label="Moneda"><select value={form.currency} onChange={() => set("currency", "MXN")}><option value="MXN">MXN — Peso mexicano</option></select></Field>
          <Field label="Cupo máximo" hint="Vacío: sin límite definido"><input type="number" min="1" max="100000" step="1" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} /></Field>
          <div className="image-upload">
            {form.imageUrl ? <Image src={form.imageUrl} alt="Vista previa del curso" fill sizes="320px" /> : <ImagePlus aria-hidden="true" />}
            <label><span>{uploading ? "Subiendo..." : form.imageUrl ? "Cambiar imagen" : "Subir imagen"}</span><input aria-label="Imagen del curso" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label>
          </div>
          <p className="field-hint">JPEG, PNG, WebP o AVIF. Máximo 5 MB.</p>
          {imageMessage && <p className="form-success" role="status">{imageMessage}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="admin-button" type="submit">{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "Guardando..." : course ? "Guardar cambios" : "Crear curso"}</button>
        </section>
      </aside>
    </fieldset>
  </form>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="field"><span>{label}{required && " *"}<small>{hint}</small></span>{children}</label>;
}
