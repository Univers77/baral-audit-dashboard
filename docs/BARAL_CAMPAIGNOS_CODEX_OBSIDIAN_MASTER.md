---
title: "BARAL CampaignOS — Master Operating File para Codex + Obsidian"
aliases:
  - "BARAL CampaignOS Master"
  - "CampaignOS Codex Control"
type: system-master
status: active
version: "1.0"
created: 2026-09-23
owner: "BARAL"
country_focus: "Bolivia"
human_gate: true
primary_channels:
  - Facebook
  - Instagram
  - TikTok
secondary_channels:
  - YouTube
  - WhatsApp
  - Web
traditional_channels:
  - Radio
  - Television
  - Prensa
  - Impresos
  - OOH
  - Activaciones
tags:
  - baral
  - campaignos
  - codex
  - obsidian
  - bolivia
  - marketing
  - social-listening
  - jev
  - red-team
---

# BARAL CampaignOS
## Master Operating File para Codex + Obsidian

> Este archivo es la especificación maestra y fuente de verdad operativa de BARAL CampaignOS.
> Codex debe usarlo como mapa del sistema, pero no cargarlo completo para cada tarea si no es necesario.
> La implementación debe dividir el conocimiento en archivos especializados y Skills para minimizar contexto.

---

# 0. MISIÓN

Construir un sistema operativo de marketing y comunicación para BARAL capaz de:

1. recibir contexto completo de cliente, marca, producto, campaña, restricciones y evidencia;
2. investigar mercado, competencia, conversación pública y comportamiento observable;
3. entender Bolivia con granularidad territorial, lingüística, cultural, mediática y conductual;
4. utilizar Facebook, Instagram y TikTok como canales sociales prioritarios;
5. integrar radio, televisión, prensa, impresos, OOH, activaciones y otros medios pertinentes;
6. escuchar comentarios y conversación mediante Jev + conectores compatibles;
7. detectar dudas, objeciones, desconfianza, riesgos reputacionales, contradicciones y oportunidades;
8. diseñar estrategia, mensaje, oferta, creatividad, contenido y producción;
9. anticipar ataques, críticas y malas interpretaciones mediante un Adversarial Audience Engine;
10. verificar claims y bloquear afirmaciones no sustentadas;
11. proponer experimentos en lugar de inventar resultados futuros;
12. aprender de campañas reales;
13. preservar una memoria estratégica en Obsidian;
14. permitir que una sola persona opere, audite y apruebe el sistema;
15. mantener los costos incrementales bajos;
16. hacer que Codex pueda construir, mantener, revisar y auditar todo el ecosistema.

CampaignOS no es un chatbot.

CampaignOS es un **sistema de decisión de marketing basado en evidencia, con agentes especializados, memoria estructurada y Human Gate**.

---

# 1. PRINCIPIOS NO NEGOCIABLES

```text
evidencia > elocuencia
decisión estructurada > conversación libre
datos reales > estereotipos
observado > supuesto
hipótesis > falsa predicción
determinismo > LLM cuando sea posible
modelo local > modelo premium para tareas simples
contexto mínimo necesario > contexto masivo
auditoría > confianza ciega
Bolivia real > "persona boliviana" genérica
Human Gate > autopublicación
```

Nunca:

- inventar estadísticas;
- inventar fuentes;
- inventar comportamiento regional;
- inventar modismos;
- inferir etnia, religión, ideología política o condición sensible de una persona desde un comentario;
- asumir que "rural" significa "sin internet";
- asumir que "urbano" significa homogéneo;
- asumir que una plataforma representa a toda Bolivia;
- publicar automáticamente;
- responder automáticamente una crisis;
- almacenar cookies sociales en Vercel;
- enviar secretos al repositorio;
- usar scraping para evadir autenticación, controles técnicos o términos aplicables;
- declarar éxito cuando una captura fue parcial;
- usar un score interno como si fuera una verdad científica.

---

# 2. BASE DE REALIDAD: BOLIVIA

## 2.1 Demografía territorial

El Censo de Población y Vivienda 2024 reporta:

- población censada: 11.365.333 personas;
- área urbana: 7.846.708;
- área rural: 3.518.625;
- aproximadamente 69% urbana;
- aproximadamente 31% rural.

Esto obliga a CampaignOS a trabajar con una segmentación territorial más fina que "Bolivia".

Fuente oficial:
https://cpv2024.ine.gob.bo/

## 2.2 Conectividad

El INE reporta que en el Censo 2024:

- 76,3% de los hogares tenían internet;
- en área rural, 53,9% de los hogares tenían internet.

Implicación de diseño:

> Nunca usar "rural = offline". La estrategia debe modelar combinaciones de medios digitales y tradicionales según evidencia de cada territorio.

Fuente:
https://cpv2024.ine.gob.bo/index.php/ine-presenta-resultados-del-censo-2024-que-muestran-la-transformacion-demografica-y-avances-sociales-en-bolivia/

## 2.3 Redes sociales: baseline, no verdad absoluta

DataReportal Digital 2026 Bolivia reporta, con base en herramientas publicitarias y su propia metodología:

- Facebook: 7,55 millones de alcance publicitario reportado a fines de 2025;
- Instagram: 2,55 millones;
- TikTok: 9,43 millones de usuarios de 18+ reportados por herramientas publicitarias;
- TikTok mostró fuerte crecimiento interanual en alcance publicitario.

Estas cifras **no equivalen necesariamente a usuarios activos únicos** y algunas tasas publicitarias pueden exceder 100% por metodología, duplicación y limitaciones de las plataformas.

CampaignOS debe tratar:
- Facebook;
- Instagram;
- TikTok;

como los tres canales sociales prioritarios definidos por BARAL, pero debe validar el peso real de cada uno para **cada campaña, territorio y público**.

Fuente:
https://datareportal.com/reports/digital-2026-bolivia

## 2.4 Diversidad lingüística

Bolivia es un Estado plurinacional y multilingüe. CampaignOS debe poder trabajar, cuando el contexto lo requiera, con castellano y lenguas indígenas relevantes al territorio y al público, sin asumir que toda persona de un territorio habla una lengua determinada.

La selección lingüística debe depender de:
- datos del Censo;
- briefing;
- evidencia de campo;
- corpus observado;
- validación humana.

Referencia institucional:
https://www.vicepresidencia.gob.bo/

Tabulados de idioma del Censo 2024:
https://cpv2024.ine.gob.bo/index.php/tabulados-sobre-la-tematica-pobreza/

---

# 3. MODELO TERRITORIAL DE BOLIVIA

No usar una sola variable "ciudad/campo".

## 3.1 Dimensiones obligatorias

Cada Audience Segment puede incluir:

```yaml
country: Bolivia
department: null
municipality: null
city_or_locality: null
urbanicity:
  - urban_core
  - urban_secondary
  - periurban
  - intermediate_town
  - rural_concentrated
  - rural_disperse
evidence_for_urbanicity: []
primary_language: null
secondary_languages: []
language_confidence: 0.0
register:
  - formal
  - neutral
  - conversational
  - colloquial
channel_access: []
observed_media_habits: []
economic_context: null
mobility_context: null
trust_anchors: []
observed_objections: []
observed_phrases: []
source_ids: []
```

`periurban`, `intermediate_town`, `rural_concentrated` y `rural_disperse` son categorías operativas de CampaignOS. No deben presentarse como categorías oficiales del Censo si no lo son.

## 3.2 Prioridad geográfica

El sistema debe soportar, como mínimo:

- La Paz;
- El Alto;
- Santa Cruz de la Sierra;
- Cochabamba;
- Sucre;
- Oruro;
- Potosí;
- Tarija;
- Trinidad;
- Cobija;
- municipios y localidades adicionales según campaña.

Nunca derivar personalidad únicamente de la ciudad.

