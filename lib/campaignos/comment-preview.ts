export type PreviewComment = {
  id: string;
  platform: string;
  text: string;
  author?: string;
  url?: string;
  likes?: number;
};

export function classifyCommentPreview(comment: PreviewComment) {
  const text = comment.text.toLowerCase();
  const hasAny = (terms: string[]) => terms.some((term) => text.includes(term));
  const hostileTone = hasAny(["humo", "estafa", "mentira", "basura", "ridículo", "ridiculo", "fraude"]);
  const skeptical = hostileTone || hasAny(["prueba", "datos", "según quién", "segun quien", "benchmark", "no creo", "demuestren"]);
  const supportive = hasAny(["me gusta", "excelente", "genial", "interesante"]);
  const purchase = hasAny(["precio", "cuánto cuesta", "cuanto cuesta", "demo", "comprar", "cotización", "cotizacion", "me interesa"]);
  const privacy = hasAny(["datos", "privacidad", "comparten"]);
  const claim = hasAny(["mejor", "garantiza", "siempre", "nunca", "resultados"]);
  const claimToVerify = claim || hasAny(["estafa", "fraude", "mentira", "robo", "mienten"]);
  const directAbuse = /\b(?:eres|es|son)\s+(?:un|una)?\s*(?:idiota|est[uú]pido|imb[eé]cil|in[uú]til)\b|\b(?:te voy a (?:golpear|hacer da[nñ]o|matar)|amenaza)\b/i.test(text);
  const isQuestion = text.includes("?");

  let objection = "none";
  if (privacy) objection = "privacy";
  else if (hasAny(["precio", "caro"])) objection = "price";
  else if (skeptical) objection = "credibility";
  else if (claim) objection = "claim";

  let intent = "other";
  if (purchase) intent = "purchase_interest";
  else if (directAbuse) intent = "attack";
  else if (isQuestion) intent = "question";
  else if (supportive) intent = "praise";
  else if (hostileTone) intent = "complaint";
  else if (objection !== "none") intent = "objection";

  const riskScore = Math.min(4, (hostileTone ? 2.3 : 0) + (skeptical ? 0.8 : 0) + (privacy ? 0.8 : 0) + (claim ? 0.5 : 0));
  const needsHuman = Math.min(0.95, 0.15 + riskScore * 0.19);
  return {
    ...comment,
    stance: directAbuse ? "hostile" : skeptical ? "skeptical" : supportive ? "supportive" : "neutral",
    intent,
    objection,
    riskScore,
    needsHuman,
    purchaseInterest: purchase ? 0.78 : 0.12,
    misinformationRisk: claimToVerify ? 0.65 : 0.12,
    confidence: 0.58,
  };
}
