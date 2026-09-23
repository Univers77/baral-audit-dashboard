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

# 2. BASE DE REALIDAD: BOLIVIA

## 2.1 Demografía territorial

El Censo de Población y Vivienda 2024 reporta:
- población censada: 11.365.333 personas;
- área urbana: 7.846.708;
- área rural: 3.518.625;
- aproximadamente 69% urbana;
- aproximadamente 31% rural.

Fuente oficial: https://cpv2024.ine.gob.bo/

## 2.2 Conectividad

El INE reporta que en el Censo 2024:
- 76,3% de los hogares tenían internet;
- en área rural, 53,9% de los hogares tenían internet.

Implicación: nunca usar "rural = offline".

Fuente: https://cpv2024.ine.gob.bo/index.php/ine-presenta-resultados-del-censo-2024-que-muestran-la-transformacion-demografica-y-avances-sociales-en-bolivia/

## 2.3 Redes sociales: baseline, no verdad absoluta

DataReportal Digital 2026 Bolivia reporta, con base en herramientas publicitarias y su propia metodología:
- Facebook: 7,55 millones de alcance publicitario reportado a fines de 2025;
- Instagram: 2,55 millones;
- TikTok: 9,43 millones de usuarios de 18+ reportados por herramientas publicitarias.

Estas cifras no equivalen necesariamente a usuarios activos únicos.

CampaignOS debe tratar Facebook, Instagram y TikTok como los tres canales sociales prioritarios definidos por BARAL, validando el peso real de cada uno para cada campaña, territorio y público.

Fuente: https://datareportal.com/reports/digital-2026-bolivia

## 2.4 Diversidad lingüística

La selección lingüística debe depender de datos del Censo, briefing, evidencia de campo, corpus observado y validación humana. No asumir idioma por territorio.

Tabulados de idioma: https://cpv2024.ine.gob.bo/index.php/tabulados-sobre-la-tematica-pobreza/

# 3. MODELO TERRITORIAL DE BOLIVIA

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

`periurban`, `intermediate_town`, `rural_concentrated` y `rural_disperse` son categorías operativas de CampaignOS; no presentarlas como categorías oficiales si no lo son.

Soportar como mínimo La Paz, El Alto, Santa Cruz de la Sierra, Cochabamba, Sucre, Oruro, Potosí, Tarija, Trinidad, Cobija y municipios/localidades adicionales según campaña.

La ciudad es una variable contextual, no una personalidad.

# 4. BOLIVIA CULTURAL INTELLIGENCE LAYER

```text
BOLIVIA CULTURAL INTELLIGENCE
├── Territory Intelligence
├── Language & Register Intelligence
├── Social Conversation Intelligence
├── Media Ecology Intelligence
├── Behavioral Evidence
├── Trust & Objection Intelligence
├── Cultural Risk
└── Human Validation
```

Agentes:
- B01 Bolivia Cultural Intelligence Orchestrator
- B02 Regional Language Analyst
- B03 Urban Audience Analyst
- B04 Peri-Urban Audience Analyst
- B05 Rural & Community Communication Analyst
- B06 Intercultural Language Reviewer
- B07 Bolivia Media Ecology Planner
- B08 Facebook Bolivia Strategist
- B09 Instagram Bolivia Strategist
- B10 TikTok Bolivia Strategist
- B11 Traditional Media Strategist
- B12 Print & Physical Touchpoint Strategist
- B13 Social Listening Bolivia Analyst
- B14 Bolivia Adversarial Audience Simulator
- B15 Field Research Gap Detector
- B16 Stereotype & Overgeneralization Guard

# 5. SISTEMA DE MODISMOS Y LENGUAJE

