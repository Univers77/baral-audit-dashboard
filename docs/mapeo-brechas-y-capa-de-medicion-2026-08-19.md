# Mapeo de brechas y capa de medición verificable

**Proyecto:** baral-audit-dashboard
**Fecha:** 19 de agosto de 2026
**Alcance:** análisis del motor completo, contraste con el mercado, e implementación del primer eje

---

## 1. Qué medía la herramienta antes

El motor emitía 19 chequeos heurísticos sobre 15 identificadores de módulo, más el enriquecimiento de Claude y PageSpeed Insights como capa aparte. La cobertura clásica de SEO y rendimiento era sólida.

El mapeo encontró dos problemas estructurales.

### 1.1 Recolectaba datos y los descartaba

| Dato | Estado anterior | Estado actual |
|---|---|---|
| Cabeceras HTTP completas | Guardadas, sin auditar | Auditoría OWASP de 6 cabeceras + detección de fuga de versión |
| `robots.txt` | Solo se comprobaba existencia | Parseado según RFC 9309 |
| `sitemap.xml` | Solo se comprobaba existencia | Parseado: conteo, fechas, frescura |
| `llms.txt` | Solo se comprobaba existencia | Contenido leído y evaluado |
| `h2s` / `h3s` | Recolectados, sin usar | Reemplazados por `headingOutline` en orden de documento |
| Resultado de PageSpeed | Solo en pantalla | Incluido en el PDF y en el JSON exportado |

El caso de PageSpeed era un defecto de integridad, no una función faltante: **el cliente veía sus Core Web Vitals en pantalla y recibía un informe sin ellas.**

### 1.2 Medía el sitio, no su propia medición

Un 45 en accesibilidad se presentaba con la misma autoridad que un 45 en rendimiento, aunque el primero se apoyaba en 5 comprobaciones y el segundo en 1. La literatura es clara: los escáneres automáticos verifican de forma fiable cerca del **13 % de los criterios WCAG**, y ninguna herramienta comercial lo declara en su informe.

---

## 2. Un diagnóstico que estaba invertido

El escáner no ejecuta JavaScript, igual que la mayoría de los rastreadores. Ante una aplicación que se monta en el navegador veía poco texto y emitía **«contenido delgado»**.

El diagnóstico correcto es el opuesto y más grave: el contenido existe, pero no viaja en el HTML y resulta invisible para cualquier rastreador que no renderice. Mismo dato, conclusión inversa, y solución completamente distinta.

Verificado en producción contra `excalidraw.com`:

> Contenido montado en el navegador: el HTML servido trae solo 1 palabra con 6 scripts. Los rastreadores que no ejecutan JavaScript ven la página vacía.

Antes de la corrección, ese mismo sitio recibía una recomendación de «escribir más contenido».

---

## 3. Brechas de mercado evaluadas

Se evaluaron cuatro ejes con evidencia externa de 2026.

| Eje | Evidencia | Decisión |
|---|---|---|
| **Agent-Readiness** | Tráfico de IA a retail **+393 % interanual**, convierte **42 % mejor** que el orgánico. **33 %** de los ecommerce no ha empezado; la mayoría puntúa **bajo 30/100**. | **Implementado** |
| Visibilidad en IA (AEO) | **47 %** de las marcas cita la dificultad de medición como bloqueador principal. Solo **11 %** de los dominios citados coincide entre ChatGPT y Perplexity. | Aplazado |
| Tráfico oscuro | Error de atribución medido de **90 puntos porcentuales**. **85 %** de los clientes convertidos reporta dark social como toque relevante. | Aplazado |
| Capa de honestidad | Los escáneres automáticos cubren de forma fiable el **13 %** de los criterios WCAG; ninguno lo declara. | **Implementado** |

### Por qué Agent-Readiness primero

- **Determinista.** Mismo HTML, mismo resultado: se puede fijar con fixtures y detectar regresiones. La medición de visibilidad en IA no lo es, y cuesta tokens en cada escaneo.
- **Sin costo adicional.** El `robots.txt` que necesita ya se descargaba y se tiraba.
- **Accionable.** Mide la causa corregible. La visibilidad en IA mide un síntoma que solo se observa.

### Por qué se aplazaron los otros dos

El tráfico oscuro requiere GA4 conectado, que sigue siendo la brecha `g2` documentada: hoy no se puede verificar de punta a punta. La visibilidad en IA merece su propio diseño con caché y presupuesto, no un añadido que encarezca cada escaneo.

---

## 4. Lo implementado

### 4.1 Agent-Readiness

Puntaje 0–100 sobre 7 chequeos ponderados, más uno informativo.