La ciudad es una variable contextual, no una personalidad.

---

# 4. BOLIVIA CULTURAL INTELLIGENCE LAYER

Crear una capa específica:

```text
BOLIVIA CULTURAL INTELLIGENCE
│
├── Territory Intelligence
├── Language & Register Intelligence
├── Social Conversation Intelligence
├── Media Ecology Intelligence
├── Behavioral Evidence
├── Trust & Objection Intelligence
├── Cultural Risk
└── Human Validation
```

## 4.1 Agentes especialistas Bolivia

### B01 — Bolivia Cultural Intelligence Orchestrator
Coordina únicamente cuando la campaña tenga Bolivia como territorio objetivo.

### B02 — Regional Language Analyst
Analiza:
- registro;
- palabras frecuentes;
- expresiones;
- mezcla lingüística;
- tratamiento formal/informal;
- humor;
- nivel de tecnicismo;
- expresiones que pueden sonar artificiales.

No inventa modismos.

### B03 — Urban Audience Analyst
Modela públicos urbanos con evidencia de:
- movilidad;
- consumo;
- canales;
- comportamiento digital;
- fricciones;
- contexto de decisión.

### B04 — Peri-Urban Audience Analyst
Analiza públicos periurbanos sin reducirlos a una caricatura rural o urbana.

### B05 — Rural & Community Communication Analyst
Analiza:
- canales comunitarios;
- radio;
- presencia digital real;
- intermediarios de confianza;
- lenguaje;
- barreras de acceso;
- decisiones familiares/comunitarias cuando exista evidencia.

### B06 — Intercultural Language Reviewer
Revisa piezas destinadas a comunidades o contextos multilingües.

Debe exigir revisión humana competente antes de publicar traducciones en lenguas que no hayan sido validadas.

### B07 — Bolivia Media Ecology Planner
Cruza:
- social;
- radio;
- TV;
- prensa;
- impresos;
- OOH;
- activaciones;
- web;
- mensajería.

### B08 — Facebook Bolivia Strategist
Especialista de Facebook.

### B09 — Instagram Bolivia Strategist
Especialista de Instagram.

### B10 — TikTok Bolivia Strategist
Especialista de TikTok.

### B11 — Traditional Media Strategist
Radio, televisión y prensa.

### B12 — Print & Physical Touchpoint Strategist
Folletos, volantes, afiches, brochures, material POP, ferias, OOH y señalética.

### B13 — Social Listening Bolivia Analyst
Convierte corpus sociales en clusters, no en anécdotas.

### B14 — Bolivia Adversarial Audience Simulator
Simula objeciones usando patrones observados por segmento.

### B15 — Field Research Gap Detector
Pregunta:
- ¿qué no sabemos?;
- ¿qué debería validarse en campo?;
- ¿qué estamos asumiendo?;
- ¿qué público no está representado?

### B16 — Stereotype & Overgeneralization Guard
Bloquea generalizaciones no sustentadas sobre:
- departamento;
- ciudad;
- área rural;
- origen;
- idioma;
- clase;
- edad;
- cultura.

---

# 5. SISTEMA DE MODISMOS Y LENGUAJE

## 5.1 Regla

No habrá un diccionario fijo de "cómo habla un paceño", "cómo habla un camba" o "cómo habla una persona rural".

Eso genera estereotipos y envejece rápido.

CampaignOS construirá un **Living Language Corpus**.

## 5.2 Esquema

```json
{
  "phrase_id": "PHR-0001",
  "phrase": "texto observado",
  "region": "La Paz",
  "municipality": null,
  "urbanicity": "urban_core",
  "platform": "facebook",
  "context": "comentario orgánico",
  "meaning": "interpretación validada",
  "sentiment_context": "neutral",
  "frequency": 0,
  "first_seen": "2026-09-23",
  "last_seen": "2026-09-23",
  "source_ids": ["SRC-001"],
  "human_validated": false,
  "safe_for_brand_use": false,
  "confidence": 0.61
}
```

## 5.3 Regla de uso creativo

Una expresión local solo puede pasar a copy si:

```text
observada
+
entendida en contexto
+
no ofensiva
+
relevante para el segmento
+
compatible con la marca
+
validada
```

Nunca usar jerga solo para "sonar local".

---

# 6. PSICOLOGÍA DE COMUNICACIÓN

CampaignOS no debe aplicar psicología como manipulación.

Debe modelar variables de decisión y confianza.

## 6.1 Variables a investigar

- confianza;
- riesgo percibido;
- familiaridad;
- claridad;
- prueba;
- autoridad pertinente;
- prueba social;
- conveniencia;
- precio;
- esfuerzo;
- urgencia legítima;
- identidad;
- pertenencia;
- aspiración;
- utilidad;
- seguridad;
- control;
- transparencia;
- experiencia previa;
- miedo a equivocarse;
- costo de cambio.

## 6.2 Output estructurado

```json
{
  "mechanism": "trust_via_evidence",
  "audience_segment_id": "AUD-014",
  "evidence_ids": ["SRC-102", "SRC-144"],
  "observed_problem": "usuarios cuestionan promesa sin prueba",
  "hypothesis": "mostrar evidencia concreta puede reducir fricción de credibilidad",
  "confidence": 0.79,
  "ethical_risk": "low",
  "experiment_required": true
}
```

No:
> "Los bolivianos responden a X."

Sí:
> "En este corpus y segmento se observa X; proponemos validarlo."

---

# 7. CANALES SOCIALES PRIORITARIOS

# 7.1 Facebook

Facebook debe ser de primera clase en CampaignOS.

Casos:
- comunidades;
- páginas;
- comentarios;
- contenido de video;
- publicaciones locales;
- comercio;
- atención;
- campañas Meta;
- social proof;
- crisis;
- preguntas;
- comentarios de larga duración.

Para activos propios o administrados:
- preferir integraciones oficiales de Meta cuando estén disponibles y autorizadas.

Para observación externa:
- usar solo métodos compatibles con acceso permitido;
- no evadir autenticación ni controles;
- permitir importación manual/CSV/JSON cuando una captura automática no sea apropiada.

Outputs:
```text
Comment clusters
FAQ candidates
Trust objections
Price objections
Complaint patterns
Misinformation candidates
Purchase signals
Local-language signals
Creative reactions
```

# 7.2 Instagram

Analizar:
- posts;
- reels;
- comentarios;
- contenido visual;
- estética;
- hooks;
- saves/shares cuando existan datos propios;
- reacciones;
- lenguaje corto;
- DM solo cuando se trate de datos propios y con autorización.

# 7.3 TikTok

Analizar:
- video;
- hook;
- transcript;
- caption;
- comments;
- replies;
- trends;
- storytelling;
- duración;
- creator style;
- objeciones;
- lenguaje emergente.

Las herramientas oficiales de investigación de TikTok tienen restricciones de elegibilidad; CampaignOS no debe asumir acceso automático a ellas.

Documentación oficial:
https://developers.tiktok.com/docs/en/about-research-api

# 7.4 Canal secundario: WhatsApp

WhatsApp es soporte de:
- lead;
- consulta;
- seguimiento;
- atención;
- cierre.

No scrapea conversaciones privadas ajenas.

Solo:
- exportes propios;
- conversaciones autorizadas;
- métricas agregadas;
- FAQs derivadas.

# 7.5 YouTube

Soporte para:
- comentarios;
- long-form;
- búsqueda;
- entrevistas;
- tutoriales;
- reputación.

---

# 8. MEDIOS TRADICIONALES E IMPRESOS

CampaignOS debe ser **omnichannel real**, no "digital + un spot de radio".

## 8.1 Radio

Analizar:
- emisora;
- cobertura;
- localidad;
- idioma;
- horario;
- formato;
- audiencia declarada por fuente;
- credibilidad;
- costo;
- spot;
- mención;
- entrevista;
- microprograma;
- integración con digital.