No habrá un diccionario fijo de "cómo habla" una ciudad o región. CampaignOS construirá un **Living Language Corpus** a partir de evidencia real.

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
  "source_ids": ["SRC-001"],
  "human_validated": false,
  "safe_for_brand_use": false,
  "confidence": 0.61
}
```

Una expresión local solo puede pasar a copy si fue observada, entendida en contexto, es no ofensiva, relevante, compatible con marca y validada.

# 6. PSICOLOGÍA DE COMUNICACIÓN

Modelar variables de decisión y confianza, no manipulación: confianza, riesgo percibido, familiaridad, claridad, prueba, autoridad pertinente, prueba social, conveniencia, precio, esfuerzo, urgencia legítima, identidad, pertenencia, aspiración, utilidad, seguridad, control, transparencia, experiencia previa, miedo a equivocarse y costo de cambio.

No decir "Los bolivianos responden a X". Decir: "En este corpus y segmento se observa X; proponemos validarlo".

# 7. CANALES SOCIALES PRIORITARIOS

## Facebook
Primera clase: comunidades, páginas, comentarios, video, publicaciones locales, comercio, atención, campañas Meta, social proof, crisis y preguntas.

Para activos propios o administrados, preferir integraciones oficiales de Meta cuando estén disponibles y autorizadas. Para observación externa, usar solo métodos compatibles con acceso permitido o importaciones manuales.

## Instagram
Posts, Reels, comentarios, visuales, hooks, lenguaje corto y datos propios autorizados.

## TikTok
Video, hook, transcript, caption, comments, replies, trends, storytelling y creator style.

Las herramientas oficiales de investigación de TikTok tienen restricciones de elegibilidad. Referencia: https://developers.tiktok.com/docs/en/about-research-api

## WhatsApp
Soporte de lead, consulta, seguimiento y cierre solo con datos propios/autorizados. No scrapea conversaciones privadas ajenas.

## YouTube
Comentarios, long-form, entrevistas, tutoriales y reputación.

# 8. MEDIOS TRADICIONALES E IMPRESOS

CampaignOS debe soportar radio, televisión, prensa, impresos, OOH y activaciones.

Radio: emisora, cobertura, localidad, idioma, horario, formato, spot, mención, entrevista, microprograma, audio autorizado y transcripción.

TV: señal, cobertura, horario, formato, spot, branded content, clipping y transcript.

Prensa: medio, sección, territorio, publinota, aviso, entrevista y clipping.

Impresos: brochures, flyers, volantes, afiches, POP, inserts, catálogos y señalética; cada pieza debe tener audiencia, objetivo, CTA, legibilidad, idioma y versión territorial.

OOH/activación: vallas, pantallas, transporte, mercados, ferias, tiendas, puntos de venta y eventos.

# 9. ARQUITECTURA GENERAL

```text
CAMPAIGN INPUT
   ↓
CONTEXT & EVIDENCE
   ↓
BOLIVIA CULTURAL INTELLIGENCE
   ↓
STRATEGIC ORCHESTRATOR
   ↓
INTELLIGENCE ─ STRATEGY+CRO ─ CREATIVE
   ↓
ADVERSARIAL ─ EVIDENCE GATE ─ MEDIA PLANNER
   ↓
AUDIT ORCHESTRATOR / UNKNOWN UNKNOWNS
   ↓
HUMAN EXECUTIVE REVIEW
   ↓
PRODUCTION
   ↓
PERFORMANCE + LEARNING
```

# 10. JEV SOCIAL INTELLIGENCE

Jev funciona como motor de decisión estructurada. Socai/navegadores/APIs/imports ejecutan captura.

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
Jev decisions
↓
Bolivia context enrichment
↓
adversarial mapping
↓
human review
```

Campos sugeridos: stance, intent, objection, risk_score, needs_human, purchase_interest, misinformation_risk, language, register, region_evidence, urbanicity_evidence, confidence, source_id.

Facebook debe tener un adapter contract de owned-page-comments, owned-post-comments, owned-ad-comments cuando la integración lo permita, manual-import y compliant-public-source-import. No bypass de login.

TraditionalMediaCollector: audio-transcript, video-transcript, press-clipping, PDF, image-clipping, manual-observation y field-note.

# 11. ESQUEMA UNIFICADO DE EVIDENCIA

