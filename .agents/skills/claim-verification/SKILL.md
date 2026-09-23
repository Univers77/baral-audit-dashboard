# claim-verification

## Activar cuando
Se revisa promesa, cifra, comparación, superlativo, testimonio, aval o resultado publicitario.

## Matriz obligatoria
Texto exacto; lugar en pieza; tipo; source_id/pasaje; fecha; territorio; muestra; método; limitación; permiso; responsable; estado.

## Estados
- SUPPORTED: fuente directa suficiente, alcance idéntico y aprobación responsable.
- QUALIFIED: soporte parcial; reescribir límites junto al claim.
- UNVERIFIED: fuente ausente, secundaria o no reproducible.
- DISPUTED: fuentes confiables discrepan.
- BLOCKED: absoluto, falso, vencido, no autorizado o sin sustento material.

## Flujo
1. Extraer claims de locución, supers, captions, escena, cierre y CTA.
2. Precisar qué evidencia demostraría cada afirmación y en qué condiciones.
3. Comprobar source_id, pasaje, vigencia, alcance y canal.
4. Marcar garantías, cifras, rankings, absolutos y comparaciones para revisión reforzada.
5. Proponer versión acotada que mantenga el beneficio sin ocultar condiciones.
6. No tratar la confianza del modelo como verificación.
7. Devolver NO LISTO mientras haya claims materiales UNVERIFIED, DISPUTED o BLOCKED.

## Entrega
Matriz citada con estado, limitación visible y decisión pendiente.
