"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { CampaignPremortem } from "@/components/campaignos/campaign-premortem";

type Comment = { id:string; platform:string; text:string; author?:string; url?:string; likes?:number };
type Result = Comment & { stance:string; intent:string; objection:string; riskScore:number; needsHuman:number; purchaseInterest:number; misinformationRisk:number; confidence:number };
type Response = { ok:boolean; provider:string; model?:string; results:Result[]; warning?:string };
type ReviewDecision = "approved-for-strategy" | "rejected" | "needs-evidence";

const demo: Comment[] = [
  {id:"d1",platform:"instagram",author:"@cliente_real",text:"¿Qué diferencia real tiene esto frente a lo que ya existe? Me interesa, pero quisiera ver pruebas.",likes:18,url:"https://instagram.com/"},
  {id:"d2",platform:"tiktok",author:"@skeptik",text:"Suena bonito, pero decir que es la mejor solución sin datos es puro humo.",likes:61,url:"https://tiktok.com/"},
  {id:"d3",platform:"linkedin",author:"Analista B2B",text:"¿Tienen casos medibles o benchmarks que respalden el claim de eficiencia?",likes:9,url:"https://linkedin.com/"},
  {id:"d4",platform:"youtube",author:"viewer_72",text:"¿Cuánto cuesta y qué incluye? Si tienen demo me gustaría verla.",likes:7,url:"https://youtube.com/"},
  {id:"d5",platform:"instagram",author:"@comentador",text:"Otra empresa prometiendo resultados mágicos con IA 😂 luego nadie responde cuando algo falla.",likes:43,url:"https://instagram.com/"},
  {id:"d6",platform:"tiktok",author:"@curiosa",text:"Me gusta la idea, pero me preocupa qué hacen con mis datos y si los comparten.",likes:22,url:"https://tiktok.com/"},
];
const pnames:Record<string,string>={instagram:"Instagram",tiktok:"TikTok",linkedin:"LinkedIn",youtube:"YouTube",x:"X",facebook:"Facebook",reddit:"Reddit",manual:"Manual"};
const stance:Record<string,string>={supportive:"Favorable",neutral:"Neutral",skeptical:"Tono escéptico",hostile:"Tono hostil"};
const intentLabels:Record<string,string>={question:"Pregunta",objection:"Objeción",complaint:"Queja",attack:"Agresión textual observable",praise:"Positivo",joke:"Broma",purchase_interest:"Interés comercial",misinformation_claim:"Afirmación por verificar",other:"Otro"};
const pct=(n:number)=>`${Math.round(Math.max(0,Math.min(1,n))*100)}%`;
const risk=(n:number)=>n>=3.25?"Crítico":n>=2.25?"Alto":n>=1.25?"Medio":"Bajo";

function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==="object"&&value!==null&&!Array.isArray(value)}
function firstString(...values:unknown[]){return values.find(value=>typeof value==="string"&&value.trim()) as string|undefined}
function normalize(input:unknown):Comment[]{
  const record=isRecord(input)?input:{};
  const rows=Array.isArray(input)?input:[record.comments,record.records,record.results].find(Array.isArray)??[];
  return rows.map((value,index)=>{
    const x=isRecord(value)?value:{};
    const likes=Number(x.likes);
    return {id:String(x.id??`import-${index}`),platform:(firstString(x.platform,x.source)??"manual").toLowerCase(),text:(firstString(x.text,x.comment,x.content,x.message)??"").trim(),author:firstString(x.author,x.username),url:firstString(x.url,x.sourceUrl),likes:Number.isFinite(likes)?likes:undefined};
  }).filter(x=>x.text);
}

