# Documentación técnica — Baral Audit Dashboard

> Documento generado el 18 de agosto de 2026. Cubre stack, arquitectura, integraciones externas, configuración de despliegue e historial del repositorio tal como existían en ese momento. Es una fotografía puntual — si el proyecto sigue evolucionando, este documento debe regenerarse.

**Repositorio:** `https://github.com/Univers77/baral-audit-dashboard`
**Producción:** `https://baral-audit-dashboard.vercel.app`
**Ruta local:** `D:\GGLabs\baral-audit-dashboard`

---

## 1. Resumen ejecutivo

Baral Audit Dashboard es una aplicación web que escanea sitios de terceros bajo demanda y produce un diagnóstico digital completo: SEO on-page, rendimiento (Core Web Vitals reales y de laboratorio), accesibilidad, señales de conversión, stack tecnológico detectado, evidencia visual multi-dispositivo, comparación contra competidores en vivo y un informe ejecutivo descargable en PDF. Fue construida para **Baral — Estrategia Integral Creativa**, tanto como herramienta de venta/diagnóstico frente a clientes potenciales como de auditoría del propio sitio de la agencia.

El usuario pega una URL, la app hace fetch y parseo del HTML en el servidor, aplica un motor de heurísticas propio ("AUDITOR-X"), opcionalmente enriquece el resultado con Claude (Anthropic) y — si el usuario lo pide — cruza los datos con la API oficial de Google PageSpeed Insights y con Google Analytics 4 (vía OAuth del propio usuario). Todo el proceso se transmite al navegador en tiempo real mediante Server-Sent Events.

---

## 2. Arquitectura general

- **Framework:** Next.js 16.3.0 (App Router, Turbopack), React 19.
- **Despliegue:** Vercel (funciones serverless Node.js para las rutas API; filesystem de solo lectura salvo `/tmp`).
- **Estilo visual:** Tailwind CSS v4 + shadcn/ui (estilo `base-nova`), tema "cosmos" (starfield animado, planeta 3D de marca, video de fondo).
- **Sin base de datos.** La persistencia es archivos JSON en disco (efímeros en Vercel) y `localStorage` del navegador para el historial de escaneos del usuario.

### Flujo de un escaneo, paso a paso

1. El usuario pega una URL en `components/scanner/url-scanner.tsx` y envía el formulario.
2. El cliente abre una conexión `EventSource` contra `GET /api/analyze?url=...`.
3. El servidor (`app/api/analyze/route.ts`) ejecuta, en streaming:
   - `fetchAndScan()` (`lib/scanner/fetcher.ts`) — descarga el HTML del sitio objetivo, lo parsea con `cheerio`, detecta ~30 señales técnicas y arma las URLs de captura de pantalla (Microlink).
   - `analyze()` (`lib/scanner/analyzer.ts`) — aplica las heurísticas AUDITOR-X y calcula los 4 scores + hallazgos priorizados.
   - `enrichWithClaude()` (`lib/scanner/claude-analyzer.ts`) — opcional, si hay `ANTHROPIC_API_KEY`: le pide a Claude Haiku un resumen ejecutivo y quick wins sobre los datos ya calculados.
   - `saveResult()` (`lib/scanner/writer.ts`) — guarda el resultado en disco, sin bloquear la respuesta y con fallo silencioso si el filesystem es de solo lectura.
4. El cliente recibe el resultado completo (`AuditResult`) vía el evento `result` del SSE y renderiza todas las secciones del dashboard.
5. Opcionalmente, el usuario puede:
   - Pedir datos de **Google PageSpeed Insights** (`GET /api/psi`) para complementar con Core Web Vitals de campo real (CrUX) y de laboratorio (Lighthouse).
   - Conectar **Google Analytics 4** vía OAuth (`components/ga4/ga4-connect.tsx` → `POST /api/ga4/data`) para traer métricas de comportamiento reales en vez de estimaciones de sector.
   - Descargar un **PDF ejecutivo** generado en el propio navegador (`lib/pdf/generate.ts`) o un **JSON** con todos los datos crudos.