Ingesta:
- audio autorizado;
- transcripción local con whisper.cpp;
- metadata;
- parrilla;
- clipping;
- reportes.

## 8.2 Televisión

Analizar:
- señal;
- cobertura;
- horario;
- formato;
- duración;
- contexto;
- noticiero;
- magazine;
- programa especializado;
- spot;
- branded content;
- clipping.

## 8.3 Prensa

Analizar:
- medio;
- sección;
- territorio;
- enfoque editorial;
- formato;
- publinota;
- aviso;
- entrevista;
- cobertura;
- clipping.

## 8.4 Impresos

Soportar:
- brochures;
- flyers;
- volantes;
- afiches;
- material POP;
- inserts;
- catálogos;
- señalética.

Cada pieza debe tener:
- audiencia;
- punto de contacto;
- objetivo;
- lectura esperada;
- CTA;
- QR/URL cuando corresponda;
- legibilidad;
- tamaño;
- distancia;
- idioma;
- versión territorial.

## 8.5 OOH y activación

Soportar:
- vallas;
- pantallas;
- transporte;
- mercados;
- ferias;
- tiendas;
- puntos de venta;
- eventos;
- activaciones.

No asumir que un QR es suficiente.

El plan debe considerar:
- acceso a datos;
- tiempo de exposición;
- distancia;
- memoria;
- repetición;
- CTA físico/digital.

---

# 9. ARQUITECTURA GENERAL

```text
                         ┌─────────────────────────┐
                         │      CAMPAIGN INPUT     │
                         │ cliente / marca / data  │
                         │ objetivo / presupuesto  │
                         │ territorio / evidencia  │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ CONTEXT & EVIDENCE LAYER │
                         │ Docs / Web / Social      │
                         │ Traditional / Research   │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ BOLIVIA CULTURAL INTEL   │
                         │ territory / language     │
                         │ urbanicity / media       │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ STRATEGIC ORCHESTRATOR   │
                         │ event-driven activation │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
      ┌───────▼────────┐      ┌──────▼───────┐      ┌────────▼────────┐
      │ INTELLIGENCE   │      │ STRATEGY+CRO │      │ CREATIVE STUDIO │
      │ market         │      │ offer        │      │ copy            │
      │ audience       │      │ funnel       │      │ image           │
      │ conversation   │      │ hypotheses   │      │ video           │
      └───────┬────────┘      └──────┬───────┘      └────────┬────────┘
              └───────────────────────┼────────────────────────┘
                                      │
                ┌─────────────────────┼────────────────────┐
                │                     │                    │
       ┌────────▼─────────┐ ┌────────▼────────┐ ┌─────────▼────────┐
       │ ADVERSARIAL      │ │ EVIDENCE GATE  │ │ MEDIA PLANNER    │
       │ Red Team         │ │ claims/facts   │ │ digital+offline  │
       └────────┬─────────┘ └────────┬────────┘ └─────────┬────────┘
                └─────────────────────┼────────────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │ AUDIT ORCHESTRATOR │
                           │ unknown unknowns   │
                           │ blind spots        │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │ HUMAN EXECUTIVE     │
                           │ REVIEW — YOU        │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │ PRODUCTION PACK     │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │ PERFORMANCE +       │
                           │ LEARNING LOOP       │
                           └─────────────────────┘
```

---

# 10. JEV SOCIAL INTELLIGENCE

Jev debe funcionar como **motor de decisión estructurada**, no como crawler universal.

Socai / navegadores / APIs / imports ejecutan captura.
Jev decide y clasifica.

## 10.1 Pipeline

```text
campaign question
    ↓
query planner
    ↓
source selection
    ↓
collector
    ↓
normalizer
    ↓
dedupe
    ↓
language detection
    ↓
local clustering
    ↓
representative sampling
    ↓
Jev structured decisions
    ↓
Bolivia context enrichment
    ↓
adversarial mapping
    ↓
human review
```

## 10.2 Campos Jev

```json
{
  "comment_id": "C-1",
  "platform": "facebook",
  "stance": "skeptical",
  "intent": "objection",
  "objection": "credibility",
  "risk_score": 2.8,
  "needs_human": 0.71,
  "purchase_interest": 0.21,
  "misinformation_risk": 0.34,
  "language": "es",
  "register": "colloquial",
  "region_evidence": null,
  "urbanicity_evidence": null,
  "confidence": 0.83,
  "source_id": "SRC-88"
}
```

## 10.3 Facebook como prioridad

Crear adapter contract:

```text
FacebookCollector
├── owned-page-comments
├── owned-post-comments
├── owned-ad-comments (si integración lo permite)
├── manual-import
└── compliant-public-source-import
```

No implementar bypass de login.

## 10.4 Instagram

```text
InstagramCollector
├── search
├── profile
├── post
├── reel
└── comments
```

## 10.5 TikTok

```text
TikTokCollector
├── search
├── video
├── author
├── transcript
└── comments
```

## 10.6 TraditionalMediaCollector

```text
TraditionalMediaCollector
├── audio-transcript
├── video-transcript
├── press-clipping
├── PDF
├── image-clipping
├── manual-observation
└── field-note
```

---

# 11. ESQUEMA UNIFICADO DE EVIDENCIA

```json
{
  "source_id": "SRC-00001",
  "source_type": "social_comment",
  "channel": "facebook",
  "publisher_or_account": "...",
  "url": "...",
  "captured_at": "2026-09-23T12:00:00-04:00",
  "published_at": null,
  "territory": {
    "country": "Bolivia",
    "department": null,
    "municipality": null
  },
  "content": "...",
  "language": "es",
  "evidence_quality": "direct_observation",
  "access_method": "authorized_api|browser_read|manual_import",
  "personal_data_minimized": true,
  "hash": "...",
  "notes": []
}
```

---

# 12. AGENTES BASE

## Core

- A00 Executive Orchestrator
- A01 Context Architect
- A02 Evidence Researcher
- A03 Fact Verifier
- A04 Market Intelligence
- A05 Audience Anthropologist
- A06 Strategic Planner
- A07 Behavioral Strategist
- A08 Philosopher / Meaning Agent
- A09 Offer Architect
- A10 CRO Strategist
- A11 Creative Director
- A12 Copy Strategist
- A13 SEO/AEO Agent
- A14 Art Director
- A15 AI Image Director
- A16 Video Producer
- A17 Editor/Post Producer
- A18 Social Strategist
- A19 Adversarial Audience Simulator
- A20 Hater/Troll Simulator
- A21 Expert Skeptic
- A22 Journalist Simulator
- A23 Community Manager Strategist
- A24 Brand Safety Agent
- A25 Experiment Designer
- A26 Performance Analyst
- A27 Final QA Judge

## Bolivia

- B01 Cultural Intelligence Orchestrator
- B02 Regional Language Analyst
- B03 Urban Audience Analyst
- B04 Peri-Urban Audience Analyst
- B05 Rural & Community Analyst
- B06 Intercultural Reviewer
- B07 Bolivia Media Ecology Planner
- B08 Facebook Bolivia Strategist
- B09 Instagram Bolivia Strategist
- B10 TikTok Bolivia Strategist
- B11 Traditional Media Strategist
- B12 Print/Physical Strategist
- B13 Social Listening Bolivia
- B14 Bolivia Adversarial Simulator
- B15 Field Research Gap Detector
- B16 Stereotype Guard

---

# 13. AUDITORÍA DE "LO QUE NO ESTAMOS PENSANDO"

Crear un bloque separado del Red Team.

## A28 — Chief Audit Orchestrator

No crea campaña.