export default function CampaignOS(){
  const [campaign,setCampaign]=useState("Campaña Demo BARAL");
  const [objective,setObjective]=useState("Detectar objeciones, riesgos y señales de conversión antes de publicar.");
  const [comments,setComments]=useState<Comment[]>(demo);
  const [isSynthetic,setIsSynthetic]=useState(true);
  const [results,setResults]=useState<Result[]>([]);
  const [selected,setSelected]=useState<string>("");
  const [filter,setFilter]=useState("all");
  const [provider,setProvider]=useState("sin analizar");
  const [health,setHealth]=useState("Comprobando Jev…");
  const [decisions,setDecisions]=useState<Record<string,ReviewDecision>>({});
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/campaignos/health",{cache:"no-store"}).then(r=>r.json()).then(x=>setHealth(x.mode==="jev"?`Jev listo · ${x.model}`:x.mode==="local-only"?"Procesamiento remoto bloqueado":"Preview local · agrega TYPESAFE_API_KEY para Jev real")).catch(()=>setHealth("Preview local disponible"));},[]);

  const metrics=useMemo(()=>({
    total:results.length,
    avg:results.length?results.reduce((s,x)=>s+x.riskScore,0)/results.length:0,
    tension:results.filter(x=>["skeptical","hostile"].includes(x.stance)).length,
    human:results.filter(x=>x.needsHuman>=.55).length,
    intent:results.filter(x=>x.purchaseInterest>=.55).length,
  }),[results]);
  const visible=results.filter(x=>filter==="all"||filter==="review"&&!decisions[x.id]||filter==="risk"&&x.riskScore>=2.25||x.platform===filter);
  const item=results.find(x=>x.id===selected)||visible[0]||results[0];

  async function analyze(){
    setLoading(true);setError("");
    try{const r=await fetch("/api/campaignos/evaluate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaign:{name:campaign,objective},comments:comments.slice(0,24)})});const d:Response=await r.json();if(!r.ok||!d.ok)throw new Error(d.warning||"No se pudo analizar");setResults(d.results);setProvider(`${d.provider}${d.model?` · ${d.model}`:""}`);setSelected(d.results[0]?.id||"");setDecisions({});}catch(e){setError(e instanceof Error?e.message:"Error desconocido");}finally{setLoading(false);}
  }
  async function importFile(e:ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];if(!f)return;try{const rows=normalize(JSON.parse(await f.text()));if(!rows.length)throw new Error("El JSON no contiene comentarios reconocibles.");setComments(rows.slice(0,500));setIsSynthetic(false);setResults([]);setProvider("sin analizar");setError("");}catch(err){setError(err instanceof Error?err.message:"No pude importar");}e.target.value="";}
  function exportJson(){const b=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),dataType:isSynthetic?"synthetic-demo":"operator-import",campaign:{name:campaign,objective},provider,comments,analysis:results,humanDecisions:decisions},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="campaignos-evidence.json";a.click();URL.revokeObjectURL(u);}
  function decide(id:string,decision:ReviewDecision){setDecisions(s=>({...s,[id]:decision}));}

  return <main className="min-h-screen bg-[#08070d] text-zinc-100 p-4 md:p-8">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-semibold tracking-[.22em] text-violet-400">BARAL CAMPAIGNS OS · SOCIAL INTELLIGENCE</p><h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tight">Jev Social War Room</h1><p className="mt-2 text-zinc-400">Evidencia social → decisiones tipadas → revisión humana → estrategia.</p></div>
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm"><b>{health}</b><div className="text-zinc-400">engine: {provider}</div></div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto]">
        <Field label="Campaña" value={campaign} set={setCampaign}/><Field label="Objetivo" value={objective} set={setObjective}/><div className="flex flex-wrap items-end gap-2"><label className="cursor-pointer rounded-lg border border-white/15 px-4 py-3 text-sm hover:bg-white/5">Importar JSON<input className="hidden" type="file" accept="application/json" onChange={importFile}/></label><button onClick={analyze} disabled={loading||!comments.length} className="rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading?"Analizando…":`Analizar ${Math.min(24,comments.length)}${comments.length>24?` de ${comments.length}`:""}`}</button><button onClick={exportJson} disabled={!results.length} className="rounded-lg border border-white/15 px-4 py-3 text-sm disabled:opacity-40">Exportar</button></div>
      </section>
      {error&&<div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</div>}

      <CampaignPremortem />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"><Metric t="Comentarios" v={metrics.total||"–"} s="capturados"/><Metric t="Riesgo medio" v={results.length?`${metrics.avg.toFixed(2)}/4`:"–"} s="reputacional"/><Metric t="Tensión" v={results.length?metrics.tension:"–"} s="escéptico + hostil"/><Metric t="Gate humano" v={results.length?metrics.human:"–"} s={`${Object.keys(decisions).length} decisiones humanas`}/><Metric t="Interés" v={results.length?metrics.intent:"–"} s="señal comercial"/></section>

      <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><Eyebrow>COBERTURA</Eyebrow><h2 className="text-xl font-bold">Omnicanal por adaptadores</h2></div><span className="text-xs text-zinc-500">credenciales sociales: solo local</span></div><div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4 2xl:grid-cols-8"><Source n="Instagram" s="ACTIVO" d="socai"/><Source n="TikTok" s="ACTIVO" d="socai"/><Source n="LinkedIn" s="ACTIVO" d="socai"/><Source n="YouTube" s="LISTO" d="API/import"/><Source n="X" s="ADAPTADOR" d="validar skill"/><Source n="Facebook" s="ADAPTADOR" d="Graph/skill"/><Source n="Reddit" s="ADAPTADOR" d="API/import"/><Source n="JSON/CSV" s="ACTIVO" d="propio"/></div></section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><Eyebrow>EVIDENCIA</Eyebrow><h2 className="text-xl font-bold">Comentarios y señales</h2></div><select aria-label="Filtrar comentarios" className="max-w-full rounded-lg border border-white/10 bg-black/30 p-2" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="review">Decisión pendiente</option><option value="risk">Riesgo alto</option>{["instagram","tiktok","linkedin","youtube"].map(x=><option key={x} value={x}>{pnames[x]}</option>)}</select></div>
          {isSynthetic&&<div role="status" className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><b>MUESTRA SINTÉTICA — NO ES EVIDENCIA REAL.</b> Ejemplos ficticios para probar la interfaz. Importa un JSON recolectado para trabajar con datos reales.</div>}
          {!results.length?<div className="py-16 text-center text-zinc-400"><div className="text-5xl">◎</div><h3 className="mt-3 text-lg font-bold text-white">Mesa de análisis lista</h3><p className="mx-auto mt-2 max-w-xl">Ejecuta la demo o importa el JSON generado por el recolector local. Sin clave usa heurística etiquetada; con TYPESAFE_API_KEY usa Jev real.</p><button onClick={analyze} className="mt-5 rounded-lg bg-violet-500 px-4 py-3 font-bold text-white">Ejecutar demo</button></div>:<div className="space-y-2">{visible.map(x=><button key={x.id} onClick={()=>setSelected(x.id)} className={`w-full rounded-xl border p-4 text-left ${item?.id===x.id?"border-violet-400 bg-violet-500/10":"border-white/10 bg-black/20 hover:bg-white/5"}`}><div className="flex justify-between text-xs"><b className="text-violet-300">{pnames[x.platform]||x.platform}</b><span>{risk(x.riskScore)} · {x.riskScore.toFixed(1)}/4</span></div><p className="my-3 leading-relaxed">{x.text}</p><div className="flex flex-wrap gap-2 text-xs text-zinc-400"><Chip>{stance[x.stance]||x.stance}</Chip><Chip>{intentLabels[x.intent]||x.intent}</Chip>{x.objection!=="none"&&<Chip>{x.objection}</Chip>}{x.needsHuman>=.55&&<Chip>Humano {pct(x.needsHuman)}</Chip>}</div></button>)}</div>}
        </div>

        <aside className="min-w-0 rounded-2xl border border-white/10 bg-white/[.03] p-5"><Eyebrow>JEV DECISION INSPECTOR</Eyebrow><h2 className="text-xl font-bold">Por qué llega a ti</h2><p className="mt-1 text-sm text-zinc-500">Señales del texto; no infiere intención, veracidad ni coordinación.</p>{item?<div className="mt-5 space-y-4"><blockquote className="break-words rounded-xl border-l-2 border-violet-400 bg-black/25 p-4 text-zinc-300">“{item.text}”</blockquote><Decision l="Postura" v={stance[item.stance]||item.stance} p={item.confidence}/><Decision l="Función observable" v={intentLabels[item.intent]||item.intent} p={item.confidence}/><Decision l="Objeción" v={item.objection} p={item.confidence}/><Decision l="Riesgo" v={`${item.riskScore.toFixed(2)} / 4`} p={item.confidence}/><Decision l="Escalar a humano" v={pct(item.needsHuman)} p={item.needsHuman}/><Decision l="Interés comercial" v={pct(item.purchaseInterest)} p={item.purchaseInterest}/><Decision l="Claim por verificar" v={pct(item.misinformationRisk)} p={item.misinformationRisk}/><div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4"><Eyebrow>HUMAN GATE</Eyebrow><b>{decisions[item.id]?`Decisión: ${decisions[item.id]}`:"Pendiente de tu decisión"}</b><p className="mt-1 text-sm text-zinc-400">La decisión se exporta con este análisis; no publica, responde ni altera campañas.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>decide(item.id,"approved-for-strategy")} className="rounded-lg border border-emerald-400/30 px-3 py-2 text-sm">Aprobar para estrategia</button><button onClick={()=>decide(item.id,"rejected")} className="rounded-lg border border-red-400/30 px-3 py-2 text-sm">Rechazar</button><button onClick={()=>decide(item.id,"needs-evidence")} className="rounded-lg border border-amber-400/30 px-3 py-2 text-sm">Pedir evidencia</button></div></div>{item.url&&<a className="text-sm text-violet-300 underline" target="_blank" rel="noreferrer" href={item.url}>Abrir evidencia fuente ↗</a>}</div>:<p className="mt-5 text-zinc-500">Selecciona un comentario.</p>}</aside>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><Eyebrow>PIPELINE</Eyebrow><h2 className="text-xl font-bold">Local-first + revisión humana</h2><div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">{[["01","Chrome local","sesiones quedan contigo"],["02","socai","captura evidencia"],["03","Normalizer","unifica fuentes"],["04","Jev","clasifica y decide"],["05","CampaignOS","prioriza señales"],["06","Tú","apruebas y decides"]].map(([a,b,c])=><div key={a} className="rounded-xl border border-white/10 bg-black/20 p-4"><span className="text-xs text-violet-400">{a}</span><b className="mt-2 block">{b}</b><small className="text-zinc-500">{c}</small></div>)}</div></section>
    </div>
  </main>;
}
function Field({label,value,set}:{label:string;value:string;set:(v:string)=>void}){return <label className="text-xs font-semibold text-zinc-400">{label}<input className="mt-1 w-full rounded-lg border border-white/10 bg-white/[.04] px-3 py-3 text-base text-white outline-none focus:border-violet-400" value={value} onChange={e=>set(e.target.value)}/></label>}
function Metric({t,v,s}:{t:string;v:string|number;s:string}){return <div className="rounded-xl border border-white/10 bg-white/[.03] p-4"><span className="text-xs text-zinc-500">{t}</span><strong className="block text-2xl">{v}</strong><small className="text-zinc-500">{s}</small></div>}
function Eyebrow({children}:{children:ReactNode}){return <div className="mb-1 text-[10px] font-bold tracking-[.18em] text-violet-400">{children}</div>}
function Source({n,s,d}:{n:string;s:string;d:string}){return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><b>{n}</b><span className="mt-2 block text-[10px] font-bold text-violet-300">{s}</span><small className="text-zinc-500">{d}</small></div>}
function Chip({children}:{children:ReactNode}){return <span className="rounded-full border border-white/10 px-2 py-1">{children}</span>}
function Decision({l,v,p}:{l:string;v:string;p:number}){const x=Math.max(0,Math.min(1,p||0));return <div><div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm"><span className="text-zinc-400">{l}</span><b className="break-words text-right">{v}</b></div><div className="mt-2 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-violet-400" style={{width:`${Math.round(x*100)}%`}}/></div></div>}