| Chequeo | Peso | Qué mide |
|---|---|---|
| Acceso de rastreadores de IA | 25 | 10 agentes contra el `robots.txt` real |
| Contenido servido sin JavaScript | 20 | Si un rastreador ve la página o una en blanco |
| Identidad legible por máquina | 20 | `Organization`/`LocalBusiness` con nombre, dirección y teléfono |
| Formularios operables | 15 | `name`, `autocomplete` y etiqueta por campo |
| Contacto y horarios estructurados | 10 | `openingHours`, `contactPoint` |
| URL canónica | 5 | Dirección estable para citar |
| `llms.txt` con contenido | 5 | Señal complementaria |
| `/.well-known/` | 0 | Informativo, no puntúa |

Agentes verificados: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Google-Extended, CCBot, Applebot-Extended, Bytespider.

**Precisión deliberada sobre `llms.txt`.** La guía oficial de Google de mayo de 2026 declara que **no es necesario** para la visibilidad en búsqueda generativa. La mayoría de los checklists de «agent readiness» del mercado lo presentan como requisito porque venden auditorías. Aquí pesa 5 sobre 100 y se etiqueta como señal complementaria.

**Verificado contra `theverge.com`:** permite GPTBot y OAI-SearchBot, bloquea ClaudeBot, PerplexityBot, CCBot y otros cuatro. El resultado es coherente con el acuerdo de Vox Media con OpenAI — es exactamente el tipo de asimetría que ninguna herramienta local reporta.

### 4.2 Cobertura declarada

Cada pilar declara de cuántos chequeos posibles se sostiene. **Un chequeo que no se pudo ejecutar queda fuera del puntaje; nunca cuenta como aprobado.**

Ejemplo real del informe:

> **Accesibilidad — 5/56**
> Los escáneres automáticos verifican de forma fiable cerca del 13 % de los criterios WCAG. Contraste de color, orden de foco, navegación por teclado y lectura con lector de pantalla exigen prueba manual.

Con la aplicación del European Accessibility Act ya activa —siete estados miembros con actividad legal y 28 investigaciones abiertas en Suecia— declarar el alcance real protege más que insinuar conformidad.

### 4.3 Datos recuperados

Cabeceras de seguridad (OWASP), jerarquía de encabezados (WCAG §1.3.1 y §2.4.6), etiquetas de formulario (WCAG §3.3.2), frescura de contenido vía `sitemap.xml`, y fusión de PageSpeed en el informe entregable.

### 4.4 Enlaces rotos

El campo `brokenLinks` existía en el modelo desde el principio y **siempre llegaba vacío**: nadie lo llenaba. El informe declaraba implícitamente que no había enlaces rotos sin haber comprobado ninguno.

Ahora se comprueba una muestra acotada de 20 enlaces —repartida entre internos y externos— con 6 peticiones simultáneas y 6 segundos de plazo, toda a través de la pasarela SSRF.

El criterio de clasificación es deliberadamente conservador:

| Respuesta | Veredicto | Razón |
|---|---|---|
| 200–399 | correcto | — |
| 404, 410 | **roto** | El servidor confirma que el recurso no existe |
| 5xx | **roto** | Error del servidor de destino |
| 401, 403, 429 | restringido | El recurso existe; solo restringe el acceso automatizado |
| Sin respuesta | sin respuesta | Puede ser un servidor caído o un rechazo de peticiones automatizadas |

Solo se afirma «roto» cuando el servidor lo confirma. Marcar como roto todo lo que no responde es el error más frecuente de estos escáneres, y produce informes que el cliente deja de creer. Los enlaces sin respuesta se reportan aparte, como P3 y con indicación de revisión manual.

Verificado contra `github.com`: 20 enlaces comprobados, 19 correctos y 1 clasificado como restringido —no como roto—, que es exactamente el caso que el guardarraíl existe para evitar. Coste: 5,2 s de escaneo total.

---

## 5. Verificación

| Comprobación | Resultado |
|---|---|
| `pnpm test` | **184 de 184** (eran 71) |
| `pnpm typecheck` | Limpio |
| Bloqueo de rastreadores en vivo (`theverge.com`) | 7 bloqueados, correctamente identificados |
| Render en cliente en vivo (`excalidraw.com`) | Diagnosticado como tal, ya no como contenido delgado |
| Cobertura en pantalla | Accesibilidad 5/56 declarada |
| Enlaces rotos en vivo (`github.com`) | 20 comprobados; un 4xx restringido correctamente **no** marcado como roto |
| `GET /api/events` | Sin códigos de error nuevos |