Intenta descubrir:
- puntos ciegos;
- ausencia de evidencia;
- público omitido;
- dependencia de un solo canal;
- datos sesgados;
- errores de atribución;
- problemas de producción;
- costos ocultos;
- riesgo legal;
- accesibilidad;
- contexto territorial;
- contradicciones;
- riesgos de reputación;
- riesgos de implementación;
- métricas incorrectas;
- tracking insuficiente;
- escenarios extremos.

## A29 — Assumption Auditor

Convierte toda suposición en:

```json
{
  "assumption_id": "ASM-1",
  "statement": "...",
  "impact_if_wrong": 4,
  "evidence_ids": [],
  "status": "untested",
  "validation_method": "...",
  "owner": "human"
}
```

## A30 — Pre-Mortem Agent

Pregunta:

> Imagina que la campaña fracasó tres semanas después de lanzarse. ¿Qué explicaciones plausibles, observables y accionables podrían haber producido ese fracaso?

Nunca inventa hechos.
Genera escenarios.

## A31 — Missing Audience Agent

Busca públicos no representados en el corpus.

## A32 — Contradiction Auditor

Compara:
- propuesta;
- producto real;
- atención;
- precio;
- experiencia;
- claims;
- landing;
- comentarios.

## A33 — Measurement Auditor

Busca:
- vanity metrics;
- falta de baseline;
- mala atribución;
- ausencia de guardrails;
- ventanas de medición erróneas.

## A34 — Accessibility & Inclusion Reviewer

Revisa:
- contraste;
- subtítulos;
- legibilidad;
- lectura móvil;
- alfabetización digital;
- idioma;
- formato.

---

# 14. OLEADAS DE ORQUESTACIÓN

Máximo recomendado inicial: 3 agentes premium concurrentes.
Subir a 4 solo cuando el caso lo justifique.

```text
WAVE 0 — Intake
Context Architect
Evidence inventory
Gap detector

WAVE 1 — Intelligence
Market
Audience
Bolivia Cultural
Social Listening

JOIN

WAVE 2 — Strategy
Strategist
Behavioral
Offer
Media Ecology

JOIN

WAVE 3 — Creative
Creative Director
Copy
Art
Video

JOIN

WAVE 4 — Attack
Hater
Skeptic
Journalist
Bolivia Adversarial

JOIN

WAVE 5 — Audit
Fact
Brand Safety
Assumption
Measurement

JOIN

WAVE 6 — Human Gate
YOU

WAVE 7 — Production

WAVE 8 — Performance

WAVE 9 — Learning
```

---

# 15. CLAIM LEDGER

Estados:

```text
VERIFIED
PARTIALLY_VERIFIED
DISPUTED
OUTDATED
UNSUPPORTED
UNKNOWN
```

Regla:

```text
UNSUPPORTED
DISPUTED
UNKNOWN
        ↓
BLOCK EXTERNAL CLAIM
```

Modelo:

```json
{
  "claim_id": "CLAIM-104",
  "text": "...",
  "status": "VERIFIED",
  "source_ids": ["SRC-1"],
  "source_type": "primary",
  "source_date": "2026-09-20",
  "retrieved_at": "2026-09-23",
  "supporting_excerpt": "...",
  "contradictory_evidence": [],
  "confidence": 0.97,
  "allowed_for_publication": true
}
```

---

# 16. ADVERSARIAL AUDIENCE ENGINE

Simular:

- cliente escéptico;
- hater;
- experto;
- cliente frustrado;
- competencia;
- periodista;
- observador de comunidad;
- consumidor urbano;
- consumidor periurbano;
- consumidor rural/comunitario;
- audiencia de Facebook;
- audiencia de Instagram;
- audiencia de TikTok.

No atribuir una actitud a un territorio sin evidencia.

Output:

```json
{
  "objection_id": "OBJ-017",
  "segment_id": "AUD-014",
  "attack": "...",
  "category": "credibility",
  "severity": 4,
  "plausibility": 5,
  "virality": 3,
  "evidence_ids": ["SRC-7"],
  "campaign_component": "headline_02",
  "root_cause": "absolute_language",
  "recommended_action": "rewrite_before_launch",
  "recommended_change": "...",
  "response_if_published": "...",
  "confidence": 0.91
}
```

---

# 17. PRE-BUNKING

```text
CREATIVE
 ↓
ATTACK
 ↓
OBJECTION MAP
 ↓
PRE-BUNK
 ↓
REVISION
 ↓
SECOND RED TEAM
 ↓
AUDIT
 ↓
HUMAN APPROVAL
```

El objetivo no es ser mejor respondiendo a críticas.

El objetivo es reducir objeciones evitables antes de gastar presupuesto.

---

# 18. MÉTRICAS PROPIAS

## Objection Coverage Score

```text
OCS =
objeciones relevantes tratadas /
objeciones relevantes detectadas
```

## Weighted OCS

```text
Σ severity_resolved /
Σ severity_total
```

## Claim Defensibility Score

Componentes internos:
- calidad de fuente;
- actualidad;
- especificidad;
- reproducibilidad;
- integridad de contexto;
- contradicción;
- riesgo.

No presentar como métrica científica externa.

## Cultural Evidence Coverage

```text
CEC =
segmentos con evidencia cultural suficiente /
segmentos prioritarios
```

## Channel Evidence Coverage

```text
Facebook evidence
Instagram evidence
TikTok evidence
Traditional evidence
Field evidence
```

---

# 19. FUNNEL Y PERFORMANCE

```text
Impressions
↓
3-second view
↓
Watch %
↓
CTR
↓
Landing view
↓
Scroll
↓
CTA
↓
Form start
↓
Form completion
↓
Lead
↓
Qualified lead
↓
Sale
```

Más:

- negative-comment rate;
- question rate;
- objection rate;
- claim-challenge rate;
- sentiment;
- shares;
- saves;
- CPL;
- CAC;
- CVR;
- ROAS;
- response time;
- escalation rate;
- objection recurrence.

Nunca afirmar causalidad sin diseño experimental o evidencia apropiada.

---

# 20. ARQUITECTURA DE COSTO

## Tier 0
Código determinista:
- parsing;
- dedupe;
- validación;
- métricas;
- fechas;
- UTMs;
- schemas;
- hash;
- extraction simple.

## Tier 1
Local:
- Ollama;
- embeddings;
- clustering;
- sentiment;
- language detection;
- tagging;
- summarización de baja criticidad.

## Tier 2
Premium:
- estrategia;
- síntesis compleja;
- red team;
- auditoría;
- dirección creativa;
- decisiones ambiguas.

## Tier 3
Humano:
- reputación;
- claims sensibles;
- publicación;
- crisis;
- presupuesto;
- decisión final.

---

# 21. REPOSITORIO RECOMENDADO

