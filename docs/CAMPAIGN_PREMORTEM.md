# Preflight de campaña, copy y spots

## Para qué sirve

El preflight permite revisar una idea, una promesa, un guion/storyboard y sus claims antes de producir o publicar. Examina señales textuales y plantea comprobaciones humanas sobre objeciones, lecturas adversas, pruebas faltantes, ejecución y respuesta. Se ejecuta localmente en el navegador y no envía el brief a Jev.

El módulo no predice cuántas personas reaccionarán, no estima probabilidad de viralidad/crisis y no determina que alguien actúe de mala fe. Sus resultados son hipótesis y una lista de comprobación; la ausencia de alertas no es aprobación.

## Uso

1. Describe la idea y el cambio/promesa en lenguaje concreto.
2. Delimita audiencia, territorio, idioma/registro y lo que la muestra no permite generalizar.
3. Pega el guion, supers, texto en pantalla, audio/CTA y versiones relevantes.
4. Enumera claims exactos. Asocia fuente primaria, fecha, alcance y limitación en el campo de evidencia.
5. Indica canales y formatos. Pulsa “Ejecutar preflight local”.
6. Resuelve los BLOCK, consigue revisiones para REVIEW y completa los NOT_ASSESSED.
7. Exporta la ficha para revisión del equipo. Es un JSON local descargado por el operador; no es un registro persistente en servidor.

No se debe marcar una campaña lista mientras un claim material carezca de sustento, la oferta/operación no pueda cumplir la promesa, falten permisos o el responsable humano no haya cerrado sus revisiones.

## Taxonomía de reacción

| Tipo | Qué significa | Qué evidencia ayuda |
|---|---|---|
| Crítica legítima | Pregunta por un claim, costo, acceso, privacidad o experiencia | Fuente, condiciones del servicio, registro operativo |
| Lectura adversa | Interpretación negativa pero plausible del copy, imagen o recorte | Pieza exacta, storyboard, versiones mute/crop y revisión contextual |
| Queja de experiencia | Persona reporta una falla o una expectativa incumplida | Contexto mínimo autorizado y confirmación del equipo de servicio |
| Abuso/hate | Ataque dirigido, hostigamiento o amenaza | Texto y contexto íntegros; revisión humana y protocolo vigente |
| Posible coordinación | Señales de actividad inauténtica que podrían requerir investigación | Repetición + marcas temporales/contexto observables y corroboración independiente |
| UNKNOWN | No hay datos para distinguir las categorías | No etiquetar por intuición; reunir evidencia permitida |

Una crítica fuerte no es automáticamente hate. Texto parecido no prueba coordinación; no se perfilan usuarios ni se atribuye motivación individual desde lenguaje aislado.

## Revisión profesional del spot

- Primeros 3–5 segundos: ¿qué claim parece hacer la imagen antes de que llegue la explicación?
- Sound-off y subtítulos: ¿se entiende promesa, condición y CTA sin sonido?
- Recorte: ¿qué significa solo el primer plano, un caption o los últimos cinco segundos?
- Casting/contexto: ¿quién tiene agencia, quién habla por quién, qué acento/vestuario/locación se vuelve un atajo?
- Prueba: ¿cada cifra, garantía, comparación, testimonial y mención institucional tiene fuente y permiso?
- Entrega: ¿funciona en safe areas, vertical, horizontal, radio/TV/OOH y exposición breve?
- Operación: ¿precio, requisitos, stock, horarios, soporte y capacidad coinciden con la promesa?
- Respuesta: ¿quién reconoce una crítica válida, quién verifica un rumor, y quién puede pausar o corregir?
- Medición: ¿hay baseline, ventana, cobertura y denominador definidos antes de publicar?

## Herramientas de repositorios revisadas (23-09-2026)

### Promptfoo

Repositorio [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo), licencia MIT. Es útil para probar que el **asistente/modelo** de CampaignOS respeta políticas (no inventar pruebas, no llamar maliciosa a la crítica, mantener UNKNOWN, no revelar PII) y para regresiones automatizadas. Red-team puede generar probes y conectarse a proveedores; la configuración por defecto puede mandar generación/grading a un servicio remoto. No se conectó a briefs ni se instaló. Evaluar en una fase separada con fixtures sintéticos, proveedor local/configuración de no-share y revisión de su tratamiento de datos.

### garak

Repositorio [NVIDIA/garak](https://github.com/NVIDIA/garak). Escáner para vulnerabilidades de modelos de lenguaje: inyección, filtración, jailbreaks, toxicidad/misinformación generada y otras fallas. Puede apoyar QA del componente LLM, pero no simula de forma válida comentarios reales sobre una propuesta de campaña ni sustituye investigación de audiencia.

### Detoxify

Repositorio [unitaryai/detoxify](https://github.com/unitaryai/detoxify). Clasificador experimental de toxicidad con modelo multilingüe que incluye español. El repositorio advierte que palabrotas/insultos pueden dar puntuación alta sin considerar tono o intención y que puede sesgarse contra grupos vulnerables. Úsese solo como señal secundaria de triage después de validar en un corpus local apropiado; nunca para decidir que alguien tiene mala intención, ocultar una crítica o moderar automáticamente. No se instaló.

### Decisión de integración

La app usa un checklist heurístico local y controles humanos primero. Ninguna de las tres herramientas predice reputación, reacción de audiencia, intensidad de hate ni coordinación. No se añadieron dependencias ni servicios de pago; eso evita coste y evita transmitir conceptos de campaña durante un preflight inicial.

## Límites actuales y siguiente fase

- El motor busca pocos patrones explícitos de claims y complementa con revisión fija; el lenguaje implícito, visual, humor, jerga, tono y contexto regional no se entienden de manera fiable con reglas.
- No verifica archivos, citas, permisos ni vigencia de las fuentes que escribe el operador.
- El análisis actual de comentarios clasifica texto suministrado, no descubre automáticamente brigading o autenticidad.
- No hay persistencia/historial compartido, workflow multi-revisor, protocolo de crisis editable ni conectores automáticos validados para todas las plataformas.
- Próximo paso profesional: pilotear con conceptos y spots sintéticos, una matriz de revisión local anotada por personas, medir falsos positivos/negativos por canal y región, y solo entonces comparar modelos/datasets. No entrenar perfiles sobre grupos ni llamar “predicción” a una taxonomía sin validación.

## Gate humano

El preflight no permite publicación. El owner de campaña, el responsable de claims/operaciones y los revisores de contexto deben resolver sus bloqueos; cualquier salida externa requiere aprobación expresa. Para considerar esto listo en GitHub también hacen falta commits publicados, CI verde y review del PR.
