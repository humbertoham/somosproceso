import type { Metadata } from "next";

import { educationDisclaimer, legalOwner } from "@/content/legal";

export const metadata: Metadata = { title: "Términos y condiciones", description: "Términos de compra y participación de Somos Proceso.", alternates: { canonical: "/terminos" } };

export default function TermsPage() {
  return <div className="page-wrap legal-page"><header className="page-hero"><p className="eyebrow">Información legal</p><h1>Términos y condiciones.</h1><p>Condiciones generales para comprar y participar en cursos de Somos Proceso.</p></header><aside className="legal-notice"><strong>Importante:</strong> esta versión es una base informativa y no sustituye una revisión jurídica. Las políticas comerciales pendientes deben completarse antes de aceptar pagos reales.</aside>
    <section><h2>1. Identidad y aceptación</h2><p>Estos términos regulan la compra y participación en cursos o talleres ofrecidos por {legalOwner.responsibleName}. Al comprar, la persona confirma que revisó la descripción del curso, su modalidad y estas condiciones.</p>
    <h2>2. Compra y pagos</h2><p>Los precios se muestran en pesos mexicanos (MXN), salvo indicación distinta. El pago se procesa mediante Stripe. La inscripción queda confirmada cuando Stripe notifica el pago exitoso a nuestros sistemas.</p>
    <h2>3. Acceso y participación</h2><p>Para experiencias en línea, la información de acceso —por ejemplo, una liga de Zoom— se envía manualmente al correo utilizado en la compra. La persona participante es responsable de proporcionar datos correctos, contar con conexión y no compartir accesos.</p>
    <h2>4. Cancelaciones y reembolsos</h2><p>{legalOwner.refundPolicy}. Esta política debe indicar plazos, condiciones, cargos aplicables y el canal para solicitar una cancelación.</p>
    <h2>5. Cambios de fecha y fuerza mayor</h2><p>Somos Proceso podrá ajustar fecha, horario, plataforma o facilitación cuando exista una causa justificada. Se informarán las alternativas aplicables. Las situaciones de fuerza mayor se atenderán de manera razonable conforme a las circunstancias.</p>
    <h2>6. Grabaciones</h2><p>Un curso solo incluye grabación cuando su página lo indica expresamente. Las reglas sobre grabación de participantes y tratamiento de imagen o voz deberán comunicarse antes de cada sesión.</p>
    <h2>7. Propiedad intelectual</h2><p>Los materiales se ofrecen para uso personal de participantes. No pueden reproducirse, venderse, publicarse ni compartirse sin autorización previa, salvo los usos permitidos por la ley.</p>
    <h2>8. Conducta y convivencia</h2><p>Se espera una participación respetuosa, confidencial y cuidadosa. Podemos limitar la participación ante conductas que pongan en riesgo el espacio o a otras personas, procurando una comunicación proporcional a la situación.</p>
    <h2>9. Alcance y responsabilidad</h2><p>{educationDisclaimer} Ante una emergencia, contacta a los servicios locales correspondientes. La responsabilidad se limitará de forma razonable y dentro de lo permitido por la legislación aplicable.</p>
    <h2>10. Privacidad y contacto</h2><p>El tratamiento de datos se describe en el aviso de privacidad. Contacto general: {legalOwner.contactEmail}.</p></section></div>;
}