```json
{
  "source_id": "SRC-00001",
  "source_type": "social_comment",
  "channel": "facebook",
  "publisher_or_account": "...",
  "url": "...",
  "captured_at": "2026-09-23T12:00:00-04:00",
  "territory": {"country": "Bolivia", "department": null, "municipality": null},
  "content": "...",
  "language": "es",
  "evidence_quality": "direct_observation",
  "access_method": "authorized_api|browser_read|manual_import",
  "personal_data_minimized": true,
  "hash": "...",
  "notes": []
}
```

# 12. AGENTES BASE

Core A00-A27: Executive Orchestrator, Context Architect, Evidence Researcher, Fact Verifier, Market Intelligence, Audience Anthropologist, Strategic Planner, Behavioral Strategist, Philosopher/Meaning, Offer Architect, CRO, Creative Director, Copy, SEO/AEO, Art Director, AI Image, Video Producer, Editor/Post, Social Strategist, Adversarial Audience, Hater/Troll, Expert Skeptic, Journalist, Community Manager, Brand Safety, Experiment Designer, Performance Analyst, Final QA.

Bolivia B01-B16 según sección 4.

# 13. AUDITORÍA DE LO QUE NO ESTAMOS PENSANDO

A28 Chief Audit Orchestrator: puntos ciegos, ausencia de evidencia, público omitido, dependencia de canal, datos sesgados, atribución, producción, costos ocultos, legal, accesibilidad, territorio, contradicciones, reputación, implementación, métricas, tracking y escenarios extremos.

A29 Assumption Auditor, A30 Pre-Mortem Agent, A31 Missing Audience Agent, A32 Contradiction Auditor, A33 Measurement Auditor, A34 Accessibility & Inclusion Reviewer.

Assumption schema:
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

# 14. OLEADAS

WAVE 0 Intake → WAVE 1 Intelligence → WAVE 2 Strategy → WAVE 3 Creative → WAVE 4 Attack → WAVE 5 Audit → WAVE 6 Human Gate → WAVE 7 Production → WAVE 8 Performance → WAVE 9 Learning.

Máximo recomendado inicial: 3 agentes premium concurrentes; subir a 4 solo si se justifica.

# 15. CLAIM LEDGER

Estados: VERIFIED, PARTIALLY_VERIFIED, DISPUTED, OUTDATED, UNSUPPORTED, UNKNOWN.

UNSUPPORTED / DISPUTED / UNKNOWN bloquean claim externo salvo override humano explícito.

# 16. ADVERSARIAL AUDIENCE ENGINE

Simula cliente escéptico, hater, experto, cliente frustrado, competencia, periodista, observador de comunidad y variantes por segmento/canal, sin atribuir actitud a territorio sin evidencia.

Output debe contener objection_id, segment_id, attack, category, severity, plausibility, virality, evidence_ids, campaign_component, root_cause, recommended_action, recommended_change, response_if_published y confidence.

# 17. PRE-BUNKING

CREATIVE → ATTACK → OBJECTION MAP → PRE-BUNK → REVISION → SECOND RED TEAM → AUDIT → HUMAN APPROVAL.

# 18. MÉTRICAS PROPIAS

OCS = objeciones relevantes tratadas / objeciones relevantes detectadas.
Weighted OCS = Σ severity_resolved / Σ severity_total.
Claim Defensibility Score como indicador interno, no científico.
Cultural Evidence Coverage = segmentos con evidencia suficiente / segmentos prioritarios.

# 19. FUNNEL Y PERFORMANCE

Impressions → 3-second view → Watch % → CTR → Landing → Scroll → CTA → Form start → Form completion → Lead → Qualified lead → Sale.

Añadir negative-comment rate, question rate, objection rate, claim-challenge rate, sentiment, shares, saves, CPL, CAC, CVR, ROAS, response time, escalation rate y objection recurrence.

Nunca afirmar causalidad sin experimento/evidencia apropiada.

# 20. ARQUITECTURA DE COSTO

