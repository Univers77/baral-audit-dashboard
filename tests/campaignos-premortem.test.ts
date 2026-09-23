import assert from "node:assert/strict";
import test from "node:test";
import { runCampaignPremortem } from "../lib/campaignos/premortem";
import { classifyCommentPreview } from "../lib/campaignos/comment-preview";

const complete = {
  idea: "Presentar la nueva atención de la institución.",
  audience: "Personas usuarias de La Paz; revisión limitada a este servicio.",
  script: "Conoce el nuevo servicio. Consulta condiciones en el portal oficial.",
  claims: "Atención en menos tiempo.",
  evidence: "Informe operativo, corte 2026-08, muestra de La Paz.",
  channels: "TikTok vertical, 30 segundos.",
};

test("preflight incompleto nunca declara la campaña lista", () => {
  const report = runCampaignPremortem({ ...complete, idea: "", audience: "" }, "2026-09-23T12:00:00Z");
  assert.equal(report.state, "INCOMPLETE");
  assert.ok(report.findings.some((finding) => finding.id === "audience-scope" && finding.status === "PENDING"));
});

test("claim absoluto sin evidencia bloquea el borrador", () => {
  const report = runCampaignPremortem({ ...complete, script: "Garantizamos resultados 100% mejores.", evidence: "" });
  assert.equal(report.state, "BLOCKED");
  assert.equal(report.findings.find((finding) => finding.id === "claim-substantiation")?.status, "BLOCK");
});

test("evidencia declarada sigue requiriendo revisión humana", () => {
  const report = runCampaignPremortem(complete);
  assert.equal(report.state, "HUMAN_REVIEW_REQUIRED");
  assert.ok(report.findings.some((finding) => finding.id === "claim-substantiation" && finding.status === "REVIEW"));
});

test("texto aislado no determina que hubo coordinación", () => {
  const report = runCampaignPremortem(complete);
  const coordination = report.findings.find((finding) => finding.id === "response-protocol");
  assert.equal(coordination?.status, "NOT_ASSESSED");
  assert.match(coordination?.scenario ?? "", /no prueba intención ni coordinación/i);
});

test("menciones institucionales y de privacidad requieren controles específicos", () => {
  const report = runCampaignPremortem({
    ...complete,
    script: "La Embajada usa IA y comparte datos personales.",
  });
  assert.ok(report.findings.some((finding) => finding.id === "institutional-endorsement"));
  assert.ok(report.findings.some((finding) => finding.id === "privacy-data"));
});

test("la crítica escéptica no se etiqueta como ataque y las acusaciones se verifican", () => {
  const skeptical = classifyCommentPreview({ id: "1", platform: "manual", text: "Puro humo, mejor muestren pruebas." });
  assert.equal(skeptical.intent, "complaint");
  assert.equal(skeptical.stance, "skeptical");

  const directAbuse = classifyCommentPreview({ id: "2", platform: "manual", text: "Eres un idiota." });
  assert.equal(directAbuse.intent, "attack");

  const accusation = classifyCommentPreview({ id: "3", platform: "manual", text: "Esto es una estafa." });
  assert.ok(accusation.misinformationRisk > 0);
  assert.notEqual(accusation.intent, "misinformation_claim");
});
