export type PremortemInput = {
  idea: string;
  audience: string;
  script: string;
  claims: string;
  evidence: string;
  channels: string;
};

export type PremortemState = "INCOMPLETE" | "BLOCKED" | "HUMAN_REVIEW_REQUIRED";
export type FindingStatus = "BLOCK" | "PENDING" | "REVIEW" | "NOT_ASSESSED";

export type PremortemFinding = {
  id: string;
  title: string;
  status: FindingStatus;
  basis: "TRIGGERED_TEXT" | "MISSING_INPUT" | "MANDATORY_HUMAN_CHECK";
  scenario: string;
  question: string;
  action: string;
  evidenceNeeded: string;
};

export type PremortemReport = {
  state: PremortemState;
  createdAt: string;
  disclaimer: string;
  findings: PremortemFinding[];
};

const has = (value: string, pattern: RegExp) => pattern.test(value);

export function runCampaignPremortem(input: PremortemInput, createdAt = new Date().toISOString()): PremortemReport {
  const creative = `${input.idea}\n${input.script}`.trim();
  const claimCandidates = `${input.claims}\n${creative}`.trim();
  const findings: PremortemFinding[] = [];
  const add = (finding: PremortemFinding) => findings.push(finding);

  if (!input.idea.trim()) {
    add({
      id: "idea",
      title: "Idea de campaña",
      status: "PENDING",
      basis: "MISSING_INPUT",
      scenario: "No se puede someter a estrés una idea que aún no está descrita.",
      question: "¿Qué cambio concreto propone la campaña y para quién?",
      action: "Describe la propuesta en una o dos frases antes de revisar piezas.",
      evidenceNeeded: "Brief aprobado y objetivo de comunicación.",
    });
  }

  if (!input.audience.trim()) {
    add({
      id: "audience-scope",
      title: "Audiencia y alcance",
      status: "PENDING",
      basis: "MISSING_INPUT",
      scenario: "Sin audiencia y territorio no se puede comprobar pertinencia ni generalizar resultados.",
      question: "¿A quién se dirige, en qué territorio y a quién no representa esta muestra?",
      action: "Define audiencia, territorio, idioma/registro y límites de la evidencia; no infieras rasgos sensibles.",
      evidenceNeeded: "Brief de audiencia y fuentes con alcance explícito.",
    });
  }

  const claimPattern = /\b(garantizamos?|garantiza|100\s*%|nunca|siempre|el mejor|la mejor|#\s*1|n[.º°]?\s*1|único|única|líder|líderes|comprobado|sin riesgo|resultados? garantizados?)\b|\d+(?:[.,]\d+)?\s*%/i;
  const claimsDeclared = Boolean(input.claims.trim());
  const strongClaim = has(claimCandidates, claimPattern);
  if (strongClaim || claimsDeclared) {
    const supported = Boolean(input.evidence.trim());
    add({
      id: "claim-substantiation",
      title: "Promesas y afirmaciones verificables",
      status: supported ? "REVIEW" : "BLOCK",
      basis: "TRIGGERED_TEXT",
      scenario: strongClaim
        ? "Una persona escéptica puede pedir pruebas de un absoluto, una cifra o una comparación incluida en la pieza."
        : "Una afirmación comercial explícita puede leerse como un hecho comprobable.",
      question: "¿Qué fuente primaria respalda cada frase y sigue siendo válida para este producto, territorio y fecha?",
      action: "Desglosa cada claim por separado; elimina, limita o matiza cualquier promesa que no tenga sustento revisable.",
      evidenceNeeded: supported
        ? "Fuente primaria, fecha, alcance, limitaciones y autorización de uso. Verificación humana pendiente."
        : "Fuente primaria por claim. No presentar la pieza como lista para publicar sin esa evidencia.",
    });
  } else {
    add({
      id: "claim-inventory",
      title: "Inventario de claims",
      status: "PENDING",
      basis: "MISSING_INPUT",
      scenario: "La locución, los supers, el texto en pantalla y el cierre pueden contener promesas que no estén en el brief.",
      question: "¿Se extrajeron todos los hechos, cifras, beneficios y comparaciones del guion/storyboard?",
      action: "Registra cada claim antes de aprobar la pieza, incluidos los que aparecen solo en imagen o locución.",
      evidenceNeeded: "Matriz claim → fuente → alcance → estado → responsable.",
    });
  }

  if (has(creative, /\b(datos?|privacidad|inteligencia artificial|\bIA\b|rostros?|geolocalizaci[oó]n|biom[eé]tric[oa]s?)\b/i)) {
    add({
      id: "privacy-data",
      title: "Datos, privacidad y uso de IA",
      status: "REVIEW",
      basis: "TRIGGERED_TEXT",
      scenario: "La audiencia puede preguntar qué datos se usan, para qué, por cuánto tiempo y si hay revisión humana.",
      question: "¿La explicación refleja el tratamiento real y evita insinuar una protección o capacidad que no existe?",
      action: "Contrasta la pieza con el flujo real de datos, avisos y controles; deriva dudas legales a revisión competente.",
      evidenceNeeded: "Mapa de datos, aviso aplicable, retención y responsabilidades aprobadas.",
    });
  }

  if (has(creative, /\b(gratis|gratuito|sin costo|descuento|precio|financiamiento|cr[eé]dito|cupos|[uú]ltimos|solo por|elegibilidad|incluye)\b/i)) {
    add({
      id: "offer-conditions",
      title: "Precio, oferta y condiciones",
      status: "REVIEW",
      basis: "TRIGGERED_TEXT",
      scenario: "Un comentario crítico puede señalar costos, requisitos o restricciones que la pieza no muestra con suficiente claridad.",
      question: "¿La oferta conserva el mismo precio, cobertura, elegibilidad y vigencia en todos los canales?",
      action: "Expón condiciones materiales junto al beneficio; coordina una respuesta con el equipo que presta el servicio.",
      evidenceNeeded: "Ficha de oferta aprobada, condiciones, vigencia y contacto operativo.",
    });
  }

  if (has(creative, /\b(embajada|gobierno|ministerio|alcald[ií]a|oficial|certificad[oa]s?|avalad[oa]s?|aliad[oa]s?)\b/i)) {
    add({
      id: "institutional-endorsement",
      title: "Atribución o respaldo institucional",
      status: "REVIEW",
      basis: "TRIGGERED_TEXT",
      scenario: "La mención, logo o puesta en escena podría entenderse como aval oficial aunque ese no sea el sentido previsto.",
      question: "¿Existe permiso vigente para cada nombre, logo, uniforme, edificio y declaración atribuida?",
      action: "Valida autorización y contexto con la institución; evita sugerir respaldo por asociación visual.",
      evidenceNeeded: "Permisos, texto autorizado y registro de versiones de assets.",
    });
  }

  if (has(creative, /\b(vs\.?|frente a|mejor que|superior a|n[uú]mero uno|competidor(?:es)?)\b/i)) {
    add({
      id: "comparison",
      title: "Comparaciones y referencias a terceros",
      status: input.evidence.trim() ? "REVIEW" : "BLOCK",
      basis: "TRIGGERED_TEXT",
      scenario: "Una comparación puede ser cuestionada por seleccionar métricas, periodo o competidores de forma incompleta.",
      question: "¿La comparación es reproducible, equivalente y vigente, y puede identificarse su metodología?",
      action: "Retira el comparativo o publica criterio, fecha, muestra y fuente de forma comprobable.",
      evidenceNeeded: "Estudio comparable y metodología revisada; autorización legal si corresponde.",
    });
  }

  if (has(creative, /\b(bolivia|bolivian[oa]s?|la paz|santa cruz|cochabamba|el alto|potos[ií]|oruro|sucre|tarija|beni|pando|quechua|aimara|guaran[ií])\b/i)) {
    add({
      id: "local-context",
      title: "Contexto y lenguaje local",
      status: "REVIEW",
      basis: "TRIGGERED_TEXT",
      scenario: "Una referencia local puede sentirse precisa para una zona y ajena o incorrecta en otra.",
      question: "¿La fuente y la revisión local cubren los territorios, registros e idiomas que la pieza nombra?",
      action: "Haz revisión contextual con participantes pertinentes y limita la conclusión a esos territorios.",
      evidenceNeeded: "Fuentes territoriales y acta de revisión lingüística/contextual.",
    });
  }

  add({
    id: "fair-critique",
    title: "Crítica legítima más fuerte",
    status: "REVIEW",
    basis: "MANDATORY_HUMAN_CHECK",
    scenario: "Una persona bien informada puede discrepar con la prioridad, la evidencia o la ejecución sin actuar de mala fe.",
    question: "¿Cuál es la objeción razonable más difícil de responder con los hechos disponibles?",
    action: "Redacta la crítica con neutralidad; verifica primero si revela un problema real que deba corregirse.",
    evidenceNeeded: "Fuentes y límites que sostengan la respuesta, o una decisión documentada de corregir la pieza.",
  });

  add({
    id: "adverse-reading",
    title: "Lectura adversa y recorte fuera de contexto",
    status: input.script.trim() ? "REVIEW" : "NOT_ASSESSED",
    basis: input.script.trim() ? "MANDATORY_HUMAN_CHECK" : "MISSING_INPUT",
    scenario: input.script.trim()
      ? "Un recorte breve, una captura o una frase aislada podría invertir la intención de la escena."
      : "Sin guion ni storyboard no se pueden probar montaje, texto en pantalla, audio y cierre.",
    question: "¿Qué lectura negativa pero plausible aparece al ver solo el primer plano, el subtítulo o los últimos cinco segundos?",
    action: "Revisa escena por escena y prueba recortes sin audio y fuera de orden; modifica lo que dependa de contexto invisible.",
    evidenceNeeded: "Guion técnico/storyboard, supers, versiones verticales y prueba de recorte contextual.",
  });

  add({
    id: "representation",
    title: "Representación, dignidad y estereotipos",
    status: "REVIEW",
    basis: "MANDATORY_HUMAN_CHECK",
    scenario: "Una representación puede ser cuestionada por reducir a personas o comunidades a un problema, chiste o recurso visual.",
    question: "¿Las personas representadas tienen agencia, contexto y voz, y aceptarían esa representación fuera del spot?",
    action: "Revisa casting, vestuario, acento, locación, rol y montaje con más de una persona conocedora del contexto.",
    evidenceNeeded: "Notas de revisión contextual, permisos de imagen y justificación de casting/locaciones.",
  });

  add({
    id: "accessibility",
    title: "Accesibilidad y comprensión sin sonido",
    status: input.script.trim() ? "REVIEW" : "NOT_ASSESSED",
    basis: input.script.trim() ? "MANDATORY_HUMAN_CHECK" : "MISSING_INPUT",
    scenario: "La pieza puede perder su beneficio, condición o llamado a la acción en reproducción muda, pantalla pequeña o lectura rápida.",
    question: "¿Se entiende la propuesta con subtítulos legibles, contraste suficiente y sin depender solo de audio o color?",
    action: "Prueba captions, contraste, ritmo, texto legal y safe areas en cada formato final.",
    evidenceNeeded: "Exports por canal revisados en móvil y subtítulos corregidos por una persona.",
  });

  add({
    id: "response-protocol",
    title: "Crítica, abuso y posible coordinación",
    status: "NOT_ASSESSED",
    basis: "MANDATORY_HUMAN_CHECK",
    scenario: "Crítica, insulto y actividad coordinada requieren respuestas distintas; el texto aislado no prueba intención ni coordinación.",
    question: "¿Qué señales observables activarían verificación, pausa, moderación o escalamiento, y quién decide?",
    action: "Define responsables, evidencia mínima, ventanas de seguimiento y respuesta aprobada. No llames ‘ataque’ a una crítica por ser negativa.",
    evidenceNeeded: "Protocolo de moderación y, solo si hay actividad real, muestras con enlaces, fechas y contexto de publicación.",
  });

  const incomplete = !input.idea.trim() || !input.audience.trim();
  const blocked = findings.some((finding) => finding.status === "BLOCK");
  return {
    state: incomplete ? "INCOMPLETE" : blocked ? "BLOCKED" : "HUMAN_REVIEW_REQUIRED",
    createdAt,
    disclaimer: "Revisión estática local. Los hallazgos son hipótesis/checklists, no predicciones de reacción, evidencia de malicia ni garantía de seguridad. La ausencia de alertas no significa ausencia de riesgo.",
    findings,
  };
}