Tier 0 determinista; Tier 1 local/Ollama; Tier 2 premium para estrategia/red-team/auditoría/creatividad; Tier 3 humano para reputación, claims sensibles, publicación, crisis, presupuesto y decisión final.

# 21. REPOSITORIO RECOMENDADO

```text
baral-campaign-os/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .env.example
├── docs/
│   ├── BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── DECISIONS.md
│   ├── SECURITY.md
│   ├── DATA_GOVERNANCE.md
│   └── BOLIVIA_INTELLIGENCE.md
├── .agents/skills/
│   ├── campaign-intake/SKILL.md
│   ├── evidence-research/SKILL.md
│   ├── bolivia-audience-intelligence/SKILL.md
│   ├── social-listening-jev/SKILL.md
│   ├── facebook-intelligence/SKILL.md
│   ├── instagram-intelligence/SKILL.md
│   ├── tiktok-intelligence/SKILL.md
│   ├── traditional-media/SKILL.md
│   ├── claim-verification/SKILL.md
│   ├── adversarial-red-team/SKILL.md
│   ├── audit-blind-spots/SKILL.md
│   ├── creative-studio/SKILL.md
│   ├── media-plan-bolivia/SKILL.md
│   ├── performance-learning/SKILL.md
│   └── obsidian-sync/SKILL.md
├── apps/{dashboard,api}/
├── campaign_os/
│   ├── orchestrator/
│   ├── agents/{core,bolivia,audit}/
│   ├── flows/
│   ├── schemas/
│   ├── ingestion/{social,web,docs,traditional}/
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
├── connectors/{facebook,instagram,tiktok,youtube,traditional_media,manual_import}/
├── prompts/{base,strategy,bolivia,adversarial,audit,production}/
├── schemas/{campaign,evidence,audiences,cultural,social,analytics}/
├── data/{raw,normalized,cache,exports}/
├── knowledge/obsidian-vault/
│   ├── 00-HOME/
│   ├── 01-CLIENTS/
│   ├── 02-CAMPAIGNS/
│   ├── 03-BOLIVIA/
│   ├── 04-AUDIENCES/
│   ├── 05-CHANNELS/
│   ├── 06-EVIDENCE/
│   ├── 07-STRATEGY/
│   ├── 08-CREATIVE/
│   ├── 09-RED-TEAM/
│   ├── 10-PERFORMANCE/
│   ├── 11-LEARNINGS/
│   ├── 12-DECISIONS/
│   ├── 90-TEMPLATES/
│   └── 99-SYSTEM/
├── scripts/
└── tests/{unit,integration,evals,prompts,security}/
```

# 22. DATOS Y GIT

Nunca commitear bruto social, cookies, sesiones, secrets ni DB locales. Sí commitear schemas, plantillas, insights curados, fuentes públicas, decisiones, docs y learnings no sensibles.

# 23. CODEX: ESTRATEGIA DE INSTRUCCIONES

No meter toda esta especificación en AGENTS.md. La guía actual de Codex favorece AGENTS.md breve + Skills específicas + reglas por subdirectorio cuando sea necesario.

Referencia: https://developers.openai.com/api/docs/guides/latest-model

AGENTS.md raíz recomendado:

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

## Verification
For code changes: type-check; run relevant tests; run evals if prompts/agent behavior changed; report uncertainty.

