# Verificación y remediación de la auditoría forense

**Documento auditado:** `AUDITORIA_FORENSE_COMPLETA_BARAL_AUDIT_DASHBOARD_2026-08-18.md`
**Proyecto:** `baral-audit-dashboard` (`Univers77/baral-audit-dashboard`, rama `master`)
**Fecha de esta verificación:** 18 de agosto de 2026

Este documento hace tres cosas: **verifica** cuáles de los hallazgos del informe de auditoría son ciertos contrastándolos contra el código real, **documenta** lo que se corrigió en esta sesión con su evidencia de prueba, y **delimita** con precisión lo que sigue pendiente y por qué.

> ### Contexto de uso — determina las prioridades
>
> La aplicación es hoy una **herramienta interna de Baral**, no un producto público. Su propósito es medir sitios, detectar errores y fallos actuales o futuros, y **registrarlos para poder monitorearlos y corregirlos**.
>
> Eso reordena el informe de auditoría original, que asumía exposición pública:
>
> - **Dejan de ser bloqueantes:** rate limiting, presupuesto anti-abuso y modelo multiusuario. Sin acceso público no hay superficie de abuso por terceros. Siguen siendo requisitos **previos a abrir la app**, no ahora.
> - **Pasan a ser lo prioritario:** registrar los fallos, poder consultarlos, y proteger las correcciones con tests para que no se deshagan.
> - **Queda resuelta una decisión que el informe dejaba abierta:** ante "escáner anónimo / historial por usuario / panel interno de Baral", la respuesta es **panel interno**. Por eso el historial compartido no constituye un problema de privacidad hoy.
>
> Las defensas de seguridad implementadas **se mantienen igualmente**: el gateway SSRF protege de que un sitio auditado hostil use la herramienta como pivote hacia la red local de quien la ejecuta, un riesgo que existe aunque el uso sea interno.

---

## 1. Veredicto sobre el documento de auditoría

El informe es **sólido y en lo esencial correcto**. Su hallazgo principal —que una aplicación cuya función es visitar URLs elegidas por el usuario tiene una superficie SSRF que un sitio normal no tiene— es exacto y estaba sin mitigar. Es una crítica bien fundada, no un falso positivo.

También acierta en algo más sutil y valioso: el riesgo metodológico de que el auditor presente heurísticas contextuales como verdades universales. Esa observación es la más difícil de aceptar y probablemente la más importante para la credibilidad comercial del producto.

Dos matices sobre el propio informe:

- **Se apoya en un dato desactualizado.** Afirma que `next.config.mjs` desactiva el gate de ESLint mediante `eslint.ignoreDuringBuilds: true`. Esa clave **ya no existe en Next.js 16**: el propio `next dev` emitía el aviso `Unrecognized key(s) in object: 'eslint'`. La configuración no tenía efecto alguno. El riesgo de fondo (no hay gate de lint) es real, pero no por la causa indicada.
- **Su severidad es apropiada**, salvo que no distingue entre lo explotable hoy en producción y lo que es deuda arquitectónica para escala futura. Abajo se separa explícitamente.

---

## 2. Hallazgos verificados uno por uno