---

## 3. Stack tecnológico completo

Gestor de paquetes: **pnpm** (con `pnpm.overrides: { hono: "4.12.25" }` fijando una dependencia transitiva). Paquete interno: `my-project@0.1.0` (privado).

### `dependencies`

| Paquete | Versión | Uso específico en este proyecto |
|---|---|---|
| `@anthropic-ai/sdk` | ^0.117.1 | Cliente oficial de Claude, usado en `lib/scanner/claude-analyzer.ts` para enriquecer cada auditoría con IA (modelo `claude-haiku-4-5-20251001`). |
| `@base-ui/react` | ^1.5.0 | Componentes UI headless, soporte de la capa `shadcn/ui`. |
| `@types/cheerio` | ^1.0.0 | Tipos TypeScript para `cheerio`. |
| `@vercel/analytics` | 1.6.1 | Analítica de uso del propio dashboard (no de los sitios auditados), activa solo en `NODE_ENV=production`. |
| `cheerio` | ^1.2.0 | Parser HTML servidor-side tipo jQuery; motor central de extracción en `lib/scanner/fetcher.ts` (title, metas, headings, imágenes, schema JSON-LD, enlaces, etc.). |
| `class-variance-authority` | ^0.7.1 | Variantes de clases Tailwind en componentes UI. |
| `clsx` | ^2.1.1 | Combinador condicional de clases CSS (usado dentro de `lib/utils.ts`). |
| `html2canvas` | ^1.4.1 | Captura de DOM a canvas para generar el PDF ejecutivo (`lib/pdf/generate.ts`). |
| `jspdf` | ^4.2.1 | Ensambla el archivo PDF final a partir de los canvas capturados (`lib/pdf/generate.ts`). |
| `lenis` | ^1.3.26 | Smooth scroll global (`components/smooth-scroll.tsx` / `smooth-scroll-provider.tsx`). |
| `lucide-react` | ^1.16.0 | Librería de iconos usada en toda la interfaz. |
| `next` | 16.3.0 | Framework: App Router, rutas API, streaming SSE. |
| `react` / `react-dom` | ^19 | Runtime de UI. |
| `shadcn` | ^4.8.0 | CLI/registro de componentes shadcn/ui (`components.json`, estilo `base-nova`). |
| `tailwind-merge` | ^3.3.1 | Fusiona clases Tailwind sin colisiones (`lib/utils.ts`). |
| `tw-animate-css` | ^1.4.0 | Utilidades de animación CSS complementarias a Tailwind. |

### `devDependencies`

| Paquete | Versión | Uso |
|---|---|---|
| `@tailwindcss/postcss` | ^4.3.3 | Plugin PostCSS de Tailwind v4. |
| `@types/node` | ^24 | Tipos Node para TypeScript. |
| `@types/react` / `@types/react-dom` | ^19 | Tipos React. |
| `postcss` | ^8.5 | Procesador CSS (`postcss.config.mjs`). |
| `tailwindcss` | ^4.3.3 | Framework CSS utility-first, base del sistema visual. |
| `typescript` | 5.7.3 | Lenguaje/compilador. |

---

## 4. Rutas API (`app/api/*/route.ts`)

### `GET /api/analyze?url=...`
Endpoint central del escáner. `dynamic='force-dynamic'`, `runtime='nodejs'`. Devuelve un **stream Server-Sent Events** (`text/event-stream`) con eventos `progress`, `result`, `error`, `done`. Orquesta fetch + parseo → heurísticas → enriquecimiento IA (degradación graciosa si falla) → guardado en disco (no bloqueante). Sin caché explícito.