Los 113 tests nuevos cubren: comodines y grupos multi-agente en `robots.txt`, precedencia de patrones según RFC 9309, sitemaps índice y plano con fechas inválidas, ponderación de cabeceras por severidad, saltos de nivel en encabezados, la matriz completa de acceso de bots, la separación entre contenido escaso y render en cliente, y la frontera entre enlace roto y acceso restringido.

---

## 6. Pendiente

### Dos asuntos distintos que conviene no confundir

#### A. `pnpm build` no funciona en esta máquina — bug upstream de Next 16

`TypeError: Cannot read properties of null (reading 'useContext')`. React resuelve a `null` al renderizar componentes cliente en el bundle de servidor.

Matriz de reproducción, todas con resultado idéntico:

| Variable probada | Valores | Resultado |
|---|---|---|
| Node | 20.15.0 · 22.23.2 | Falla en ambos |
| Next | 16.3.0 · 16.3.1 | Falla en ambos |
| React | 19.2.4 · 19.2.8 | Falla en ambos |
| Bundler | Turbopack · webpack | Falla en ambos |
| Gestor de paquetes | pnpm · npm | Falla en ambos |
| Proyecto | baral-audit-dashboard · **app mínima de 3 archivos** | Falla en ambos |

Que una aplicación mínima recién creada falle igual **descarta el código del proyecto**. Corresponde a los issues abiertos [95741](https://github.com/vercel/next.js/issues/95741), [86178](https://github.com/vercel/next.js/issues/86178) y [84994](https://github.com/vercel/next.js/issues/84994) de `vercel/next.js`, sin arreglo publicado.

Descartado también como causa: la versión de Node, que se había señalado antes por error.

**No bloquea el trabajo.** El servidor de desarrollo, el typecheck y los 158 tests funcionan. Vercel compila en Linux y ha desplegado esta aplicación con éxito antes, de modo que el fallo es exclusivo del entorno local.

Hallazgo colateral: `app/page.tsx` exporta `dynamic = 'force-dynamic'` dentro de un componente marcado `'use client'`. La configuración de segmento de ruta es una función solo de servidor y no tiene efecto ahí. No causa el fallo del build —se comprobó— pero conviene retirarlo.

#### B. Producción no recibía los despliegues — causa raíz identificada

Comprobado en vivo sobre `baral-audit-dashboard.vercel.app`:

| Endpoint | Esperado tras el commit anterior | Real |
|---|---|---|
| `/api/events` | 200 | **404** |
| `/api/queue` | 501 | **200** |

La cabecera `age` confirmaba una versión de casi 29 horas.

**La causa:** el repositorio nunca estuvo conectado a Vercel. GitHub no registra un solo *deployment* ni *status* de Vercel en todo el historial — si la integración existiera, publicaría uno en cada push. Producción se desplegó en su momento por CLI.

Al intentar conectarlo, el error es explícito:

> You need admin or write access to the repository "baral-audit-dashboard" to link it.

La cuenta de Vercel es **`cosu123`** y su integración con GitHub sigue apuntando a la cuenta `cosu123`, que está suspendida. El repositorio vive en **`Univers77`**. Vercel no tiene permiso sobre él.

**Resolución:** requiere reautorizar la integración de GitHub dentro del panel de Vercel, contra la cuenta `Univers77`. Es un flujo OAuth de cuentas y solo lo puede hacer el titular.

**Comprobado mientras tanto:** un despliegue de vista previa por CLI terminó en `readyState: READY`. Vercel compila este proyecto sin problema en Linux con Node 24. Eso cierra definitivamente la duda sobre si el fallo local afectaba a producción: no lo hacía.

Nota operativa: la subida por CLI falla con `fetch failed` en modo por defecto y funciona con `--archive=tgz`.

### Siguiente ronda

- **Probe de visibilidad en IA (AEO).** Necesita diseño propio: caché por dominio y presupuesto de tokens, porque el resultado no es determinista y encarecería cada escaneo.
- **Descomposición de tráfico oscuro.** Bloqueado hasta que GA4 esté conectado; hoy no se puede verificar de punta a punta.
- **Crawl multipágina.** La comprobación de enlaces ya recorre una muestra, pero el análisis sigue evaluando una sola página. Un crawl real abriría títulos y descripciones duplicados entre páginas, páginas huérfanas y distribución de contenido delgado.

### Verificación de los pilares del puntaje

Los cinco pilares declaran cobertura, pero los denominadores de SEO (12), rendimiento (6) y conversión (9) son estimaciones de criterio profesional, no recuentos con fuente citable como el de accesibilidad (56 criterios WCAG 2.2 A+AA). Conviene sustituirlos por listas explícitas de chequeos nombrados para que la cifra sea auditable.