| Hallazgo | Veredicto | Comentario |
|---|---|---|
| **SEC-001** SSRF en el escáner | **CONFIRMADO** | `fetch(url, { redirect: 'follow' })` sin ninguna validación de destino. Explotable. |
| **SEC-002** SSRF en `/api/proxy-image` | **CONFIRMADO** | Validaba solo el protocolo; el resto quedaba abierto. |
| **SEC-003** Respuestas sin límite de tamaño | **CONFIRMADO** | `res.text()` y `arrayBuffer()` sin tope. El proxy además inflaba memoria ~33% al pasar a base64 dentro de un JSON. |
| **SEC-004** Redirects sin revalidación | **CONFIRMADO** | Consecuencia directa de `redirect: 'follow'`. |
| **ARCH-001/002** Cola incompatible y con carrera | **CONFIRMADO** | Ruta `D:/GGLabs/...` hardcodeada; ciclo read-modify-write sin bloqueo. Verificado además que **ningún componente la consumía**. |
| **API-003** GA4 sin timeout | **CONFIRMADO** | Cuatro llamadas en `Promise.all`, ninguna con `AbortSignal`. |
| **API-004** `propertyId` sin validar | **CONFIRMADO** | Se interpolaba directo en la ruta del recurso. |
| **AI-001** Inyección indirecta de prompt | **CONFIRMADO** | Se enviaban a Claude 800 caracteres de HTML crudo del sitio auditado, sin marco de confianza. |
| **AI-002** Salida del LLM sin validar | **CONFIRMADO** | `JSON.parse` y cast directo a la interfaz, sin verificar forma ni tipos. |
| **METHOD-008** Clasificación de enlaces | **CONFIRMADO** | `href.includes(dom)`: auditando `ejemplo.com`, un enlace a `not-ejemplo.com` contaba como interno. |
| **METHOD-009** URL original vs. final | **CONFIRMADO** | `isHttps`, dominio y enlaces se derivaban de la URL pedida, no de la servida tras el redirect. |
| **REL-002** Secuencia SSE inconsistente | **CONFIRMADO** | Se emitía `progress` *después* de `done`, y el total de pasos saltaba de 4 a 5. |
| **REL-003** Posible doble `controller.close()` | **CONFIRMADO** | La rama de error cerraba y retornaba, y el `finally` volvía a cerrar. |
| **BUILD-001** El build ignora errores | **PARCIALMENTE CORRECTO** | Cierto para TypeScript (`ignoreBuildErrors: true`). **Incorrecto para ESLint**: esa clave ya no la soporta Next 16. |
| **SEC-007** Faltan cabeceras de seguridad | **CONFIRMADO** | No había ninguna configurada. |
| **METHOD-001** Afirmaciones demasiado absolutas | **CONFIRMADO** | El prompt de Claude ordenaba literalmente `wordCount < 300 → thin content confirmado` y `TTFB > 600ms → problemas de servidor reales`. |
| **DATA-001** Dataset demo mezclado | **CONFIRMADO** | `lib/audit-data.ts` mantiene una auditoría real hardcodeada. |

---

## 3. Correcciones aplicadas en esta sesión

### 3.1 Gateway único de salida de red — `lib/security/safe-remote-fetch.ts` (nuevo)

Todo el tráfico saliente hacia URLs elegidas por el usuario pasa ahora por un único módulo, que:

1. Acepta solo `http:` y `https:`, y rechaza credenciales embebidas (`https://user:pass@host`).
2. Resuelve DNS (A y AAAA) y **bloquea si cualquier dirección resuelta es privada o reservada**.
3. Sigue redirects **manualmente**, revalidando el destino en cada salto (máx. 5).
4. Lee el cuerpo en streaming con **tope de bytes** (8 MB texto, 8 MB imágenes), cortando la descarga al superarlo.
5. Aplica timeout por petición.

Rangos bloqueados — IPv4: `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16` (incluye el endpoint de metadata de nube), `172.16/12`, `192.0.0/24`, `192.0.2/24`, `192.168/16`, `198.18/15`, `198.51.100/24`, `203.0.113/24`, `224/4`, `240/4`. IPv6: `::1`, `::`, `fe80::/10`, `fc00::/7`, `ff00::/8` y el rango IPv4-mapeada `::ffff:0:0/96`.

**Limitación honesta y deliberada:** el gateway valida la IP resuelta pero **no la fija al socket** de la conexión. Queda una ventana residual de TOCTOU / DNS rebinding entre la validación y el fetch. Cerrarla del todo exige un `Agent` HTTP con `lookup` propio a nivel de conexión. Está documentado en el propio código y listado como pendiente en la sección 5.

### 3.2 Aplicación del gateway

- `lib/scanner/fetcher.ts`: el fetch del sitio y los tres checks auxiliares (`robots.txt`, `sitemap.xml`, `llms.txt`) usan `safeFetchText` / `safeFetchOk`.
- `app/api/proxy-image/route.ts`: reescrito sobre `safeFetchBuffer`, con verificación de que el `Content-Type` sea realmente una imagen, rechazo temprano por `Content-Length` excesivo y errores genéricos hacia el cliente (el detalle queda en logs).

### 3.3 Corrección de precisión del auditor

- **Enlaces (METHOD-008):** se comparan hostnames resueltos con `new URL()`, aceptando el dominio y sus subdominios, en lugar de buscar una subcadena. Se descartan además `mailto:`, `tel:`, `javascript:` y anclas.
- **URL final (METHOD-009):** la auditoría describe ahora la página realmente servida. `isHttps`, el dominio, el origen y la clasificación de enlaces derivan de la URL post-redirect.

### 3.4 Defensa contra inyección de prompt — `lib/scanner/claude-analyzer.ts`