### `GET /api/psi?url=...&strategy=mobile|desktop`
Llama a la **API oficial de Google PageSpeed Insights v5** pidiendo las categorías `performance`, `accessibility`, `best-practices`, `seo`. Variable de entorno opcional: `PAGESPEED_API_KEY` (sin ella usa la cuota pública compartida de Google, que se agota fácilmente). `runtime='nodejs'`, `maxDuration=60` (Lighthouse puede tardar 15-40s). **Caché en memoria del proceso** (`Map` con TTL de 30 minutos, clave `strategy::url`). Maneja explícitamente el 429 (cuota agotada) con mensaje claro al usuario, y timeout de 55s.

### `POST /api/ga4/data`
Body: `{ accessToken, propertyId }`. Llama a la **Google Analytics Data API (GA4)** (`analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`) en 4 llamadas paralelas: métricas principales, top páginas, split por dispositivo, canales de tráfico (últimos 30 días). No guarda ninguna credencial server-side — recibe el `accessToken` de OAuth ya obtenido en el navegador.

### `GET /api/history`
Lee el directorio de caché de auditorías previas (`/tmp/audit-cache` en Vercel, ruta local en Windows) y devuelve la lista ordenada por fecha. `dynamic='force-dynamic'`.

### `GET /api/proxy-image?src=...`
Proxy server-side de imágenes externas (capturas de Microlink, logo) que las convierte a data URI base64, para evitar el bloqueo CORS de `html2canvas` al generar el PDF. Valida que el protocolo sea `http`/`https`, timeout de 20s. `runtime='nodejs'`, `maxDuration=30`.

### `POST` / `GET /api/queue`
Sistema de cola de auditorías pendientes basado en un archivo JSON en disco. **Usa una ruta absoluta de Windows hardcodeada** (`D:/GGLabs/audit-queue/pending.json`) — ver sección 13, no funcionará en Vercel/Linux.

---

## 5. Integraciones con servicios externos

### Anthropic Claude API
- **Archivo:** `lib/scanner/claude-analyzer.ts`, función `enrichWithClaude()`.
- **Variable de entorno:** `ANTHROPIC_API_KEY`. Si no está configurada, la función retorna `null` sin romper el flujo (degradación graciosa).
- **Modelo:** `claude-haiku-4-5-20251001`, `max_tokens: 1000`.
- **Qué hace:** recibe un payload JSON con todos los datos técnicos ya calculados (scores, hallazgos, señales SEO/performance) y le pide a Claude un JSON estructurado con resumen ejecutivo, prioridad máxima, quick wins, nota estratégica y nivel de confianza de los datos. Se invoca como paso 4 del stream SSE de `/api/analyze`.
- El SDK está declarado en `serverExternalPackages` en `next.config.mjs` para que Next no lo empaquete y se resuelva como dependencia Node nativa en el servidor.
- Nota aparte: `lib/packages.ts` menciona los modelos `claude-haiku-4-5`, `claude-sonnet-5` y `claude-opus-5` como parte del texto comercial de los tres paquetes de servicio de Baral (Radiografía/Resonancia/Quirófano) — es contenido de marketing, no llamadas reales adicionales a la API.

### Google PageSpeed Insights API v5
- **Archivo:** `app/api/psi/route.ts`.
- **Endpoint:** `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, con parámetros `url`, `strategy` (mobile/desktop) y 4 `category` (performance, accessibility, best-practices, seo), más `key` si hay `PAGESPEED_API_KEY`.
- **Parseo:** `lib/psi/parse.ts` separa explícitamente datos de **campo real (CrUX, últimos 28 días de usuarios reales de Chrome)** de datos de **laboratorio (Lighthouse, simulación)**, extrae Core Web Vitals (LCP, INP, CLS, FCP, TTFB) con los umbrales oficiales de web.dev/vitals, oportunidades de optimización, auditorías fallidas y la tira de miniaturas de carga (filmstrip).

### Microlink API (capturas de pantalla)
- **Archivos:** `lib/scanner/fetcher.ts` (`deviceShotUrl`) y `lib/scanner/shots.ts` (`shotUrl`) — la lógica está duplicada en ambos.
- **Endpoint:** `https://api.microlink.io/?url=...&screenshot=true&meta=false&viewport.width=...&viewport.height=...&viewport.deviceScaleFactor=...&viewport.isMobile=...&viewport.hasTouch=...&waitForTimeout=3500&type=jpeg&embed=screenshot.url`.
- No requiere API key propia (uso del servicio público de Microlink).
- Captura 3 viewports reales por sitio: móvil (390×844, scale 2), tablet (820×1180, scale 2), escritorio (1440×900, scale 1). Se usa `waitForTimeout=3500` en vez de `waitUntil=networkidle0` a propósito: sitios con analítica/polling en segundo plano nunca alcanzan "networkidle" y producían capturas en blanco.