## Cost
Do not introduce a paid dependency without explicit human approval.
```

Nested cultural AGENTS.md: territory is context, never personality; never invent regional slang; conclusions need evidence IDs or HYPOTHESIS; do not infer sensitive traits; require human validation for indigenous-language external copy.

Connectors AGENTS.md: no bypass login/CAPTCHA/access controls/rate limits; prefer authorized APIs; preserve source URL/timestamp; partial extraction labeled partial; never store browser cookies in cloud.

# 24. CODEX SKILLS

Cada skill debe contener trigger, inputs, workflow, allowed tools, schemas, acceptance criteria, tests y output location.

Skills: campaign-intake, evidence-research, bolivia-audience-intelligence, social-listening-jev, facebook-intelligence, instagram-intelligence, tiktok-intelligence, traditional-media, claim-verification, adversarial-red-team, audit-blind-spots, creative-studio, media-plan-bolivia, performance-learning, obsidian-sync.

# 25. OBSIDIAN COMO MEMORIA ESTRATÉGICA

Obsidian no es el data lake. Guarda conocimiento, decisiones, contexto, fuentes, insights, patrones y aprendizajes; no millones de comentarios, cookies, credenciales ni datos personales innecesarios.

Abrir como vault: `knowledge/obsidian-vault/`.

Referencias: https://obsidian.md/help/properties ; https://obsidian.md/help/links ; https://help.obsidian.md/Extending%2BObsidian/Obsidian%2BURI

# 26. ESTRUCTURA OBSIDIAN

00-HOME, 01-CLIENTS, 02-CAMPAIGNS, 03-BOLIVIA (Departments/Cities/Urbanicity/Language/Media Ecology/Living Language Corpus), 04-AUDIENCES, 05-CHANNELS, 06-EVIDENCE, 07-STRATEGY, 08-CREATIVE, 09-RED-TEAM, 10-PERFORMANCE, 11-LEARNINGS, 12-DECISIONS, 90-TEMPLATES, 99-SYSTEM.

# 27. TEMPLATES OBSIDIAN

Campaign note debe tener id, type, status, client, country, departments, urbanicity, channels, human_owner, created, updated y secciones Objective, Business problem, Audience, Territory, Evidence, Strategy, Claims, Risks, Red Team, Media, Creative, Experiments, Human decisions, Results, Learnings.

Audience note debe tener territorio, urbanicity, lengua, channels, confidence y secciones Evidence, Context, Needs, Frictions, Trust, Objections, Language/Register, Observed phrases, Media behavior, Purchase path, Unknowns, Do not assume.

Source note: id, source_type, url, publisher, published_at, captured_at, territory; supports, evidence excerpt, limitations, contradictions, related claims.

Decision note: id, date, campaign, human_decision, decision, why, evidence, alternatives, risks, reversal conditions, follow-up.

Learning note: id, campaign, audience, channel, confidence, reusable; observed, interpretation, evidence, scope, non-scope, next test.

# 28. OBSIDIAN SYNC CONTRACT

RAW DATA → DB/files. CURATED KNOWLEDGE → Obsidian. CODE → Git. DECISIONS → Obsidian + Git cuando no sensibles. SECRETS → environment/local secret store.

# 29. CODEX COMMAND PLAYBOOK

Nueva campaña: use campaign-intake; no estrategia todavía; crear CampaignContext, Evidence Gap list y note Obsidian.

Mapear Bolivia: segmentar por territory, urbanicity, language/register y channel; no inferir sin evidencia; producir unknowns y field-research gaps.

Escuchar social: priorizar Facebook/Instagram/TikTok; conectores permitidos; normalize/dedupe local; cluster antes de premium; raw fuera de Git; solo insights curados a Obsidian.

Red Team: atacar claims, wording, visual, price, credibility, cultural fit y channel fit sin fabricar reacciones.

Blind spots: assumption audit, pre-mortem, missing-audience, measurement y operational-risk; no reparar hasta terminar auditoría.

Media plan: digital + tradicional/physical touchpoints solo donde evidencia lo sustente.

Sync Obsidian: no copiar raw comments salvo evidencia seleccionada.

Cierre: OBSERVED/CORRELATED/EXPERIMENTALLY_SUPPORTED/HYPOTHESIS + learnings.

# 30. HUMAN SOLO-OPERATOR UX

Home debe mostrar qué necesita al humano ahora: critical risks, claims, creative decisions, experiments y new learnings. Cinco acciones: Review, Approve, Reject, Ask for evidence, Request another test.

# 31. DASHBOARD

Campaign, Context, Bolivia Intelligence, Social Listening, Evidence, Strategy, Media, Creative Lab, Red Team, Audit, Production, Experiments, Performance, Learnings, Human Queue.

# 32. WAR ROOMS

Social: total corpus, new, clusters, critical objections, purchase signals, questions, challenged claims, misinformation candidates, language signals, unknown location y human review. Filtros solo por territorio/urbanicity cuando exista evidencia.

Traditional Media: mentions, clipping, outlet, territory, transcript, topic, model sentiment, evidence, campaign link y human notes.

# 33. CREATIVE STUDIO

Máximo tres territorios. Cada concepto debe conectar insight → strategic idea → creative device → execution → CTA → behavioral mechanism, con versiones por Facebook/Instagram/TikTok/radio/print y evidence_ids/risks.

# 34. PRODUCTION

Local-first: ComfyUI, FFmpeg, MoviePy, whisper.cpp. Sin GPU debe producir visual brief, prompt, negative prompt, storyboard, shot list, edit decision list y asset manifest.

# 35. TESTS OBLIGATORIOS

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

# 36. SECURITY

Nunca cloud: browser cookies, session files, passwords, raw private messages, unnecessary personal data. Cloud permitido: aggregates, non-sensitive evidence, IDs, public URLs, campaign state, audit state, human decisions.

# 37. GITHUB + VERCEL

feature/* → PR → Preview → Tests → Human review → Merge → Production.

Current CampaignOS work: `campaignos-jev-mvp`.

Nunca auto-merge cambios que alteren evidence gates, publication permissions, connector permissions, secret handling o Human Gate.

# 38. OBSERVABILITY

Registrar agent, campaign_id, input/output artifacts, model, prompt version, timestamps, tokens/cost when available, tool calls, validation, retries, error. Langfuse opcional.

# 39. AUDIT GATES

Gate 1 Input: missing data/product truth/audience assumptions.
Gate 2 Strategy: evidence/logic/alternatives/Bolivia fit.
Gate 3 Creative: claims/cultural/accessibility/channel.
Gate 4 Pre-launch: tracking/landing/media/crisis/Human Gate.
Gate 5 Post-launch: performance/comments/new objections/unintended reactions.
Gate 6 Learning: reusable/non-transferable/next experiment.

# 40. UNKNOWN UNKNOWNS

Antes de aprobar: público omitido, territorio no representado, evidencia contradictoria, claim fuera de contexto, periodista/competencia, promesa vs experiencia, conexión lenta, sin audio, móvil, impreso, desconocimiento de marca, lenguaje artificial, jerga falsa, correlación vs causa, vanity metrics, privacidad, sesgo urbano, invisibilización periurbana/rural, medios tradicionales omitidos, una plataforma usada como espejo del país.

# 41. PROMPT BASE

```text
You are a specialist inside BARAL CampaignOS.
Complete only the assigned specialist task.
Use Campaign Context, Evidence Registry, Brand Rules, Audience Model, Bolivia Context and Tool Results.
Rules:
1. Separate FACT / INTERPRETATION / HYPOTHESIS / RECOMMENDATION.
2. Never invent statistics, quotations, sources, behavior or campaign results.
3. External factual claims require evidence IDs.
4. If evidence is insufficient, return UNKNOWN.
5. Do not silently fill gaps.
6. Do not infer sensitive personal traits.
7. Do not infer region from slang alone.
8. Do not generalize Bolivian audiences without segment evidence.
9. Challenge contradictions.
10. Use structured schemas.
11. Minimize redundant prose.
12. Predictions are hypotheses.
13. Flag factual, cultural, reputational, legal and operational risk.
14. Mark BLOCKED when required evidence is absent.
15. Publication always requires human approval.
```

# 42. PROMPT BOLIVIA CULTURAL INTELLIGENCE

```text
ROLE: Bolivia Cultural Intelligence Analyst
Analyze supplied evidence for a specific campaign.
Do not describe a generic Bolivian consumer.
Segment only when supported by evidence using territory, urbanicity, language/register, generation if known, channel and decision context.
For every conclusion provide statement, type, evidence_ids, confidence, scope and where_not_to_generalize.
Identify language patterns, trust signals, objections, channel behavior, media opportunities, cultural risks and missing evidence.
Never invent local slang.
Never infer ethnicity, religion or political ideology.
Never equate rural with offline.
```

# 43. PROMPT CHIEF AUDIT ORCHESTRATOR

```text
ROLE: Chief Audit Orchestrator
Find what the current campaign team may have failed to consider.
Do not improve the campaign yet.
Audit evidence quality, assumptions, missing audiences, Bolivia territorial coverage, language/register, social-channel bias, traditional-media omission, claims, measurement, tracking, operational feasibility, creative misinterpretation, accessibility, privacy, security, cost, production and reputational risk.
For each issue return severity, finding, evidence, why_it_matters, what_would_validate_it, owner, blocking and confidence.
Prioritize CRITICAL/HIGH/MEDIUM/LOW.
Explicitly list UNKNOWN_UNKNOWNS_TO_INVESTIGATE.
```

# 44. PROMPT CODEX REVIEWER

```text
Audit BARAL CampaignOS implementation.
Do not trust existing architecture because it exists.
Inspect only files relevant to this audit.
Find architectural weaknesses, unnecessary complexity, token inefficiency, missing validation, race conditions, security issues, weak tests, prompt leakage, unbounded loops, unnecessary LLM calls, deterministic replacements, evidence/Human Gate bypasses, Bolivia stereotype risks, social credential exposure, Obsidian pollution, connector compliance and measurement flaws.
Produce CRITICAL/HIGH/MEDIUM/LOW with file paths and line references when available.
Do not modify files until the audit is complete.
```

# 45. PROMPT MAESTRO PARA CODEX

```text
You are the principal engineering and audit agent for BARAL CampaignOS.
The source of truth is docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md.
Do not load the entire master file for trivial edits; read only necessary sections/docs.

