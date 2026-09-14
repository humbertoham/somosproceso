# Somos Proceso

Aplicación web para publicar y vender cursos/talleres. Incluye sitio público, Stripe Checkout, webhook idempotente, catálogo administrable, imágenes en Cloudflare R2 y seguimiento manual de compradores.

## Requisitos

- Node.js 22 o posterior
- Una base PostgreSQL en Neon
- Una cuenta de Stripe y Stripe CLI para pruebas locales
- Un bucket público de Cloudflare R2

No utiliza Docker.

## Instalación

```bash
npm install
cp .env.example .env.local
```

Completa `.env.local`. Genera `ADMIN_SESSION_SECRET` con al menos 32 caracteres aleatorios. No uses credenciales reales en `.env.example` ni subas `.env.local` al repositorio.

## Base de datos Neon

1. Crea un proyecto y una base en Neon.
2. Copia la connection string con SSL en `DATABASE_URL`.
3. Genera y aplica el esquema:

```bash
npm run db:generate
npm run db:migrate
```

Opcionalmente carga tres cursos identificados como demostración:

```bash
npm run db:seed
```

El seed es idempotente y fácil de retirar desde el panel o la base de datos.

## Cloudflare R2

1. Crea un bucket y habilita una URL pública (dominio propio o `r2.dev`).
2. Crea un token con permisos de lectura/escritura sobre ese bucket.
3. Configura `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` y `R2_PUBLIC_URL`.
4. Coloca el SVG oficial, sin modificarlo, en `public/logo.svg`.

El upload acepta JPEG, PNG, WebP y AVIF de hasta 5 MB. Las credenciales nunca llegan al navegador.

## Stripe

1. Copia las llaves de prueba a `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Inicia el reenvío local de eventos:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copia el secreto `whsec_...` mostrado por Stripe CLI a `STRIPE_WEBHOOK_SECRET`.
4. En producción registra `https://tu-dominio.mx/api/stripe/webhook` y escucha `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed` y `charge.refunded`.

Los métodos de pago se controlan desde Stripe. La aplicación nunca almacena tarjetas y siempre toma el precio desde PostgreSQL. La página de éxito no cambia el estado de una compra; solo el webhook firmado puede hacerlo.

## Desarrollo y validación

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

Visita `http://localhost:3000`. La administración está en `/admin/login` y utiliza `ADMIN_USER` y `ADMIN_PASSWORD`.

## Flujo de administración

1. Inicia sesión.
2. Crea un curso, completa precio y detalles y sube la imagen.
3. Activa ventas y cambia el estado a “Publicado”.
4. Revisa compras en `/admin/compras`.
5. Envía manualmente la información del curso y confirma el checkbox “Correo enviado”.
6. Agrega notas internas o exporta el CSV cuando sea necesario.

## Flujo de compra

La persona abre un curso publicado, acepta términos, va a Stripe Checkout y paga. El endpoint de checkout valida publicación, disponibilidad y precio en la base. El webhook firmado actualiza la compra de forma idempotente. El administrador ve el pago y da seguimiento manual por correo.

## Antes de producción

- Reemplazar los campos entre corchetes de `src/content/legal.ts` y obtener revisión jurídica del aviso de privacidad, términos, procedimiento ARCO, facturación, cancelaciones y reembolsos.
- Sustituir/eliminar el contenido del seed y agregar el logo oficial en `public/logo.svg`.
- Confirmar correo de contacto, horarios, zona horaria, cupos y textos de cada curso.
- Probar un pago completo y un webhook reenviado en modo de prueba de Stripe.
- Configurar copias de seguridad y retención en Neon/R2.
- Proteger `/admin` adicionalmente con rate limiting o WAF del proveedor de hosting. La app ya aplica espera y límite básico en memoria, pero un control perimetral es más sólido en producción.
- Usar HTTPS, variables secretas del proveedor y una contraseña administrativa única y robusta.

## Deployment

Despliega en un proveedor compatible con Next.js 16 y Node.js. Configura todas las variables de `.env.example`, aplica `npm run db:migrate` antes de recibir tráfico, define `NEXT_PUBLIC_SITE_URL` con el dominio final y registra el webhook de producción en Stripe. No ejecutes el seed salvo que quieras contenido de demostración.