### Google Analytics 4 — OAuth + Data API
- **Componente:** `components/ga4/ga4-connect.tsx`.
- **Variable de entorno pública:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (client ID de OAuth de Google Cloud).
- **Flujo:** carga `https://accounts.google.com/gsi/client` (Google Identity Services), inicializa `google.accounts.oauth2.initTokenClient` con scope `https://www.googleapis.com/auth/analytics.readonly`. El usuario autoriza en un popup, obtiene un `access_token` client-side, ingresa manualmente el Property ID de GA4, y ese token se envía al backend.
- **Backend:** `app/api/ga4/data/route.ts` reenvía el token como Bearer a la GA4 Data API. El token nunca se persiste server-side.

### Otros fetches externos
- **robots.txt / sitemap.xml / llms.txt** — `lib/scanner/fetcher.ts` hace fetch en paralelo a los tres, con timeout de 5s cada uno, solo para verificar existencia (`res.ok`). `llms.txt` es el estándar propuesto para guiar crawlers de LLMs.
- **Fetch del sitio auditado** — User-Agent custom `Mozilla/5.0 (compatible; MasterWebAuditor/2.0; +https://baralintegral.com)`, timeout de 15s.
- **@vercel/analytics** — telemetría de uso del propio dashboard, no de los sitios auditados.

---

## 6. Motor de escaneo (`lib/scanner/`)

| Archivo | Qué hace |
|---|---|
| `fetcher.ts` | Núcleo del scan: fetch HTTP del sitio objetivo, parseo con `cheerio`, extracción de ~30 señales (title, meta, headings, imágenes/alt, schema JSON-LD, OG/Twitter, enlaces internos/externos, emails en texto plano, hreflang, favicon, iframes, estilos inline, conteo de palabras), detección de stack tecnológico por regex sobre el HTML completo (~25 firmas: WordPress, Elementor, Shopify, Next.js, React, GA4, GTM, Cloudflare, etc.), verificación de robots.txt/sitemap.xml/llms.txt, construcción de URLs de captura Microlink por dispositivo. |
| `analyzer.ts` | Motor de heurísticas "AUDITOR-X" (módulos M00-M19). Convierte el `RawScan` en un `AuditResult` con hallazgos completos (`findings`, P0/P1) y compactos (`compactFindings`, P2/P3), calcula 4 scores (SEO 35%, Performance 25%, Accesibilidad 20%, Conversión 20%) y un `overall` ponderado. Cada hallazgo trae severidad, confianza, alcance e impacto de negocio (`Risk = Severity × Confidence × Scope × BusinessImpact`). |
| `claude-analyzer.ts` | Enriquecimiento con Claude Haiku vía Anthropic SDK (ver sección 5). |
| `shots.ts` | Helper de URLs de captura Microlink por dispositivo (duplica parte de `fetcher.ts`) y selección inteligente de qué páginas internas capturar (`selectPageShots`), priorizando servicios/portafolio/contacto sobre legal/blog. |
| `writer.ts` | Persiste el resultado: JSON en el directorio de caché (`/tmp/audit-cache` en Vercel) y, en local, además un Markdown formateado para un vault de Obsidian (con manejo de error si la ruta no existe). |
| `types.ts` | Tipos centrales del dominio: `RawScan`, `AuditResult`, `AuditFinding`, `AuditCompactFinding`, `DeviceShots`, `ScanError`. |