Primary mission: build an evidence-grounded, Bolivia-aware, omnichannel marketing operating system safely operated by one human.
Priority channels: Facebook, Instagram, TikTok.
Also support radio, television, press, print, OOH, activations, web, YouTube and authorized WhatsApp.

Core: event-driven specialist activation, typed contracts, Evidence Ledger, Claim Ledger, Bolivia Cultural Intelligence, Jev Social Intelligence, Adversarial Audience Engine, Blind-Spot Audit, Creative Studio, Media Planning, Human Gate, Performance Learning, Obsidian strategic memory.

Rules:
- keep AGENTS.md concise;
- domain workflows in `.agents/skills/*/SKILL.md`;
- nested AGENTS.md only for domain rules;
- typed schemas for inter-agent artifacts;
- deterministic/local before paid inference;
- no secrets in Git;
- social cookies stay local;
- no auto-publication;
- no sensitive-trait inference;
- no geographic stereotype;
- no unsupported external claim;
- no prediction as fact.

Bolivia:
- audience = evidence-backed segment, never generic consumer;
- model urban/periurban/intermediate/rural separately when useful;
- language and slang require observed evidence;
- digital + traditional media;
- Facebook/Instagram/TikTok first-class;
- preserve scope: one corpus does not generalize nationally.

Obsidian:
knowledge/obsidian-vault is curated memory.
Do not dump raw social datasets.
Use YAML properties, stable IDs and wikilinks.