- **Se eliminó el envío de HTML crudo.** La detección de stack ya es determinística; mandar el HTML solo ampliaba la superficie de ataque sin aportar señal.
- El payload se partió en dos bloques explícitos: `MEDICIONES_VERIFICADAS` (producidas por el escáner, fuente de verdad) y `CONTENIDO_DEL_SITIO` (texto del sitio auditado), este último delimitado y declarado como **dato no confiable, nunca instrucciones**. Si contiene texto que intenta dirigir el informe, el modelo debe reportarlo como indicio de manipulación en vez de obedecerlo.
- Se prohíbe explícitamente que el modelo recalcule o modifique los scores: son deterministas y definitivos.
- **Se rebajaron las reglas absolutas** que el propio prompt imponía. Ya no ordena declarar "thin content confirmado" por debajo de 300 palabras ni "problemas de servidor reales" por encima de 600 ms; ahora exige calibrar el lenguaje a la fuerza de la evidencia y reconocer que el TTFB medido desde un servidor es latencia sintética, no experiencia de usuario.
- **Validación de la salida:** la respuesta se valida en tiempo de ejecución (tipos, campos, enum de confianza). Si no cumple, se descarta y el informe sigue sin el bloque de IA en lugar de propagar datos malformados.

### 3.5 Otras correcciones

- **`/api/queue`** — Deshabilitado. Devuelve `501` con explicación, en lugar de una ruta rota que exponía el estado global sin autenticación. Se dejó el endpoint (no se borró) para que cualquier cliente externo reciba una respuesta explícita. El código documenta los tres motivos del retiro.
- **GA4** — `AbortSignal.timeout(20s)` en las cuatro consultas; `propertyId` validado como numérico antes de interpolarse; errores traducidos a una taxonomía (`GA4_TIMEOUT`, `GA4_AUTH`, `GA4_FORBIDDEN`, `GA4_ERROR`) sin filtrar mensajes internos al cliente.
- **SSE** — Total de pasos unificado en una constante; el guardado ocurre antes de `result`/`done`; un único punto de cierre del controller.
- **Build** — Corregidos los 2 errores de TypeScript (`xmlns` en `<div>` dentro de `foreignObject`). Con el typecheck limpio, **`ignoreBuildErrors` pasó a `false`**: un error de tipos ahora bloquea el despliegue. Añadido el script `pnpm typecheck`. Se retiró la clave `eslint`, inválida en Next 16.
- **Cabeceras** — `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` y `Permissions-Policy`. **No se añadió CSP**: el dashboard carga Google Identity Services, Vercel Analytics e imágenes remotas, y una CSP mal calibrada rompe el login de GA4. El camino correcto es introducirla primero en modo `Report-Only`.

---

## 4. Evidencia de verificación

**Clasificación de IPs — 27/27 casos correctos.** Incluye los bypasses clásicos y los límites exactos de los rangos:

```
BLOQUEADA  169.254.169.254      metadata de nube
BLOQUEADA  ::ffff:127.0.0.1     IPv4-mapeada a loopback (bypass clásico)
BLOQUEADA  fd12:3456::1         unique-local IPv6
permitida  172.15.255.255       límite inferior, fuera de RFC1918
permitida  172.32.0.1           límite superior, fuera de RFC1918
permitida  2606:4700:4700::1111 IPv6 público
```

**Pruebas contra el endpoint real** (servidor limpio, `/api/analyze`):

```
http://127.0.0.1        -> RECHAZADO: el destino resuelve a una dirección de red privada o reservada
http://localhost:3741   -> RECHAZADO
http://169.254.169.254  -> RECHAZADO
http://192.168.1.1      -> RECHAZADO
https://example.com     -> ANALIZADO: status 200 | https=true | score 78
```

**Redirect y clasificación de enlaces** (`http://github.com`):

```
url final : https://github.com/
isHttps   : true          <- antes reportaba false (bug METHOD-009)
internos  : 123 | externos: 14
```

**Cabeceras, proxy y cola:**

```
x-content-type-options   nosniff
referrer-policy          strict-origin-when-cross-origin
x-frame-options          SAMEORIGIN
permissions-policy       camera=(), microphone=(), geolocation=(), payment=()

/api/proxy-image?src=http://127.0.0.1/x.png        -> 400 destino privado
/api/proxy-image?src=http://169.254.169.254/...    -> 400 destino privado
/api/queue                                          -> 501 Endpoint deshabilitado
```

**Typecheck:** `tsc --noEmit` pasa sin errores (antes: 2).

---

## 5. Hallazgo nuevo, no presente en el informe auditado

**El build de producción falla localmente, y no por estas correcciones.**

`pnpm build` termina con:

```
Error occurred prerendering page "/_global-error"
TypeError: Cannot read properties of null (reading 'useContext')
```

Se verificó rigurosamente que **es preexistente**: guardando todos los cambios en un stash y compilando el código original de `master`, el error es idéntico. No es una regresión introducida en esta sesión.