---

## 7. Librerías de soporte (`lib/`)

| Archivo/carpeta | Propósito |
|---|---|
| `audit-data.ts` | Dataset hardcodeado de una auditoría ya realizada a `baralintegral.com` (findings, benchmarks competitivos, roadmap, hipótesis de conversión, gaps de datos). Ver nota en sección 13. |
| `benchmarks.ts` | Umbrales objetivos citables (Core Web Vitals, Google Search Central, WCAG 2.2) para clasificar métricas de cualquier sitio escaneado como bueno/mejorable/deficiente. Define también la estructura `Competitor` para comparación en vivo. |
| `history.ts` | Historial de escaneos en `localStorage` del navegador (clave `auditorx-scan-history`, máx. 10 entradas), con cálculo de nota A-F. |
| `packages.ts` | Clasificación de "madurez digital" del sitio (`classify()`) y catálogo de los 3 paquetes comerciales de Baral (Radiografía USD 290 / Resonancia USD 780 / Quirófano USD 2400), cada uno asociado a un modelo de Claude distinto. |
| `pdf/generate.ts` | Generación del PDF ejecutivo descargable en el navegador, con `html2canvas` + `jsPDF`. Convierte imágenes cross-origin a data URI vía `/api/proxy-image` antes de capturar, corta cada sección en páginas A4, expone el hook `usePdfDownload`. |
| `psi/parse.ts` + `psi/types.ts` | Normalización de la respuesta de PageSpeed Insights v5 en tipos limpios, separando campo (CrUX) de laboratorio (Lighthouse). |
| `ga4/types.ts` | Tipos para métricas GA4 (`GA4Metrics`) y estado de conexión OAuth. |
| `utils.ts` | Utilidad `cn()` (combina `clsx` + `tailwind-merge`, patrón estándar shadcn/ui). |

---

## 8. Componentes (`components/`)

| Carpeta | Contenido |
|---|---|
| `audit/` | 16 componentes — las secciones principales del dashboard: `hero`, `constellation-map` (matriz impacto×esfuerzo), `findings-section`, `metrics-section`, `psi-section`, `evidence-section`, `competitive-section`, `trajectory-section`, `roadmap-section`, `methodology-section`, `packages-section`, `export-section`, `executive-report` (documento imprimible/PDF), `footer-section`, `site-nav`, `baral-planet` (planeta 3D animado). |
| `brand/` | `baral-logo.tsx` — logo oficial de marca renderizado nativamente. |
| `cosmos/` | `primitives.tsx`, `starfield.tsx`, `video-background.tsx` — sistema visual temático "espacio" (fondo de estrellas, video del horizonte del planeta Baral). |
| `ga4/` | `ga4-connect.tsx` — flujo completo de conexión OAuth + fetch de métricas GA4. |
| `scanner/` | `url-scanner.tsx` (formulario principal que dispara el análisis vía SSE) y `device-rendering.tsx`. |
| `ui/` | `button.tsx` — componente base shadcn/ui (`style: "base-nova"`). |
| raíz | `smooth-scroll.tsx` / `smooth-scroll-provider.tsx` — envoltorio de Lenis para scroll suave global. |

---

## 9. Variables de entorno