When solving a task:
1. identify domain;
2. load relevant skill;
3. inspect relevant files;
4. prefer minimum-change implementation;
5. implement;
6. type-check/test;
7. run evals;
8. audit if behavior changed;
9. update Obsidian only with curated knowledge;
10. produce commit-ready summary.

Do not merge or deploy automatically unless explicitly instructed by the human.
Human approval is final.
```

# 46. IMPLEMENTATION ROADMAP

Phase 0 Governance → Phase 1 Evidence → Phase 2 Bolivia Intelligence → Phase 3 Social Intelligence → Phase 4 Traditional Media → Phase 5 Strategy → Phase 6 Adversarial → Phase 7 Audit → Phase 8 Creative → Phase 9 Production → Phase 10 Performance → Phase 11 Dashboard.

# 47. MVP BOUNDARY

El MVP debe poder: crear campaña, cargar contexto, registrar evidencia, mapear segmentos Bolivia, importar comentarios Facebook/Instagram/TikTok, capturar IG/TikTok por conector permitido, clasificar con Jev/fallback, clusterizar, detectar objeciones, ejecutar Red Team y Blind Spot Audit, crear strategy brief, tres territorios creativos, guardar decisiones en Obsidian y exigir Human Gate.

No necesita inicialmente autopublicar, responder comentarios, comprar medios, modificar ads, entrenar modelos propios, replicar todas las APIs o generar miles de piezas.

# 48. DEFINITION OF DONE

code works + schema validates + tests pass + evals pass + no critical security issue + docs updated + Obsidian curated if needed + human can understand output.

# 49. OPERACIÓN DIARIA

Abrir 00-HOME/CampaignOS Home.md. Revisar Human Queue, campañas activas, critical risks, pending claims y experiment results.

Nueva campaña: Intake → Evidence gaps → Research → Bolivia mapping → Social listening → Strategy → Creative → Red Team → Blind Spot Audit → Human approval → Production → Launch → Listen → Learn.

No saltar Evidence → Audit → Human Gate.

# 50. FUENTES

INE Censo 2024: https://cpv2024.ine.gob.bo/
INE población: https://www.ine.gob.bo/index.php/estadisticas-sociales/poblacion-censo/
INE tabulados: https://cpv2024.ine.gob.bo/index.php/tabulados-sobre-la-tematica-pobreza/
DataReportal Bolivia 2026: https://datareportal.com/reports/digital-2026-bolivia
ATT: https://www.att.gob.bo/
Codex guidance: https://developers.openai.com/api/docs/guides/latest-model
Multi-agent: https://developers.openai.com/api/docs/guides/responses-multi-agent
Docs MCP: https://developers.openai.com/learn/docs-mcp
Agents: https://developers.openai.com/api/docs/guides/agents
Obsidian Properties: https://obsidian.md/help/properties
Obsidian Links: https://obsidian.md/help/links
Obsidian URI: https://help.obsidian.md/Extending%2BObsidian/Obsidian%2BURI
TikTok Research: https://developers.tiktok.com/docs/en/about-research-api
TikTok Comments: https://developers.tiktok.com/docs/en/research-api-specs-query-video-comments

# 51. PRIMERA INSTRUCCIÓN PARA CODEX

```text
Read docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md.
Treat it as architecture and governance source of truth.
Do not implement the entire system in one pass.
First:
1. audit the existing repository;
2. map current components to target architecture;
3. identify reusable code;
4. identify conflicts;
5. create gap analysis;
6. propose minimal folder migration;
7. create/update root AGENTS.md;
8. create `.agents/skills` skeleton;
9. create `knowledge/obsidian-vault` skeleton;
10. create docs/BOLIVIA_INTELLIGENCE.md;
11. create docs/SECURITY.md;
12. create schemas for CampaignContext, AudienceSegment, SourceRecord, ClaimRecord, Objection and HumanDecision;
13. add tests for evidence, cultural generalization, sensitive-trait inference and Human Gate.
Do not delete existing working features.
Do not merge.
Do not deploy.
Do not add paid dependencies.
Return CURRENT STATE / GAPS / RISKS / PROPOSED CHANGES / FILES CREATED / FILES MODIFIED / TEST RESULTS / NEXT SAFE STEP.
```

# 52. FINAL CONTROL RULE

CampaignOS debe poder responder antes de cualquier campaña:

> ¿Qué sabemos, qué creemos, qué no sabemos, quién podría reaccionar de una forma que no estamos considerando, qué evidencia tenemos, qué deberíamos validar y qué decisión debe seguir siendo humana?

Si no puede responderla, la campaña todavía no está lista.
