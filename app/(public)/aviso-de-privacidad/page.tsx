import type { Metadata } from "next";

import { educationDisclaimer, legalOwner } from "@/content/legal";

export const metadata: Metadata = { title: "Aviso de privacidad", description: "Aviso de privacidad de Somos Proceso.", alternates: { canonical: "/aviso-de-privacidad" } };

export default function PrivacyPage() {
  return <div className="page-wrap legal-page"><header className="page-hero"><p className="eyebrow">Información legal</p><h1>Aviso de privacidad.</h1><p>Versión base pendiente de revisión por el propietario.</p></header><aside className="legal-notice"><strong>Importante:</strong> este contenido es una base informativa y no constituye asesoría jurídica. Los campos entre corchetes deben completarse y el documento debe revisarse antes de producción.</aside>
    <section><h2>1. Responsable del tratamiento</h2><p><strong>{legalOwner.responsibleName}</strong>, con domicilio en {legalOwner.address}, es responsable del tratamiento de los datos personales recabados a través de este sitio.</p>
    <h2>2. Datos personales recabados</h2><p>Podemos recabar nombre, correo electrónico, teléfono opcional, información relacionada con la compra y datos técnicos básicos necesarios para operar el sitio. Los datos de tarjeta son procesados por Stripe y no se almacenan en nuestros sistemas.</p>
    <h2>3. Finalidades</h2><p>Usamos estos datos para procesar pagos, identificar compras, entregar manualmente información de acceso, atender consultas, dar seguimiento administrativo, cumplir obligaciones legales y proteger la operación del sitio.</p>
    <h2>4. Transferencias y encargados</h2><p>Los datos pueden ser tratados por proveedores necesarios para operar el servicio, como Stripe para pagos, Neon para base de datos, Cloudflare para almacenamiento y el proveedor de alojamiento. Cada proveedor aplica sus propios términos y medidas de seguridad.</p>
    <h2>5. Derechos ARCO</h2><p>Puedes solicitar acceso, rectificación, cancelación u oposición, así como revocar tu consentimiento, mediante el procedimiento que el responsable deberá definir. Contacto: {legalOwner.privacyEmail}. <strong>[COMPLETAR PLAZOS, REQUISITOS Y PROCEDIMIENTO ARCO]</strong>.</p>
    <h2>6. Cookies y tecnologías</h2><p>El sitio utiliza cookies estrictamente necesarias para la sesión administrativa y tecnologías esenciales para completar el pago. Cualquier herramienta adicional de analítica deberá documentarse aquí antes de habilitarse.</p>
    <h2>7. Cambios al aviso</h2><p>Las modificaciones se publicarán en esta misma página indicando su fecha de actualización.</p>
    <h2>8. Contacto</h2><p>Para dudas relacionadas con privacidad: {legalOwner.privacyEmail}.</p></section><aside className="disclaimer"><strong>Alcance de los contenidos</strong><p>{educationDisclaimer}</p></aside></div>;
}