| Variable | Archivo(s) | Propósito |
|---|---|---|
| `ANTHROPIC_API_KEY` | `lib/scanner/claude-analyzer.ts` | Credencial de la API de Claude para el enriquecimiento IA de cada auditoría. |
| `PAGESPEED_API_KEY` | `app/api/psi/route.ts` | Credencial opcional de Google PageSpeed Insights; sin ella se usa la cuota pública compartida de Google. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `components/ga4/ga4-connect.tsx` | Client ID de OAuth de Google Cloud para conectar GA4 (pública, expuesta al navegador por el prefijo `NEXT_PUBLIC_`). |
| `VERCEL` | `app/api/history/route.ts`, `lib/scanner/writer.ts` | Flag automática de Vercel para decidir la ruta de caché en disco. |
| `NODE_ENV` | `app/layout.tsx` | Controla si se carga `@vercel/analytics` (solo en `production`). |

*(Solo se documentan nombres y propósito — ningún valor de estas variables fue leído ni se expone aquí.)*

---

## 10. Build y despliegue

- **`next.config.mjs`:**
  - `typescript.ignoreBuildErrors: true` y `eslint.ignoreDuringBuilds: true` — el build de producción **no falla** por errores de tipos ni de lint (ver riesgo en sección 13).
  - `images.unoptimized: true` — desactiva la optimización de imágenes de Next (las imágenes son capturas externas de Microlink, no assets propios optimizables por Next).
  - `serverExternalPackages: ['@anthropic-ai/sdk']` — excluye el SDK de Anthropic del bundling, para que se resuelva como dependencia Node nativa en el servidor.
- **`tsconfig.json`:** target ES6, `strict: true`, `moduleResolution: "bundler"`, alias `@/*` → raíz del proyecto.
- **`components.json`** (config de shadcn/ui): estilo `base-nova`, RSC habilitado, base color `neutral`, librería de iconos `lucide`.
- **`.claude/launch.json`:** configuración de arranque del agente Claude Code para dev local — `pnpm dev --port 3741`. No es configuración de Vercel.
- **No existe `vercel.json`** — el despliegue usa la config por defecto de Next.js más las opciones exportadas en cada `route.ts` (`runtime`, `maxDuration`, `dynamic`).
- **`.gitignore`:** ignora artefactos de sandbox "v0" (`__v0_runtime_loader.js`, `.v0-trash/`), `.env*.local`, `node_modules`, `.next/`, `.vercel` — indica que el proyecto se originó/edita también vía v0.dev de Vercel.

---

## 11. Repositorio Git

**Remoto:** `origin` → `https://github.com/Univers77/baral-audit-dashboard.git`

**Historial reciente (más nuevo primero):**

| Commit | Mensaje |
|---|---|
| `d3e76f0` | feat(pagespeed,pdf): filmstrip de carga, PDF descargable real y lenguaje simple |
| `8b3fd0b` | feat(pagespeed): integra la API oficial de Google PageSpeed Insights |
| `f2a68c3` | fix(competencia): compara contra competidores reales, no contra datos fijos |
| `d16a614` | feat(marca): sustituye el logo improvisado por el arte oficial de Baral |
| `ff925a8` | fix(stack): elimina falsos positivos de WooCommerce y React |
| `b6a5517` | fix(stack): detectar tecnologías sobre el HTML completo, no sobre 2 000 chars |
| `f3670b2` | feat: paridad con SEOptimer, marco metodológico citable y paquetes Baral |
| `e0f1428` | feat(evidencia): render multi-dispositivo estilo SEOptimer + fix de captura en blanco |
| `1aa9044` | redesign(fondo): reemplaza video completo del logo por franja del horizonte del planeta |
| `b0b2794` | feat(pdf): documento ejecutivo imprimible con portada, hallazgos y evidencia |
| `afbc603` | fix(competencia): reemplaza datos de competidores fabricados por mediciones reales |
| `d8ac350` | feat(scanner): infra base del escáner en vivo + captura de pantalla representativa |
| `43656b1` | feat(bg): video background planeta Baral reemplaza starfield |
| `0625bd3` | fix(planet): logo completo renderizado nativo en canvas 2D |
| `4dced81` | feat(export): sección de descarga PDF/JSON al final del análisis |
| `e607868` | feat(planet): logo Baral completo rotando en esfera premium |
| `d9ec541` | feat: reemplaza constelación por Matriz Impacto × Esfuerzo |
| `de17e3f` | ui: mapa de constelaciones más claro y explicativo |
| `d142206` | feat: integración Google Analytics 4 + descargas + historial |
| `c7bcc4f` | feat: planeta Baral 3D con logo giratorio + leyendas explicativas + motion |