La causa más probable es el **Node local desactualizado**: la máquina corre `v20.15.0`, mientras el toolchain declara requerir `^20.19.0 || ^22.13.0 || >=24`. Vercel usa Node 22 por defecto, lo que explica que los despliegues vengan funcionando pese a este fallo local.

**Recomendación:** actualizar Node local a 22 LTS y volver a compilar. Conviene confirmarlo antes de desplegar, porque con `ignoreBuildErrors: false` el build de Vercel ahora es un gate real — aunque el typecheck pasa limpio, así que el riesgo es bajo.

---

## 6. Capacidad de diagnóstico añadida

Esta parte no venía del informe de auditoría: responde directamente al propósito de la herramienta —detectar, registrar y monitorear fallos.

**El problema:** `writer.ts` solo guardaba escaneos exitosos, y en `{dominio}.json`, que cada nueva ejecución sobrescribía. Un escaneo que fallaba **no dejaba ningún rastro**. Justo el dato que la herramienta necesita para cumplir su función era el que se perdía.

**Lo implementado:**

- **Bitácora append-only** (`cache/_scan-events.jsonl`) — cada intento queda registrado con dominio, resultado, duración, código de error y, si tuvo éxito, puntaje y número de hallazgos. No se sobrescribe nada, así que las regresiones a lo largo del tiempo quedan visibles.
- **Logging estructurado** (`lib/observability/log.ts`) — cada evento sale como una línea JSON con `requestId` que correlaciona toda la petición, código de error y duración. Filtrable con `grep` tanto local como en los logs de Vercel. Por diseño nunca registra tokens, claves ni la URL completa (que podría llevar credenciales en la query).
- **Taxonomía cerrada de errores** — 18 códigos (`AUDIT_BLOCKED_DESTINATION`, `PSI_QUOTA`, `CLAUDE_INVALID_OUTPUT`, `GA4_TIMEOUT`…) que permiten contar y comparar fallos entre ejecuciones en vez de leer mensajes sueltos.
- **`GET /api/events`** — devuelve la bitácora con un resumen agregado: total, tasa de error, recuento por código, duración media y dominios distintos. Admite filtros por `domain` y `outcome`.

Comprobado en ejecución real (5 intentos: 4 destinos internos bloqueados + 1 sitio real):

```json
{ "total": 5, "ok": 1, "error": 4, "errorRate": 80,
  "byCode": { "AUDIT_BLOCKED_DESTINATION": 4 },
  "avgDurationMs": 926, "domains": 5 }
```

**Suite de tests — 71 casos, todos pasando** (`pnpm test`, con `node --test` + `tsx`):

| Archivo | Qué fija |
|---|---|
| `tests/safe-remote-fetch.test.ts` | Tabla completa de IPs privadas/públicas del gateway SSRF |
| `tests/links.test.ts` | Clasificación de enlaces, incluido el caso `not-ejemplo.com` |
| `tests/psi-parse.test.ts` | Parser de PageSpeed: CLS ÷ 100, umbrales, filmstrip, campo vs. laboratorio |
| `tests/claude-output.test.ts` | Validación de la salida del LLM ante respuestas malformadas |

Además se extrajo la clasificación de enlaces a `lib/scanner/links.ts` como función pura (antes estaba embebida en el escáner y no era testeable), y la ruta de caché ya no es `D:/GGLabs/...` sino que se deriva de `process.cwd()`.

---

## 7. Lo que sigue pendiente

Reordenado según el contexto real de herramienta interna.

### Ahora

1. **Actualizar Node local a 22 LTS** — Es lo único que hoy impide compilar y ejecutar el lint en la máquina. Bloquea la capacidad de verificar antes de desplegar (ver sección 5).
2. **Migrar la config de ESLint al formato flat** — ESLint 10 no lee el formato antiguo, así que `pnpm lint` no corre. Depende del punto anterior.

### Cuando aporte valor al diagnóstico

3. **Vista de diagnóstico en la interfaz** — Hoy la bitácora se consulta por `/api/events`. Un panel que muestre tasa de error, fallos recientes y evolución del puntaje por dominio haría el monitoreo visual.
4. **Separar el dataset demo** (`DATA-001`) — `lib/audit-data.ts` mantiene una auditoría real hardcodeada. Conviene marcarla como "DEMO" en la interfaz para que no se confunda con datos en vivo.
5. **Scoring v2 con cobertura y confianza** (`METHOD-002`) — Hoy un hallazgo puede penalizar varias dimensiones a la vez. Mostrar `score / coverage / confidence` por separado: un 82 con 20% de cobertura no debe parecer mejor que un 75 con 95%.
6. **Parsers reales de robots.txt y sitemap.xml** (`METHOD-004`) — Hoy solo se comprueba que respondan `200`; ya está anotado como tal en el código.
7. **`alt=""` contextual** (`METHOD-006`) y **confianza en detección de tecnología** (`METHOD-007`).
8. **DOM renderizado con Playwright** (`METHOD-010`) — Cheerio no ve contenido generado por JavaScript.