```text
baral-campaign-os/
│
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── pyproject.toml
│
├── docs/
│   ├── BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── DECISIONS.md
│   ├── SECURITY.md
│   ├── DATA_GOVERNANCE.md
│   └── BOLIVIA_INTELLIGENCE.md
│
├── .agents/
│   └── skills/
│       ├── campaign-intake/
│       │   └── SKILL.md
│       ├── evidence-research/
│       │   └── SKILL.md
│       ├── bolivia-audience-intelligence/
│       │   └── SKILL.md
│       ├── social-listening-jev/
│       │   └── SKILL.md
│       ├── facebook-intelligence/
│       │   └── SKILL.md
│       ├── instagram-intelligence/
│       │   └── SKILL.md
│       ├── tiktok-intelligence/
│       │   └── SKILL.md
│       ├── traditional-media/
│       │   └── SKILL.md
│       ├── claim-verification/
│       │   └── SKILL.md
│       ├── adversarial-red-team/
│       │   └── SKILL.md
│       ├── audit-blind-spots/
│       │   └── SKILL.md
│       ├── creative-studio/
│       │   └── SKILL.md
│       ├── media-plan-bolivia/
│       │   └── SKILL.md
│       ├── performance-learning/
│       │   └── SKILL.md
│       └── obsidian-sync/
│           └── SKILL.md
│
├── apps/
│   ├── dashboard/
│   └── api/
│
├── campaign_os/
│   ├── orchestrator/
│   ├── agents/
│   │   ├── core/
│   │   ├── bolivia/
│   │   └── audit/
│   ├── flows/
│   ├── schemas/
│   ├── ingestion/
│   │   ├── social/
│   │   ├── web/
│   │   ├── docs/
│   │   └── traditional/
│   ├── evidence/
│   ├── research/
│   ├── strategy/
│   ├── cultural_intelligence/
│   ├── adversarial/
│   ├── creative/
│   ├── media/
│   ├── production/
│   ├── analytics/
│   ├── memory/
│   └── evals/
│
├── connectors/
│   ├── facebook/
│   ├── instagram/
│   ├── tiktok/
│   ├── youtube/
│   ├── traditional_media/
│   └── manual_import/
│
├── prompts/
│   ├── base/
│   ├── strategy/
│   ├── bolivia/
│   ├── adversarial/
│   ├── audit/
│   └── production/
│
├── schemas/
│   ├── campaign/
│   ├── evidence/
│   ├── audiences/
│   ├── cultural/
│   ├── social/
│   └── analytics/
│
├── data/
│   ├── raw/
│   ├── normalized/
│   ├── cache/
│   └── exports/
│
├── knowledge/
│   └── obsidian-vault/
│       ├── 00-HOME/
│       ├── 01-CLIENTS/
│       ├── 02-CAMPAIGNS/
│       ├── 03-BOLIVIA/
│       ├── 04-AUDIENCES/
│       ├── 05-CHANNELS/
│       ├── 06-EVIDENCE/
│       ├── 07-STRATEGY/
│       ├── 08-CREATIVE/
│       ├── 09-RED-TEAM/
│       ├── 10-PERFORMANCE/
│       ├── 11-LEARNINGS/
│       ├── 12-DECISIONS/
│       ├── 90-TEMPLATES/
│       └── 99-SYSTEM/
│
├── scripts/
│   ├── collect-social.*
│   ├── normalize-comments.*
│   ├── cluster-comments.*
│   ├── export-obsidian.*
│   ├── audit-campaign.*
│   └── backup-vault.*
│
└── tests/
    ├── unit/
    ├── integration/
    ├── evals/
    ├── prompts/
    └── security/
```

---

# 22. REGLA DE DATOS Y GIT

Nunca commitear bruto social.

`.gitignore`:

```gitignore
.env
.env.*
!.env.example

data/raw/
data/normalized/private/
data/cache/

knowledge/obsidian-vault/.obsidian/workspace*
knowledge/obsidian-vault/.trash/
knowledge/obsidian-vault/.DS_Store

*.sqlite
*.db
secrets/
```

Sí commitear:
- schemas;
- plantillas;
- insights curados;
- fuentes públicas;
- decisiones;
- docs;
- learnings sin datos personales innecesarios.

---

# 23. CODEX: ESTRATEGIA DE INSTRUCCIONES

No meter toda esta especificación dentro de `AGENTS.md`.

La guía actual de Codex favorece:
- `AGENTS.md` breve;
- reglas permanentes;
- Skills específicas;
- instrucciones por subdirectorio cuando sea necesario.

Codex carga `AGENTS.md` desde la raíz hacia el CWD y los archivos más profundos pueden especializar instrucciones.

Referencia:
https://developers.openai.com/api/docs/guides/latest-model

## AGENTS.md raíz recomendado

