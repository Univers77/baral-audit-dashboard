import { NextRequest, NextResponse } from "next/server";
import { classifyCommentPreview } from "@/lib/campaignos/comment-preview";

type Input={id?:string;platform?:string;text?:string;author?:string;url?:string;likes?:number};
type Answer={type?:string;choice?:string;score?:number;noul?:number;confidence?:number;probabilities?:Record<string,number>};
const API="https://api.typesafe.ai/v1/systemone";
const MODEL=process.env.TYPESAFE_JEV_MODEL||"jev-latest";
const key=process.env.TYPESAFE_API_KEY;
const choices={
 stance:["supportive","neutral","skeptical","hostile"],
 intent:["question","objection","complaint","attack","praise","joke","purchase_interest","misinformation_claim","other"],
 objection:["none","price","trust","credibility","quality","claim","support","technical","ethics","culture","privacy","political_sensitivity","misinterpretation"],
};
const criteria={
 stance:"Classify only the observable tone/position in the supplied text. Do not infer the person's private motive, account authenticity or coordination.",
 intent:"Classify the observable function/content of this comment, not the author's hidden intention. Strong criticism or negative sentiment alone is not an attack.",
 objection:"Identify the primary objection or concern expressed in the text; do not infer why the person expressed it.",
};
const intentCriteria:Record<string,string>={
 attack:"Use only when the text itself contains a directed personal insult, threat or hateful expression. Do not use for disagreement, complaint, skepticism, repetition alone or criticism of a public claim.",
 misinformation_claim:"Means a factual assertion that needs checking, not proof that it is false or intentionally misleading.",
};
const safe=(v:unknown,n=4000)=>String(v??"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,n);
const bounded=(n:unknown,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
const url=(v:unknown)=>{try{const u=new URL(String(v));return ["http:","https:"].includes(u.protocol)?u.toString():undefined}catch{return undefined}};
const redact=(text:string)=>text.replace(/\b[\w.+-]+@[\w.-]+\.[A-Z]{2,}\b/gi,"[email]").replace(/\+?\d[\d\s().-]{7,}\d/g,"[phone]").replace(/https?:\/\/\S+/gi,"[url]").replace(/@[\w.]{2,}/g,"[handle]");
async function readLimited(req:NextRequest,max:number){
 const reader=req.body?.getReader();if(!reader)return "";
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error("PAYLOAD_TOO_LARGE")}chunks.push(value)}
 const merged=new Uint8Array(size);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder().decode(merged);
}
function isLocalRequest(req:NextRequest){
 if(process.env.VERCEL==="1")return false;
 const host=new URL(req.url).hostname.toLowerCase();
 return host==="localhost"||host==="127.0.0.1"||host==="[::1]"||host==="::1";
}
function parse(a:Record<string,Answer>,c:Required<Pick<Input,"id"|"platform"|"text">>&Input){
 const conf=[a.stance?.confidence,a.intent?.confidence,a.objection?.confidence,a.risk?.confidence].map(x=>bounded(x)).filter(Boolean);
 return {...c,stance:a.stance?.choice||"neutral",intent:a.intent?.choice||"other",objection:a.objection?.choice||"none",riskScore:bounded(a.risk?.score,0,4),needsHuman:bounded(a.needs_human?.noul),purchaseInterest:bounded(a.purchase_interest?.noul),misinformationRisk:bounded(a.misinformation_risk?.noul),confidence:conf.length?conf.reduce((s,x)=>s+x,0)/conf.length:.5,answers:a};
}
async function jev(c:Required<Pick<Input,"id"|"platform"|"text">>&Input,campaign:unknown){
 const context=typeof campaign==="object"&&campaign!==null?campaign as Record<string,unknown>:{};
 const state=JSON.stringify({campaign:{name:safe(context.name,200),objective:safe(context.objective,800)},comment:{platform:c.platform,text:redact(c.text)},instruction:"Judge only the supplied evidence. Do not invent context, facts or author motives."});
 const questions:any[]=[
  {id:"stance",type:"choice",criteria:Object.fromEntries(choices.stance.map(x=>[x,criteria.stance+` Label: ${x}.`]))},
  {id:"intent",type:"choice",criteria:Object.fromEntries(choices.intent.map(x=>[x,criteria.intent+` Label: ${x}. ${intentCriteria[x]||""}`]))},
  {id:"objection",type:"choice",criteria:Object.fromEntries(choices.objection.map(x=>[x,criteria.objection+` Label: ${x}.`]))},
  {id:"risk",type:"score",criteria:["0 no meaningful risk","1 low","2 moderate","3 high","4 critical reputational/legal/trust risk"]},
  {id:"needs_human",type:"noul",criteria:"Should a human reviewer inspect this comment before any response or campaign decision?"},
  {id:"purchase_interest",type:"noul",criteria:"Does the comment contain a plausible signal of buying/demo/pricing interest?"},
  {id:"misinformation_risk",type:"noul",criteria:"How strongly does this comment contain a factual claim that should be checked before responding? This is a verification-triage score, not a finding that the claim is false or intentionally misleading."},
 ];
 const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({state,model:MODEL,questions}),signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw new Error(`Jev ${r.status}`);const data=await r.json();const a:Record<string,Answer>={};for(const x of data?.answers||[])if(x?.id)a[x.id]=x;return {result:parse(a,c),usage:data?.usage};
}
async function pool<T,R>(xs:T[],limit:number,fn:(x:T)=>Promise<R>){const out=new Array<R>(xs.length);let i=0;async function worker(){while(true){const j=i++;if(j>=xs.length)return;out[j]=await fn(xs[j]);}}await Promise.all(Array.from({length:Math.min(limit,xs.length)},worker));return out;}
export async function POST(req:NextRequest){
 if(!isLocalRequest(req))return NextResponse.json({ok:false,warning:"CampaignOS evaluator está limitado al entorno local."},{status:404});
 try{const raw=await readLimited(req,160000);const body=JSON.parse(raw||"{}");const comments:Input[]=Array.isArray(body?.comments)?body.comments.slice(0,24):[];const clean=comments.map((x,i)=>({id:safe(x?.id,160)||`c-${i}`,platform:safe(x?.platform,50).toLowerCase()||"manual",text:safe(x?.text,2800),author:safe(x?.author,160)||undefined,url:url(x?.url),likes:Number.isFinite(Number(x?.likes))?Number(x?.likes):undefined})).filter(x=>x.text) as (Required<Pick<Input,"id"|"platform"|"text">>&Input)[];
 if(!clean.length)return NextResponse.json({ok:false,warning:"No hay comentarios válidos"},{status:400});
 if(!key)return NextResponse.json({ok:true,provider:"preview-heuristic",model:"deterministic-v1",results:clean.map(classifyCommentPreview),warning:"Configura TYPESAFE_API_KEY para usar Jev real."});
 let fallback=false;let tokens=0;const rows=await pool(clean,4,async c=>{try{const x=await jev(c,body?.campaign);tokens+=Number(x.usage?.input_tokens||0);return x.result}catch{fallback=true;return classifyCommentPreview(c)}});return NextResponse.json({ok:true,provider:fallback?"jev+safe-fallback":"jev",model:MODEL,usage:{input_tokens:tokens},results:rows,warning:fallback?"Alguna evaluación Jev falló y fue marcada con fallback determinista.":undefined});
 }catch(e){if(e instanceof Error&&e.message==="PAYLOAD_TOO_LARGE")return NextResponse.json({ok:false,warning:"Payload demasiado grande"},{status:413});return NextResponse.json({ok:false,warning:e instanceof Error?e.message:"Solicitud inválida"},{status:400});}
}
