# Florece 13

La vitrina digital de los comercios de la Comuna 13 de Medellín. Cada tienda del barrio tiene su espacio en línea (perfil, portada, historia y catálogo) y recibe los pedidos directo en su WhatsApp.

> **Tu negocio florece aquí.**

## Qué hace hoy

**Compradores** (web app pensada para celular, instalable como app):
- Inicio con buscador, categorías, tiendas y productos recién publicados.
- Búsqueda por texto y categoría, listado de tiendas.
- Perfil de tienda: portada, logo, historia, sector de la 13, catálogo, WhatsApp e Instagram.
- Ficha de producto: galería, precio (con precio anterior tachado), "Pedir por WhatsApp" y "Agregar al carrito".
- Carrito agrupado por tienda y checkout: el pedido **se guarda en la base de datos** y el comprador lo envía a la tienda por WhatsApp con el resumen ya escrito. Recibe un link para consultar el estado.

**Comerciantes** (`/panel`):
- Registro → crear tienda (nombre, categoría, WhatsApp, sector, Instagram).
- Resumen: pedidos nuevos, pedidos y ventas del mes, lista de pasos para completar la tienda.
- Productos: crear, editar, borrar, marcar como agotado. Hasta 6 fotos por producto, ordenables. Las fotos se reducen en el celular antes de subirlas (ahorra datos) y el servidor las normaliza a WebP.
- Pedidos: lista con filtros por estado, detalle, cambio de estado (el comprador lo ve en su link) y mensaje de WhatsApp prearmado para el cliente.
- Mi tienda: logo, portada, historia, dirección, forma de entrega (envío nacional y/o recoger).
- QR y sticker "Florece aquí" para imprimir o descargar.

**Administración** (`/admin`):
- Las tiendas nuevas quedan **en revisión** y no son públicas hasta que un admin las aprueba (para confirmar que son de la Comuna 13). También se pueden suspender. Si un comerciante olvida la clave, el admin le genera una temporal ("Nueva clave").
- Quien se registre con un correo listado en `ADMIN_EMAILS` queda como administrador.

**Pagos:** en esta versión el pago y el envío se acuerdan por WhatsApp (Nequi, transferencia, contraentrega…). La base de datos ya tiene los campos para el pago en la app (`orders.channel`, `payment_status`, `payment_reference`, `stores.order_mode`), así que conectar una pasarela no requiere cambiar el modelo.

## Stack

- **Next.js 16** (App Router, Server Actions) + React 19 + TypeScript
- **PostgreSQL** con **Drizzle ORM** (migraciones SQL versionadas en `drizzle/`)
- Sesiones propias: clave con bcrypt y cookie httpOnly; en la base se guarda solo el hash SHA-256 del token
- Fotos: `sharp` + disco local o cualquier almacenamiento compatible con S3 (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO)
- Sistema visual del manual de marca: Archivo Black + Archivo (servidas por la misma app), paleta con variantes AA y logo en la **ruta B, "El 13 que florece"**

## Puesta en marcha

Requisitos: Node 20+ y PostgreSQL 14+.

```bash
npm install
cp .env.example .env        # completar DATABASE_URL, APP_URL y ADMIN_EMAILS
npm run db:migrate          # crea las tablas
npm run db:seed             # carga las 6 categorías (artesanías, ropa, comida, arte, souvenirs, servicios)
npm run dev                 # http://localhost:3000
```

El seed **no** crea tiendas ni productos de ejemplo: todo lo que aparece en la plataforma lo cargan los comerciantes.

Primer uso: registrate en `/registro` con un correo de `ADMIN_EMAILS` para tener la cuenta de administración. Los comerciantes se registran desde `/vende`.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `APP_URL` | URL pública (se usa en el QR, los links de WhatsApp y el sitemap) |
| `ADMIN_EMAILS` | Correos con rol de administrador, separados por coma |
| `STORAGE_DRIVER` | `local` (carpeta `./uploads`) o `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Credenciales del bucket (solo con `s3`) |
| `S3_PUBLIC_URL` | URL pública del bucket, sin `/` al final |

## Producción

```bash
npm run build
npm run db:migrate
npm start
```

- En hosting sin disco persistente (Vercel, Railway, Render, contenedores) usá `STORAGE_DRIVER=s3`: con `local` las fotos se pierden en cada despliegue.
- El bucket debe permitir lectura pública de los objetos (o ponerle un CDN delante) y `S3_PUBLIC_URL` debe apuntar ahí.
- Todas las páginas se renderizan en cada request (el contenido cambia constantemente y depende de la sesión).

## Estructura

```
src/
  app/                 rutas (App Router)
    page.tsx           inicio
    buscar/ tiendas/   descubrimiento
    t/[slug]/          perfil de tienda
    p/[id]/            ficha de producto
    carrito/           carrito, checkout (carrito/[storeId]) y server actions de pedidos
    pedido/[id]/       confirmación y estado del pedido para el comprador
    vende/             landing para comercios
    entrar/ registro/  acceso
    panel/             panel del comerciante
    admin/             aprobación de tiendas
    api/subir/         subida de fotos
    media/[...key]/    fotos en disco (STORAGE_DRIVER=local)
  components/          UI compartida (logo, íconos, tarjetas, carrito, subida de fotos)
  db/                  esquema Drizzle, cliente, migrador y seed
  lib/                 auth, queries, storage, formato, WhatsApp, server actions
drizzle/               migraciones SQL
docs/diseno/           briefing, manual de marca y handoff de Claude Design
```

Para cambiar el esquema: editá `src/db/schema.ts`, corré `npm run db:generate` y después `npm run db:migrate`.

## Pendiente para próximas versiones

- Pago dentro de la app (pasarela por definir) usando los campos ya previstos.
- Recuperación de clave por correo. Hoy el admin genera una clave temporal desde `/admin` ("Nueva clave") y se la pasa al comerciante.
- Notificación al comerciante por correo/WhatsApp Business API cuando entra un pedido (hoy le llega porque el comprador le escribe).
- Sección de historias del barrio, plantillas de redes y logo en arte final (vertical, monocromo).
