"use client";

import { useState } from "react";
import { runCampaignPremortem, type PremortemInput, type PremortemReport } from "@/lib/campaignos/premortem";

const empty: PremortemInput = { idea: "", audience: "", script: "", claims: "", evidence: "", channels: "" };
const statusLabel = { BLOCK: "BLOQUEA", PENDING: "FALTA INFORMACIÓN", REVIEW: "REVISIÓN HUMANA", NOT_ASSESSED: "NO EVALUADO" };
const statusStyle = {
  BLOCK: "border-red-400/30 bg-red-400/10 text-red-200",
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  REVIEW: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  NOT_ASSESSED: "border-white/15 bg-white/[.04] text-zinc-300",
};

export function CampaignPremortem() {
  const [input, setInput] = useState<PremortemInput>(empty);
  const [report, setReport] = useState<PremortemReport | null>(null);
  const [error, setError] = useState("");

  function update(field: keyof PremortemInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setReport(null);
    setError("");
  }

  function analyze() {
    if (!Object.values(input).some((value) => value.trim())) {
      setError("Agrega al menos una idea para iniciar la revisión.");
      return;
    }
    setError("");
    setReport(runCampaignPremortem(input));
  }

  function exportReport() {
    if (!report) return;
    const file = new Blob([JSON.stringify({ type: "campaign-premortem-hypotheses", input, report }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "campaign-premortem.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function clear() {
    setInput(empty);
    setReport(null);
    setError("");
  }

  const stateLabel = report?.state === "INCOMPLETE" ? "INCOMPLETO" : report?.state === "BLOCKED" ? "BLOQUEADO · RESOLVER CLAIMS" : "REVISIÓN HUMANA OBLIGATORIA";

  return (
    <section aria-labelledby="premortem-title" className="rounded-2xl border border-violet-400/25 bg-violet-400/[.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[.18em] text-violet-300">PRE-FLIGHT · ANTES DE PRODUCIR O PUBLICAR</p>
          <h2 id="premortem-title" className="text-xl font-bold">Prueba de estrés de campaña y spot</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">Busca claims débiles, objeciones razonables, lecturas adversas y puntos ciegos operativos. Se ejecuta en tu navegador; no envía el brief a Jev.</p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">Análisis estático local</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <TextArea label="Idea / promesa central" value={input.idea} onChange={(value) => update("idea", value)} placeholder="¿Qué propone la campaña y qué cambio promete?" rows={3} />
        <TextArea label="Audiencia y alcance" value={input.audience} onChange={(value) => update("audience", value)} placeholder="Audiencia, territorio, idioma/registro y límites conocidos. No incluyas rasgos sensibles." rows={3} />
        <TextArea label="Guion o storyboard del spot" value={input.script} onChange={(value) => update("script", value)} placeholder="Escenas, locución, supers, cierre y CTA. Puedes pegar un primer borrador." rows={4} />
        <TextArea label="Claims, cifras y comparaciones" value={input.claims} onChange={(value) => update("claims", value)} placeholder="Una afirmación por línea; incluye también claims visibles o hablados." rows={4} />
        <TextArea label="Evidencia que respalda cada claim" value={input.evidence} onChange={(value) => update("evidence", value)} placeholder="ID/título de fuente, fecha, alcance y limitación. El sistema no verifica estos documentos." rows={3} />
        <TextArea label="Canales y formatos" value={input.channels} onChange={(value) => update("channels", value)} placeholder="Ej. TikTok 9:16, radio 30 s, TV 16:9, OOH. Añade condiciones relevantes." rows={3} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={analyze} className="rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">Ejecutar preflight local</button>
        <button type="button" onClick={exportReport} disabled={!report} className="rounded-lg border border-white/15 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40">Exportar ficha</button>
        <button type="button" onClick={clear} className="rounded-lg border border-white/15 px-4 py-3 text-sm">Limpiar</button>
        {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      </div>

      {report && (
        <div aria-live="polite" className="mt-5 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold">{stateLabel}</h3>
            <span className="text-xs text-zinc-500">{new Date(report.createdAt).toLocaleString("es-BO")}</span>
          </div>
          <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/[.06] p-3 text-sm text-amber-100">{report.disclaimer}</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {report.findings.map((finding) => (
              <article key={finding.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold">{finding.title}</h4>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-bold tracking-wide ${statusStyle[finding.status]}`}>{statusLabel[finding.status]}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{finding.scenario}</p>
                <p className="mt-3 text-sm"><span className="font-semibold text-violet-200">Pregunta de prueba: </span>{finding.question}</p>
                <p className="mt-2 text-sm text-zinc-400"><span className="font-semibold text-zinc-300">Acción: </span>{finding.action}</p>
                <p className="mt-2 text-xs text-zinc-500"><span className="font-semibold">Evidencia/insumo: </span>{finding.evidenceNeeded}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TextArea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; rows: number }) {
  const id = `premortem-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label htmlFor={id} className="block min-w-0 text-xs font-semibold text-zinc-300">
      {label}
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} maxLength={5000} className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm font-normal leading-relaxed text-white outline-none placeholder:text-zinc-500 focus:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300" />
      <span className="mt-1 block text-right text-[10px] font-normal text-zinc-500">{value.length}/5000</span>
    </label>
  );
}
