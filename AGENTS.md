# BARAL CampaignOS

## Misión
Mantener un sistema de marketing para Bolivia basado en evidencia y operado con aprobación humana.

## Reglas permanentes
- No inventar fuentes, datos, conducta, jerga ni resultados.
- Separar hechos, interpretaciones e hipótesis; limitar cada conclusión a su evidencia.
- No inferir etnia, religión, ideología política u otros rasgos sensibles.
- Toda publicación, respuesta o cambio de campaña requiere aprobación humana explícita.
- No evadir autenticación, CAPTCHA, límites ni controles de acceso.
- Mantener credenciales y datos sociales privados fuera de Git y de servicios cloud.
- Preferir lógica determinista y procesamiento local; no añadir servicios pagos sin autorización.
- Mantener compatibilidad con Windows y soporte omnicanal.

## Instrucciones
Usar la Skill de `.agents/skills/` pertinente. Consultar solo los documentos relevantes de `docs/`; mantener este archivo breve.
Para evaluar conceptos y spots usar `.agents/skills/campaign-premortem/SKILL.md`; no presentar escenarios como predicciones ni inferir mala fe desde texto aislado. Ver gates, taxonomía y herramientas evaluadas en `docs/CAMPAIGN_PREMORTEM.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