**Lectura de la evolución:** primero se trabajó la capa visual (planeta 3D, constelaciones), luego se construyó el escáner en vivo real, después se reemplazaron progresivamente datos fabricados/hardcodeados por integraciones reales (GA4, PageSpeed oficial, competidores en vivo), y el trabajo más reciente se enfocó en fidelidad de detección de stack y en la calidad del material exportable (evidencia visual, PDF).

---

## 12. Assets estáticos (`public/`)

| Archivo | Peso | Uso |
|---|---|---|
| `baral-lockup.png` / `.webp` | 198 KB / 48 KB | Logo oficial completo (con texto), en PNG y WebP optimizado. |
| `baral-mark.png` / `.webp` | 89 KB / 23 KB | Isotipo de marca (solo símbolo), usado en el planeta 3D y nav. |
| `baral-favicon.png`, `apple-icon.png`, `icon-dark-32x32.png`, `icon-light-32x32.png`, `icon.svg` | — | Set de iconos de pestaña/PWA, referenciados en `metadata.icons` de `app/layout.tsx`. |
| `bg-baral-horizon.mp4` | 452 KB | Video de fondo del horizonte del planeta Baral (`components/cosmos/video-background.tsx`), reemplazó un video de logo completo. |
| `placeholder-logo.png/.svg`, `placeholder-user.jpg`, `placeholder.jpg`, `placeholder.svg` | — | Placeholders genéricos remanentes del scaffold inicial (v0/shadcn), sin uso de negocio confirmado. |

---

## 13. Notas técnicas y riesgos detectados

Estos puntos no son parte del pedido original de documentación, pero surgieron del relevamiento y vale la pena tenerlos anotados:

1. **Ruta de Windows hardcodeada en `app/api/queue/route.ts`** — usa `D:/GGLabs/audit-queue/pending.json` como ruta absoluta. Esto funciona en el entorno local de desarrollo pero **fallará en Vercel** (filesystem distinto, sin esa unidad). Si esta ruta está en uso activo, necesita revisión antes de depender de ella en producción.
2. **El build ignora errores de TypeScript y ESLint** (`next.config.mjs`: `ignoreBuildErrors: true`, `ignoreDuringBuilds: true`). Es una decisión deliberada para no bloquear despliegues, pero significa que errores de tipos reales (como los 2 preexistentes en `constellation-map.tsx` sobre la prop `xmlns` en un `<div>`) pueden llegar a producción sin que el build los detenga.
3. **`lib/audit-data.ts`** contiene un dataset extenso y hardcodeado de una auditoría real ya hecha a `baralintegral.com` (findings `BARAL-CMS-001` a `BARAL-UX-011`, comparación contra `aigendigitalmarketing.net` y `bolivia.agencia.blue`, roadmap, hipótesis de conversión). No quedó claro en el código si esto es contenido semilla/demo mostrado antes de escanear, o si sigue en uso activo en alguna vista — vale la pena confirmarlo para evitar que datos de una auditoría vieja se muestren como si fueran actuales.
4. **Lógica de captura de screenshots duplicada** entre `lib/scanner/fetcher.ts` (`deviceShotUrl`) y `lib/scanner/shots.ts` (`shotUrl`) — mismo propósito, dos implementaciones. Candidato a unificar si se vuelve a tocar esa área.
5. **`images.unoptimized: true`** en `next.config.mjs` es correcto dado que las imágenes principales son capturas externas de Microlink (Next no podría optimizarlas de todas formas), pero implica que ningún asset propio en `public/` recibe tampoco la optimización automática de Next.
