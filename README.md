# Somos Proceso

Proyecto existente en Next.js App Router, React, Drizzle y PostgreSQL/Neon. Conserva el sitio público y añade administración de cursos y seguimiento manual de compradores. Las imágenes se guardan en Cloudflare R2 mediante el SDK S3. No hay cuentas de compradores ni envío automático de correos.

## Configuración

Requiere Node.js 22 o posterior. Instala con `npm install` y completa `.env.local` usando `.env.example` como referencia. Next.js y los scripts de Drizzle cargan `.env` y `.env.local`; los secretos no se incluyen en Git.

Variables necesarias para operar:

- `DATABASE_URL`: conexión a Neon con SSL.
- `ADMIN_USER`, `ADMIN_PASSWORD` (mínimo 10 caracteres), `ADMIN_SESSION_SECRET` (mínimo 32 caracteres aleatorios).
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`: credenciales y URL pública del bucket.
- `NEXT_PUBLIC_SITE_URL`: URL del sitio, sin diagonal final.

Stripe es opcional. El sitio, admin, Neon y R2 funcionan con sus variables vacías. El checkout responde «Los pagos en línea estarán disponibles próximamente.» hasta configurar tanto la llave secreta como el webhook.

## Base de datos

```bash
npm run db:generate
npm run db:migrate
```

La migración `0000` es la original y se conserva. `0001_rapid_risque.sql` cambia el valor predeterminado de zona horaria a `America/Monterrey`, permite compras sin sesión Stripe y añade `source` e `internalReference`. No borra tablas, columnas ni datos. Los índices existentes ya cubren curso, correo, fecha y estado de pago. La relación de compras restringe la eliminación de cursos con historial.

Cupo disponible e ingresos se calculan desde compras `paid`. Las compras pendientes, fallidas, expiradas o reembolsadas no cuentan. No se guarda `remainingSeats`. Los precios se convierten de texto decimal a centavos enteros; la moneda del formulario es MXN.

## Administración

Entra en `/admin/login` y visita:

- `/admin`: cuatro indicadores y las cinco últimas compras.
- `/admin/cursos`: edición, publicación, archivo, duplicación y eliminación cuando no hay compras.
- `/admin/cursos/nuevo` y `/admin/cursos/[id]`: formulario compartido, imagen, precio, fechas, horario, zona horaria y cupo.
- `/admin/compras`: búsqueda por nombre/correo/teléfono y filtros por curso, pago y estado del correo.
- `/admin/cursos/[id]/compradores`: resumen del curso y compradores, con los mismos filtros.

«Enviar correo» abre Gmail con destinatario, asunto y detalles reales del curso, además de un espacio para pegar la liga o información adicional. El administrador lo edita y envía manualmente; abrir Gmail nunca cambia `emailSent`. El checkbox separado guarda o limpia `emailSentAt`. Las notas se guardan con «Guardar nota» y son privadas. WhatsApp solo aparece con prefijo internacional explícito.

CSV respeta los filtros activos y el curso, incluye BOM UTF-8 para Excel y protege las celdas contra fórmulas. Páginas, consultas privadas y endpoints comprueban la sesión del lado del servidor. Las mutaciones comprueban también el origen y validan el input.

## Imágenes R2

Se aceptan JPEG, PNG, WebP y AVIF de hasta 5 MB. Se comprueba tamaño, MIME y firma del archivo; las claves son `courses/{uuid}.{extension}`. Las credenciales se usan exclusivamente en servidor.

Al cambiar una imagen, primero se confirma su existencia en R2 y se guarda la nueva referencia en Neon. Después se intenta borrar la anterior, solo si ningún curso la comparte. Una copia del curso conserva la imagen, pero empieza como borrador, sin fechas ni compradores. Si la subida falla, se conserva la imagen anterior. Una subida abandonada sin guardar puede dejar un objeto sin referencia en el bucket; no existe un proceso automático de limpieza.

## Datos de desarrollo

```bash
npm run db:seed
```

Seed idempotente con tres cursos demo y cinco compras (Ana Martínez, Carlos López y Fernanda Ruiz), con diferentes estados de pago y correo. Solo se permite en desarrollo (también en scripts locales sin `NODE_ENV` definido); se rechaza en `production` y `test`. No hay controles para crear compras ficticias en la interfaz.

Usa una base de desarrollo para el seed; no lo ejecutes contra una base comercial. Ninguna mutación pública permite crear compras pagadas.

## Stripe, cuando esté disponible

Configura `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y, si se necesita en una futura integración embebida, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Checkout alojado no usa la llave pública en el navegador. La inicialización del SDK es lazy y no ocurre al importar módulos.

Endpoints conservados:

- `POST /api/checkout`: consulta precio y contenido en Neon, verifica publicación, fecha, ventas y cupo; crea una compra pendiente y metadata `courseId`, `courseSlug`, `purchaseId`.
- `POST /api/stripe/webhook`: verifica la firma sobre el body original y procesa eventos en una transacción idempotente. El webhook puede crear la compra si llega antes que el registro pendiente. Los eventos fallidos o expirados no revierten pagos confirmados; los reembolsos completos se conservan como tales.

Configura estos eventos: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `charge.refunded`.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Antes de habilitar pagos reales, verifica un pago completo y reenvíos del webhook con las credenciales de Stripe. No hay reservas temporales: se revisa cupo al iniciar checkout; sesiones simultáneas aún pueden liquidarse más tarde. Los pagos recibidos se conservan para que el administrador gestione cualquier sobrecupo.

## Verificación

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Las pruebas unitarias cubren centavos, validaciones, zonas horarias, disponibilidad, Gmail, WhatsApp, imágenes, CSV y parámetros de filtros.

Después del build se pueden ejecutar las pruebas de integración contra Neon de desarrollo. En PowerShell:

```powershell
$env:RUN_DATABASE_TESTS = '1'
npm.cmd run test:integration
```

Inician un servidor local con credenciales admin efímeras y Stripe vacío, comprueban los flujos HTTP/Neon y eliminan únicamente sus propios datos temporales al terminar. Un segundo servidor verifica eventos de webhook con firmas generadas localmente, sin llamadas ni cobros de Stripe. No cambian las credenciales del proyecto.

## Despliegue

Usa un proveedor compatible con Next.js 16 y Node.js. Aplica `npm run db:migrate` antes de recibir tráfico. Stripe puede permanecer vacío. Los textos públicos y el logo existente se conservan. Los campos comerciales pendientes de `src/content/legal.ts` deben completarse por el propietario antes de aceptar pagos reales.