### Solo si la app se abre al público

9. **Rate limiting** (`SEC-005`) y **presupuesto de coste con circuit breakers** (`SEC-006`) — Un escaneo dispara fetch del sitio + 3 auxiliares + Claude + Microlink + PSI. Ese factor de amplificación solo es explotable con acceso público.
10. **Modelo de identidad y aislamiento del historial** (`PRIV-001/002`) — Innecesario mientras sea panel interno.
11. **Pinning de DNS a nivel de socket** — Cierra la ventana residual de TOCTOU/DNS rebinding descrita en 3.1.

### No recomendado por ahora

El propio informe lo dice y coincido: nada de Kubernetes, microservicios, Kafka ni event sourcing en este momento. La aplicación puede crecer mucho con una arquitectura simple. Primero seguridad, durabilidad, tests y medición.

---

## 8. Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/security/safe-remote-fetch.ts` | **Nuevo** — gateway de salida de red |
| `lib/observability/log.ts` | **Nuevo** — logging estructurado y taxonomía de errores |
| `lib/scanner/paths.ts` | **Nuevo** — rutas de almacenamiento derivadas de `cwd` |
| `lib/scanner/links.ts` | **Nuevo** — clasificación de enlaces como función pura |
| `app/api/events/route.ts` | **Nuevo** — bitácora de diagnóstico con resumen agregado |
| `tests/*.test.ts` | **Nuevo** — 71 casos que fijan las correcciones |
| `lib/scanner/fetcher.ts` | Gateway aplicado; URL final post-redirect; enlaces por hostname |
| `lib/scanner/claude-analyzer.ts` | Defensa de inyección; sin HTML crudo; validación de salida; reglas calibradas |
| `lib/scanner/writer.ts` | Registro de intentos; rutas sin hardcodear |
| `app/api/analyze/route.ts` | Secuencia SSE corregida; logging y bitácora |
| `app/api/proxy-image/route.ts` | Reescrito sobre el gateway, con límites y validación de tipo |
| `app/api/queue/route.ts` | Deshabilitado (501) |
| `app/api/ga4/data/route.ts` | Timeouts, validación de `propertyId`, taxonomía de errores |
| `app/api/history/route.ts` | Ruta de caché sin hardcodear |
| `components/audit/constellation-map.tsx` | 2 errores de TypeScript corregidos |
| `next.config.mjs` | Typecheck activado, cabeceras de seguridad, clave `eslint` retirada |
| `package.json` | Scripts `typecheck` y `test`; `tsx` como dependencia de desarrollo |
| `.gitignore` | Ignora `cache/` y `tsconfig.tsbuildinfo` |

### Comandos disponibles

```bash
pnpm test       # 71 tests
pnpm typecheck  # tsc --noEmit
pnpm dev        # servidor local
```

---

## 9. Conclusión

El informe de auditoría identificó correctamente el riesgo central y se actuó sobre él: **la vía `URL → servidor → red remota` ya no puede alcanzar infraestructura interna**, verificado contra el endpoint real con los vectores conocidos. Esa defensa importa aunque el uso sea interno, porque protege de que un sitio auditado hostil use la herramienta como pivote hacia la red local de quien la ejecuta.

Sobre el propósito declarado —medir, detectar fallos y registrarlos para monitorearlos— la herramienta pasó de **no dejar rastro de los fallos** a registrar cada intento con su causa clasificada, consultable por API y con resumen agregado. Y las correcciones quedaron fijadas por 71 tests, de modo que una regresión futura falle de forma visible en lugar de silenciosa.

Lo que queda pendiente está ordenado por el contexto real: lo inmediato es actualizar Node local (hoy impide compilar y ejecutar el lint), y lo demás son mejoras de calidad del auditor. Rate limiting y modelo multiusuario esperan a que la aplicación se abra al público, si algún día ocurre.

La observación más valiosa del informe no es técnica sino metodológica, y conviene no perderla de vista: el valor de AUDITOR-X no es encontrar más errores que otros, sino que cada conclusión pueda demostrar de dónde salió, qué tan segura es y cómo verificarla. Las reglas absolutas del prompt ya se calibraron en esa dirección; el scoring con cobertura y confianza es el siguiente paso natural.