```md
# BARAL CampaignOS

## Mission
Build and maintain an evidence-grounded marketing operating system for Bolivia.

## Non-negotiables
- Human approval is required before publication.
- Never fabricate evidence, statistics, sources, cultural behavior or campaign results.
- Prefer deterministic code over LLM calls.
- Prefer local/open-source processing before paid inference when quality permits.
- Never bypass Claim Ledger, Evidence Gate, Audit Gate or Human Gate.
- Social credentials and cookies must remain local; never commit or send them to Vercel.
- Never infer ethnicity, religion, political ideology or other sensitive traits from social comments.
- Bolivia audience conclusions must distinguish observed evidence from hypotheses.
- Facebook, Instagram and TikTok are first-class channels.
- Traditional media must remain supported.
- Keep Windows compatibility.

## Use Skills
Use the relevant `.agents/skills/*/SKILL.md` workflow when the task matches it.

## Documentation
Read only the docs relevant to the current change.
Use `docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md` for overall architecture.
Use `docs/BOLIVIA_INTELLIGENCE.md` for Bolivia segmentation changes.
Use `docs/SECURITY.md` for data/auth changes.

## Verification
For code changes:
- type-check;
- run relevant tests;
- run evals if prompts or agent behavior changed;
- report remaining uncertainty.

## Cost
Do not introduce a paid dependency without explicit human approval.
```

---

# 24. NESTED AGENTS.md

Ejemplo:

`campaign_os/cultural_intelligence/AGENTS.md`

```md
# Bolivia Cultural Intelligence

- Treat territory as context, never as a personality.
- Never invent regional slang.
- Every cultural or linguistic conclusion needs evidence IDs or must be marked HYPOTHESIS.
- Do not infer sensitive traits.
- Require human validation for indigenous-language external copy.
- Use the Living Language Corpus.
```

`connectors/AGENTS.md`

```md
# Connector Safety

- Do not bypass login, CAPTCHAs, access controls or rate limits.
- Prefer authorized APIs for owned assets.
- Preserve source URL and capture timestamp.
- Partial extraction must be labeled partial.
- Never store browser cookies in cloud deployment.
```

---

# 25. CODEX SKILLS

## Skill contract

Cada skill debe contener:
- trigger;
- required inputs;
- exact workflow;
- allowed tools;
- schemas;
- acceptance criteria;
- tests;
- output location.

## campaign-intake

Convierte briefing en CampaignContext.

## evidence-research

Investiga hechos y crea Evidence Ledger.

## bolivia-audience-intelligence

Construye AudienceMap con:
- territory;
- urbanicity;
- language;
- channel;
- evidence.

## social-listening-jev

Ejecuta:
- collect;
- normalize;
- dedupe;
- cluster;
- Jev;
- save.

## facebook-intelligence

Facebook-first workflow.

## instagram-intelligence

Instagram workflow.

## tiktok-intelligence

TikTok workflow.

## traditional-media

Radio/TV/print/clipping.

## claim-verification

Bloquea claims.

## adversarial-red-team

Ejecuta ataques defensivos.

## audit-blind-spots

Ejecuta:
- assumption audit;
- pre-mortem;
- missing audience;
- measurement audit.

## creative-studio

Produce 3 territorios creativos como máximo.

## media-plan-bolivia

Crea plan omnicanal.

## performance-learning

Convierte resultados en learnings.

## obsidian-sync

Crea/actualiza notas Obsidian.

---

# 26. OBSIDIAN COMO MEMORIA ESTRATÉGICA

## 26.1 Principio

Obsidian no es el data lake.

Obsidian guarda:
- conocimiento;
- decisiones;
- contexto;
- fuentes;
- insights;
- patrones;
- aprendizajes.

No guarda:
- millones de comentarios;
- cookies;
- credenciales;
- datos personales innecesarios;
- blobs de scraping.

## 26.2 Vault

Abrir como vault:

```text
knowledge/obsidian-vault/
```

Obsidian soporta propiedades YAML, wikilinks y rutas de carpeta.

Referencias:
https://obsidian.md/help/properties
https://obsidian.md/help/links
https://help.obsidian.md/Extending%2BObsidian/Obsidian%2BURI

---

# 27. ESTRUCTURA OBSIDIAN

```text
00-HOME/
   CampaignOS Home.md
   Inbox.md
   Current Priorities.md

01-CLIENTS/
   CLIENT - {name}.md

02-CAMPAIGNS/
   {client}/
      CAMPAIGN - {name}.md

03-BOLIVIA/
   Bolivia Intelligence Index.md
   Departments/
   Cities/
   Urbanicity/
   Language/
   Media Ecology/
   Living Language Corpus/

04-AUDIENCES/
   AUD - {segment}.md

05-CHANNELS/
   Facebook.md
   Instagram.md
   TikTok.md
   Radio.md
   Television.md
   Print.md
   OOH.md
   WhatsApp.md

06-EVIDENCE/
   Sources/
   Claims/

07-STRATEGY/
   Insights/
   Positioning/
   Messaging/
   Offers/

08-CREATIVE/
   Concepts/
   Copy/
   Visual/
   Video/

09-RED-TEAM/
   Objections/
   Vulnerabilities/
   PreMortems/

10-PERFORMANCE/
   Experiments/
   Reports/

11-LEARNINGS/
   Learnings/
   Patterns/

12-DECISIONS/
   DEC - YYYY-MM-DD - title.md

90-TEMPLATES/
   Client.md
   Campaign.md
   Audience.md
   Source.md
   Insight.md
   Objection.md
   Decision.md
   Learning.md

99-SYSTEM/
   Agent Registry.md
   Skills Registry.md
   Taxonomy.md
   Data Dictionary.md
```

---

# 28. OBSIDIAN TEMPLATE — CAMPAIGN

```md
---
id: CAM-2026-001
type: campaign
status: discovery
client: "[[CLIENT - Example]]"
country: Bolivia
departments: []
urbanicity: []
channels:
  - Facebook
  - Instagram
  - TikTok
human_owner: true
created: 2026-09-23
updated: 2026-09-23
---

# Campaign

## Objective

## Business problem

## Audience

## Territory

## Evidence

## Strategy

## Claims

## Risks

## Red Team

## Media

## Creative

## Experiments

## Human decisions

## Results

## Learnings
```

---

# 29. OBSIDIAN TEMPLATE — AUDIENCE

```md
---
id: AUD-0001
type: audience
country: Bolivia
department:
municipality:
urbanicity:
primary_language:
channels: []
status: research
confidence: 0
---

# Audience

## Evidence

## Context

## Jobs / needs

## Frictions

## Trust

## Objections

## Language and register

## Observed phrases

## Media behavior

## Purchase path

## Unknowns

## Do not assume
```

---

# 30. OBSIDIAN TEMPLATE — SOURCE

```md
---
id: SRC-0001
type: source
source_type:
url:
publisher:
published_at:
captured_at:
territory:
status: active
---

# Source

## What it supports

## Evidence excerpt

## Limitations

## Contradictions

## Related claims
```

---

# 31. OBSIDIAN TEMPLATE — DECISION

```md
---
id: DEC-2026-001
type: decision
date: 2026-09-23
campaign:
status: approved
human_decision: true
---

# Decision

## Decision

## Why

## Evidence considered

## Alternatives

## Risks

## What would make us reverse this decision?

## Follow-up
```

---

# 32. OBSIDIAN TEMPLATE — LEARNING

```md
---
id: LRN-0001
type: learning
campaign:
audience:
channel:
confidence: 0
reusable: false
---

# Learning

## Observed

## Interpretation

## Evidence

## Where it applies

## Where it does NOT apply

## Next test
```

---

# 33. OBSIDIAN SYNC CONTRACT

Codex puede editar el vault directamente porque son Markdown.

Reglas:

```text
RAW DATA
  → database/files

CURATED KNOWLEDGE
  → Obsidian

CODE
  → Git

DECISIONS
  → Obsidian + Git when non-sensitive

SECRETS
  → environment/local secret store
```

Cada run importante debe poder crear:

```text
Campaign note
Research note
Decision note
Audit note
Learning note
```

---

# 34. CODEX COMMAND PLAYBOOK

Desde Codex, el operador debería poder escribir:

## Nueva campaña

```text
Start a new BARAL CampaignOS campaign.
Use the campaign-intake skill.
Do not create strategy yet.
Create the CampaignContext, Evidence Gap list and Obsidian campaign note.
```

## Mapear Bolivia

```text
Run Bolivia audience intelligence for CAM-XXXX.
Segment by territory, urbanicity, language/register and channel.
Do not infer cultural behavior without evidence.
Produce unknowns and field-research gaps.
```

## Escuchar Facebook/Instagram/TikTok

```text
Run social-listening-jev for CAM-XXXX.
Prioritize Facebook, Instagram and TikTok.
Collect only through permitted connectors.
Normalize and deduplicate locally.
Cluster before premium inference.
Store raw data outside Git.
Write only curated insights to Obsidian.
```

## Red Team

```text
Run adversarial-red-team for CAM-XXXX.
Attack claims, wording, visual concept, price, credibility, cultural fit and channel fit.
Use evidence-backed Bolivia audience segments.
Do not fabricate reactions.
```

## Auditoría de puntos ciegos

```text
Run audit-blind-spots for CAM-XXXX.
Perform assumption audit, pre-mortem, missing-audience review, measurement audit and operational-risk review.
Do not repair anything yet.
Return CRITICAL / HIGH / MEDIUM / LOW with evidence.
```

## Media plan

```text
Build a Bolivia omnichannel media plan for CAM-XXXX.
Include Facebook, Instagram, TikTok, traditional media and physical touchpoints only where evidence supports them.
Separate facts, hypotheses and recommendations.
```

## Sincronizar Obsidian

```text
Run obsidian-sync for CAM-XXXX.
Create or update only curated knowledge.
Do not copy raw social comments into the vault unless specifically selected as evidence.
```

## Cierre de campaña

```text
Run performance-learning for CAM-XXXX.
Separate OBSERVED / CORRELATED / EXPERIMENTALLY_SUPPORTED / HYPOTHESIS.
Create reusable learnings and update Obsidian.
```

---

# 35. HUMAN SOLO-OPERATOR UX

El dashboard debe reducir todo a una cola.

## Home

```text
WHAT NEEDS YOU NOW?

1 Critical risk
3 claims to approve
6 creative decisions
2 experiments ready
4 new learnings
```

No mostrar 200 widgets.

## Five human actions

1. Review
2. Approve
3. Reject
4. Ask for evidence
5. Request another test

Todo lo demás debe ser delegado.

---

# 36. DASHBOARD

Secciones:

1. Campaign
2. Context
3. Bolivia Intelligence
4. Social Listening
5. Evidence
6. Strategy
7. Media
8. Creative Lab
9. Red Team
10. Audit
11. Production
12. Experiments
13. Performance
14. Learnings
15. Human Queue

---

# 37. FACEBOOK / INSTAGRAM / TIKTOK WAR ROOM

Mostrar:

```text
Total corpus
New since last run
Clusters
Critical objections
Purchase signals
Questions
Claims challenged
Misinformation candidates
Regional language signals
Unknown location
Human review
```

Filtros:
- channel;
- campaign;
- date;
- territory only when evidenced;
- urbanicity only when evidenced;
- cluster;
- risk;
- intent;
- objection;
- reviewed/unreviewed.

---

# 38. TRADITIONAL MEDIA WAR ROOM

Mostrar:
- mentions;
- clipping;
- station/outlet;
- territory;
- transcript;
- topic;
- sentiment as model output;
- evidence;
- campaign linkage;
- human notes.

---

# 39. CREATIVE STUDIO

Máximo tres territorios.

Cada concepto:

```json
{
  "concept_id": "CRE-1",
  "insight_id": "INS-4",
  "strategic_idea": "...",
  "creative_device": "...",
  "execution": "...",
  "cta": "...",
  "behavioral_mechanism": "...",
  "audience_ids": [],
  "channel_versions": {
    "facebook": "...",
    "instagram": "...",
    "tiktok": "...",
    "radio": "...",
    "print": "..."
  },
  "evidence_ids": [],
  "risks": []
}
```

---

# 40. PRODUCTION

Local-first:

- ComfyUI;
- FFmpeg;
- MoviePy;
- whisper.cpp.

Si no existe GPU:
- visual brief;
- prompt;
- negative prompt;
- storyboard;
- shot list;
- edit decision list;
- asset manifest.

---

# 41. TESTS OBLIGATORIOS

```text
test_no_fake_statistics
test_no_fake_sources
test_claim_gate_blocks_unknown
test_claim_gate_blocks_disputed
test_no_sensitive_trait_inference
test_no_region_from_slang_only
test_no_rural_equals_offline
test_bolivia_segment_needs_evidence
test_facebook_first_class_connector_contract
test_social_cookie_never_cloud
test_partial_capture_is_partial
test_hater_does_not_fabricate_scandal
test_creative_references_strategy
test_experiment_has_metric
test_no_observational_causality
test_human_gate_required
test_obsidian_does_not_ingest_raw_by_default
test_final_judge_blocks_critical_risk
```

---

# 42. SECURITY

## Never cloud

- browser cookies;
- session files;
- passwords;
- social tokens unless explicitly designed and encrypted;
- raw private messages;
- unnecessary personal data.

## Cloud allowed

- aggregates;
- non-sensitive evidence;
- IDs;
- public URLs;
- campaign state;
- audit state;
- human decisions.

---

# 43. GITHUB + VERCEL

Recommended branch flow:

```text
feature/*
  ↓
PR
  ↓
Preview Deployment
  ↓
Tests
  ↓
Human review
  ↓
Merge
  ↓
Production
```

Current CampaignOS work can remain isolated in:

```text
campaignos-jev-mvp
```

Never auto-merge a marketing-system change that alters:
- evidence gates;
- publication permissions;
- connector permissions;
- secret handling;
- human gate.

---

# 44. OBSERVABILITY

Every agent run:

```json
{
  "agent": "A28",
  "campaign_id": "CAM-1",
  "input_artifacts": [],
  "output_artifact": "...",
  "model": "...",
  "prompt_version": "...",
  "started_at": "...",
  "completed_at": "...",
  "tokens": null,
  "cost": null,
  "tool_calls": [],
  "validation": "passed",
  "retry_count": 0,
  "error": null
}
```

Langfuse optional.

---

# 45. AUDIT SCHEDULE

## Per campaign

### Gate 1 — Input
- missing data;
- incomplete product truth;
- audience assumptions.

### Gate 2 — Strategy
- evidence;
- logic;
- alternatives;
- Bolivia fit.

### Gate 3 — Creative
- claim;
- cultural;
- accessibility;
- channel.

### Gate 4 — Pre-launch
- tracking;
- landing;
- media;
- crisis;
- Human Gate.

### Gate 5 — Post-launch
- performance;
- comments;
- new objections;
- unintended reactions.

### Gate 6 — Learning
- reusable;
- non-transferable;
- next experiment.

---

# 46. UNKNOWN-UNKNOWNS CHECKLIST

Antes de aprobar:

- ¿Qué público no vimos?
- ¿Qué territorio no está representado?
- ¿Qué fuente contradice la conclusión?
- ¿Qué pasaría si el claim se captura fuera de contexto?
- ¿Qué pasaría si un periodista lo cita literalmente?
- ¿Qué pasaría si un competidor responde?
- ¿Qué parte depende de una experiencia real que la marca no controla?
- ¿Existe una diferencia entre promesa y servicio?
- ¿La campaña funciona en conexión lenta?
- ¿Funciona sin audio?
- ¿Funciona en pantalla pequeña?
- ¿Funciona impresa?
- ¿Funciona para una persona que no conoce la marca?
- ¿El lenguaje parece escrito por IA?
- ¿Estamos usando jerga local de forma artificial?
- ¿Estamos confundiendo correlación con causa?
- ¿Estamos midiendo vanity metrics?
- ¿Hay un riesgo de privacidad?
- ¿Estamos sobre-representando la ciudad?
- ¿Estamos invisibilizando periurbano o rural?
- ¿Estamos suponiendo que lo digital reemplaza radio/TV/impreso?
- ¿Estamos usando una sola plataforma como espejo del país?

---

# 47. PROMPT BASE DEL SISTEMA

```text
You are a specialist inside BARAL CampaignOS.

Complete only the specialist task assigned to you.

Use:
Campaign Context
Evidence Registry
Brand Rules
Audience Model
Bolivia Context
Tool Results

Rules:

1. Separate FACT / INTERPRETATION / HYPOTHESIS / RECOMMENDATION.
2. Never invent statistics, quotations, sources, behavior or campaign results.
3. Every externally verifiable factual claim requires evidence IDs.
4. If evidence is insufficient, return UNKNOWN.
5. Do not silently fill gaps.
6. Do not infer sensitive personal traits.
7. Do not infer region from slang alone.
8. Do not generalize Bolivian audiences without segment evidence.
9. Challenge contradictions.
10. Use the requested structured schema.
11. Minimize redundant prose.
12. Predictions are hypotheses.
13. Flag factual, cultural, reputational, legal and operational risk.
14. Mark BLOCKED when required evidence is absent.
15. Publication always requires human approval.
```

---

# 48. PROMPT — BOLIVIA CULTURAL INTELLIGENCE

```text
ROLE: Bolivia Cultural Intelligence Analyst

Analyze the supplied evidence for a specific campaign.

Do not describe a generic Bolivian consumer.

Segment only when supported by evidence using:
territory
urbanicity
language/register
generation if known
channel
decision context

For every conclusion provide:
statement
type = FACT | INTERPRETATION | HYPOTHESIS
evidence_ids
confidence
scope
where_not_to_generalize

Identify:
language patterns
trust signals
objections
channel behavior
media opportunities
cultural risks
missing evidence

Never invent local slang.
Never infer ethnicity, religion or political ideology.
Never equate rural with offline.
```

---

# 49. PROMPT — CHIEF AUDIT ORCHESTRATOR

```text
ROLE: Chief Audit Orchestrator

Your task is to find what the current campaign team may have failed to consider.

Do not improve the campaign yet.

Audit:
evidence quality
assumptions
missing audiences
Bolivia territorial coverage
language and register
social-channel bias
traditional-media omission
claims
measurement
tracking
operational feasibility
creative misinterpretation
accessibility
privacy
security
cost
production
reputational risk

For each issue return:
severity
finding
evidence
why_it_matters
what_would_validate_it
owner
blocking
confidence

Prioritize:
CRITICAL
HIGH
MEDIUM
LOW

Explicitly list:
UNKNOWN_UNKNOWNS_TO_INVESTIGATE
```

---

# 50. PROMPT — CODEX REVIEWER

```text
Audit BARAL CampaignOS implementation.

Do not trust existing architecture because it exists.

Inspect only files relevant to this audit.

Find:
architectural weaknesses
unnecessary complexity
token inefficiency
missing validation
race conditions
security issues
weak tests
prompt leakage
unbounded loops
unnecessary LLM calls
places deterministic code should replace inference
evidence-gate bypasses
Human-Gate bypasses
Bolivia stereotype risks
social credential exposure
Obsidian data pollution
connector compliance risks
measurement flaws

Produce:
CRITICAL
HIGH
MEDIUM
LOW

Include file paths and line references when available.

Do not modify files until the audit is complete.
```

---

# 51. PROMPT MAESTRO PARA CODEX

```text
You are the principal engineering and audit agent for BARAL CampaignOS.

The source of truth is:
docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md

Do not load the entire master file for trivial edits.
Read only the sections and linked docs necessary for the task.

Primary mission:
Build an evidence-grounded, Bolivia-aware, omnichannel marketing operating system that can be safely operated by one human.

Priority channels:
1. Facebook
2. Instagram
3. TikTok

Also support:
radio
television
press
print
OOH
activations
web
YouTube
WhatsApp where authorized

Core architecture:
event-driven specialist activation
typed contracts
Evidence Ledger
Claim Ledger
Bolivia Cultural Intelligence
Jev Social Intelligence
Adversarial Audience Engine
Blind-Spot Audit
Creative Studio
Media Planning
Human Gate
Performance Learning
Obsidian strategic memory

Repository rules:
- keep AGENTS.md concise;
- implement domain workflows as `.agents/skills/*/SKILL.md`;
- use nested AGENTS.md only for domain-specific rules;
- use Pydantic/typed schemas for inter-agent artifacts;
- prefer deterministic/local computation before paid inference;
- no secret in Git;
- social cookies stay local;
- no auto-publication;
- no sensitive-trait inference;
- no geographic stereotype;
- no unsupported external claim;
- no campaign prediction presented as fact.

Bolivia rules:
- audience = evidence-backed segment, never "Bolivian consumer";
- model urban / periurban / intermediate / rural separately when useful;
- language and slang require observed evidence;
- consider both digital and traditional media;
- Facebook, Instagram and TikTok are first-class;
- preserve scope: an insight from one corpus does not automatically generalize nationally.

Obsidian:
knowledge/obsidian-vault is the curated strategic memory.
Do not dump raw social datasets into Obsidian.
Use YAML properties and stable IDs.
Use wikilinks between client, campaign, audience, evidence, decisions and learnings.

When solving a task:
1. identify domain;
2. load relevant skill;
3. inspect relevant files;
4. state unknown dependencies internally;
5. prefer minimum-change implementation;
6. implement;
7. type-check/test;
8. run relevant evals;
9. run audit if behavior changed;
10. update Obsidian only with curated knowledge;
11. produce a commit-ready summary.

For campaign-system changes, do not merge or deploy automatically unless explicitly instructed by the human.

Human approval is final.
```

