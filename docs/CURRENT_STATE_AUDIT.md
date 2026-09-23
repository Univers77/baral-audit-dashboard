# BARAL CampaignOS — auditoría del repositorio

Fecha: 2026-09-23

## Estado observado
Repositorio público `Univers77/baral-audit-dashboard`, rama de trabajo `campaignos-jev-mvp` (PR draft #1, no fusionado). App Next.js 16.3.6 / React 19, pnpm lockfile, dashboard de auditoría existente y un módulo nuevo Jev Social War Room. Node 24.19.0 y pnpm 10.31.0 instalados localmente.

## Funciones reutilizables
Dashboard Next.js existente; `app/campaignos` import/export JSON y clasificación Jev/heurística; preflight local de ideas/spots; endpoint de evaluación; collector `socai` local para Instagram/TikTok/LinkedIn; suites de pruebas del dashboard.

## Brechas respecto al master
No hay persistencia de campañas/evidencias/decisiones, Evidence/Claim Ledger, segmentación Bolivia implementada, estrategia, red team, blind-spot audit, producción, canales tradicionales, ni bóveda conectada a runtime. La vista Jev es una primera herramienta de escucha y no todo CampaignOS.

## Hallazgos de seguridad y operabilidad
- El endpoint Jev estaba público y sin límite; podía usar la clave server-side y causar gasto. Esta copia local lo restringe a loopback y limita el cuerpo antes de leerlo.
- Datos identificables (autor, URL, likes) se enviaban al proveedor Jev; ahora se omiten y se redactan emails, teléfonos, handles y URLs en el texto enviado. El modo Jev requiere configurar una clave local; no se suministró una.
- El collector podía enviar datos a endpoint remoto; esta copia solo acepta destinos loopback.
- `pnpm audit` encontró vulnerabilidades críticas/altas en Next.js y transitivas. Next.js quedó actualizado a 16.3.6 y los overrides se limitan a versiones corregidas; audit completo y de producción deben permanecer limpios en CI.
- La UI distingue comentarios sintéticos de evidencia y permite aprobar para estrategia, rechazar o pedir evidencia; esas decisiones son locales y se incluyen en el export.
- La versión del master dentro del PR era más corta y difería del documento adjunto (3.017 líneas). Se reemplazó por la copia adjunta indicada como fuente de verdad.
- El último CI remoto consultado falló con `Unable to locate executable file: pnpm`; no llegó a correr las validaciones. La copia local ahora instala pnpm con `pnpm/action-setup` antes del cache en `setup-node`, pero esa corrección todavía no está publicada ni revalidada por GitHub.

## Recomendación
Trabajar en esta rama y mantener el módulo local hasta que exista autenticación, almacenamiento con controles de privacidad y validación de conectores. No fusionar ni desplegar sin revisión humana.

## Puesta a punto local (23-09-2026)
- Dependencias Node instaladas desde `pnpm-lock.yaml`; `pnpm install --frozen-lockfile` comprobado.
- `socai` CLI oficial v0.6.0 para Windows x86_64 instalado en `.tools/socai/` y validado con el SHA-256 publicado en el release de GitHub. La carpeta está ignorada por Git. No se ejecutó login, onboarding ni captura social.
- Dashboard corriendo localmente en `http://127.0.0.1:3000/campaignos`; demo heurística disponible sin credenciales. Jev real necesita que el operador configure `TYPESAFE_API_KEY` en `.env.local`.
- Verificación final (23-09-2026): lint CampaignOS, typecheck, 235 pruebas Node, 8 pruebas Python y build Next.js pasan. La suite Node incluye la distinción entre crítica escéptica, insulto directo y acusación por verificar.
- Alcance responsive ajustado para que encabezados, filtro y valores largos puedan envolver en ancho estrecho. La inspección visual confirmó los estados del dashboard; no se alteró el estado de la cuenta social.
- La deuda de lint del dashboard previo permanece fuera del alcance: el comando general detectó errores en código heredado. `pnpm lint` cubre y pasa en CampaignOS y ficheros de esta incorporación.

## Alcance incorporado después de la revisión inicial
- Preflight local con entradas de idea, audiencia, guion, claims, evidencia y canales; export JSON y matriz de escenarios/acciones. El preflight nunca devuelve READY ni estima porcentajes de reacción.
- Las 15 skills originales dejaron de ser plantillas repetidas y ahora definen límites, inputs, flujo y entregables específicos. Se agregó `campaign-premortem` y se enlazó en el registro de skills.
- Investigación de herramientas documentada en `docs/CAMPAIGN_PREMORTEM.md`: Promptfoo y garak para QA de apps/modelos LLM, Detoxify como señal de toxicidad con sesgos/limitaciones. Ninguna se añadió como predictor de recepción pública.
- El preflight y las skills se verificaron localmente. La pantalla quedó sin el fixture sintético usado en QA. El dashboard está disponible en `http://127.0.0.1:3000/campaignos`.

## GitHub — estado confirmado en lectura pública
- Pull request #1 `CampaignOS: Jev Social Intelligence MVP` continúa en Draft, no está fusionado y no tiene reviews aprobadas.
- El run CampaignOS CI #2 del 23-09-2026 está en Failure por ausencia del ejecutable `pnpm` en PATH. Se vio un warning de retiro de Node 20 en actions/checkout@v4 y setup-node@v4.
- El workflow corregido usa pnpm/action-setup@v6, actions/checkout@v7, actions/setup-node@v7, actions/setup-python@v7, Node 24, audit de dependencias y CI con timeout.
- `pnpm audit` y `pnpm audit --prod` pasan localmente sin vulnerabilidades conocidas. ESLint 10 no es compatible con los plugins React/Next actuales del repo y rompe en runtime; se conserva ESLint 9.39.5 hasta que los plugins soporten ESLint 10.
- `pnpm exec eslint .` descubre ocho errores de hooks/immutability en el dashboard heredado. La CI actual valida el alcance de CampaignOS; esa deuda queda identificada y no se oculta como si todo el repo tuviera lint limpio.
- El estado de GitHub queda pendiente de publicar esta revisión y esperar su nuevo CI. El merge sigue requiriendo revisión humana.
