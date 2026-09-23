# Decisiones técnicas

## 2026-09-23 — Bootstrap desde workspace vacío
- Contexto: la carpeta no tenía archivos ni historial Git.
- Decisión: crear gobernanza, vault y contratos con biblioteca estándar; sin dependencias prematuras.
- Consecuencia: API/UI y persistencia quedan para fases posteriores.

## 2026-09-23 — Preflight local cualitativo antes de spot
- Contexto: el War Room clasificaba comentarios ya observados; el flujo no sometía ideas, claims y guiones a objeciones antes de producción.
- Decisión: agregar un checklist heurístico local; distinguir crítica válida, lectura adversa, abuso y coordinación sin asignar probabilidad ni intención individual.
- Consecuencia: útil para detectar pendientes y revisar, no para predecir recepción. Nunca emite READY, no usa modelo ni manda el brief al proveedor.

## 2026-09-23 — Herramientas de red team
- Contexto: repos públicos ofrecen Promptfoo y garak para vulnerabilidades de apps/modelos LLM y Detoxify para señal de toxicidad.
- Decisión: no añadirlos como predictores de respuesta de campaña; documentar alcance, licencia y límites. Considerar Promptfoo después para QA de políticas del modelo con fixtures sintéticos y control explícito de ejecución remota.
- Consecuencia: sin nueva dependencia, proveedor, gasto ni envío de brief en esta fase.