---

# 52. IMPLEMENTATION ROADMAP

## Phase 0 — Governance
- Master file
- AGENTS.md
- Skills registry
- Security
- Obsidian vault
- schemas

## Phase 1 — Evidence
- SourceRecord
- ClaimRecord
- imports
- web
- docs

## Phase 2 — Bolivia Intelligence
- territory ontology
- audience schema
- language corpus
- cultural guard

## Phase 3 — Social Intelligence
- Facebook contract
- Instagram connector
- TikTok connector
- Jev
- clustering

## Phase 4 — Traditional Media
- audio/video transcription
- clipping
- media source model

## Phase 5 — Strategy
- market
- audience
- offer
- media

## Phase 6 — Adversarial
- hater
- skeptic
- journalist
- complaint
- pre-mortem

## Phase 7 — Audit
- assumptions
- unknown unknowns
- measurement
- accessibility
- security

## Phase 8 — Creative
- concepts
- copy
- visual
- video

## Phase 9 — Production
- ComfyUI
- FFmpeg
- MoviePy
- whisper.cpp

## Phase 10 — Performance
- PostHog
- experiments
- learning

## Phase 11 — Dashboard
- Human Queue
- War Rooms
- approvals

---

# 53. MVP BOUNDARY

El MVP debe poder hacer bien:

1. crear campaña;
2. cargar contexto;
3. registrar evidencia;
4. mapear segmentos Bolivia sin estereotipos;
5. importar comentarios Facebook/Instagram/TikTok;
6. capturar Instagram/TikTok mediante conector permitido;
7. clasificar con Jev/fallback;
8. clusterizar;
9. detectar objeciones;
10. ejecutar Red Team;
11. ejecutar Blind Spot Audit;
12. crear strategy brief;
13. crear tres territorios creativos;
14. guardar decisiones en Obsidian;
15. exigir Human Gate.

No necesita inicialmente:
- autopublicar;
- responder comentarios;
- comprar medios;
- modificar ads;
- entrenar modelos propios;
- replicar todas las APIs sociales;
- generar miles de piezas.

---

# 54. DEFINITION OF DONE

Una fase está terminada cuando:

```text
code works
+
schema validates
+
tests pass
+
evals pass where relevant
+
no new critical security issue
+
docs updated
+
Obsidian knowledge updated if needed
+
human can understand output
```

---

# 55. OPERACIÓN DIARIA PARA UNA SOLA PERSONA

## Inicio

Abrir:
`00-HOME/CampaignOS Home.md`

Revisar:
- Human Queue;
- campañas activas;
- critical risks;
- pending claims;
- experiment results.

## Para una campaña nueva

1. Intake.
2. Evidence gaps.
3. Research.
4. Bolivia mapping.
5. Social listening.
6. Strategy.
7. Creative.
8. Red Team.
9. Blind Spot Audit.
10. Human approval.
11. Production.
12. Launch.
13. Listen.
14. Learn.

No saltar:
Evidence → Audit → Human Gate.

---

# 56. FUENTES DE REFERENCIA

## Bolivia

- [INE Censo 2024](https://cpv2024.ine.gob.bo/)

- [INE población](https://www.ine.gob.bo/index.php/estadisticas-sociales/poblacion-censo/)

- [INE tabulados 2024](https://cpv2024.ine.gob.bo/index.php/tabulados-sobre-la-tematica-pobreza/)

- [DataReportal Digital 2026 Bolivia](https://datareportal.com/reports/digital-2026-bolivia)

- [ATT Bolivia](https://www.att.gob.bo/)

## Codex / OpenAI

- [Codex / model guidance](https://developers.openai.com/api/docs/guides/latest-model)

- [Multi-agent](https://developers.openai.com/api/docs/guides/responses-multi-agent)

- [Docs MCP](https://developers.openai.com/learn/docs-mcp)

- [Agents](https://developers.openai.com/api/docs/guides/agents)

## Obsidian

- [Properties](https://obsidian.md/help/properties)

- [Internal links](https://obsidian.md/help/links)

- [Obsidian URI](https://help.obsidian.md/Extending%2BObsidian/Obsidian%2BURI)

## TikTok

- [Research tools](https://developers.tiktok.com/docs/en/about-research-api)

- [Video comments](https://developers.tiktok.com/docs/en/research-api-specs-query-video-comments)

---

# 57. PRIMERA INSTRUCCIÓN PARA CODEX

Copiar y ejecutar desde la raíz:

```text
Read docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md.

Treat it as the architecture and governance source of truth.

Do not implement the entire system in one pass.

First:
1. audit the existing repository;
2. map current components to the target architecture;
3. identify reusable code;
4. identify conflicts;
5. create a gap analysis;
6. propose the minimal folder migration;
7. create/update root AGENTS.md;
8. create the `.agents/skills` skeleton;
9. create `knowledge/obsidian-vault` skeleton;
10. create docs/BOLIVIA_INTELLIGENCE.md;
11. create docs/SECURITY.md;
12. create schemas for CampaignContext, AudienceSegment, SourceRecord, ClaimRecord, Objection and HumanDecision;
13. add tests for evidence, cultural generalization, sensitive-trait inference and Human Gate.

Do not delete existing working features.
Do not merge.
Do not deploy.
Do not add paid dependencies.

Return:
CURRENT STATE
GAPS
RISKS
PROPOSED CHANGES
FILES CREATED
FILES MODIFIED
TEST RESULTS
NEXT SAFE STEP
```

---

# 58. FINAL CONTROL RULE

CampaignOS debe poder responder a esta pregunta antes de cualquier campaña:

> ¿Qué sabemos, qué creemos, qué no sabemos, quién podría reaccionar de una forma que no estamos considerando, qué evidencia tenemos, qué deberíamos validar y qué decisión debe seguir siendo humana?

Si no puede responderla, la campaña todavía no está lista.
