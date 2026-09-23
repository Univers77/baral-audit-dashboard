import { NextRequest, NextResponse } from "next/server";

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
const criteria={stance:"Classify the author's stance toward the campaign/brand.",intent:"Identify the primary intent of this comment.",objection:"Identify the primary objection or concern."};
const safe=(v:unknown,n=4000)=>String(v??"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,n);
const bounded=(n:unknown,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
const url=(v:unknown)=>{try{const u=new URL(String(v));return ["http:","https:"].includes(u.protocol)?u.toString():undefined}catch{return undefined}};
function parse(a:Record<string,Answer>,c:Required<Pick<Input,"id"|"platform"|"text">>&Input){
 const conf=[a.stance?.confidence,a.intent?.confidence,a.objection?.confidence,a.risk?.confidence].map(x=>bounded(x)).filter(Boolean);
 return {...c,stance:a.stance?.choice||"neutral",intent:a.intent?.choice||"other",objection:a.objection?.choice||"none",riskScore:bounded(a.risk?.score,0,4),needsHuman:bounded(a.needs_human?.noul),purchaseInterest:bounded(a.purchase_interest?.noul),misinformationRisk:bounded(a.misinformation_risk?.noul),confidence:conf.length?conf.reduce((s,x)=>s+x,0)/conf.length:.5,answers:a};
}
async function jev(c:Required<Pick<Input,"id"|"platform"|"text">>&Input,campaign:any){
 const state=JSON.stringify({campaign:{name:safe(campaign?.name,200),objective:safe(campaign?.objective,800)},comment:{platform:c.platform,text:c.text,author:c.author,likes:c.likes,url:c.url},instruction:"Judge only the supplied evidence. Do not invent context, facts or author motives."});
 const questions:any[]=[
  {id:"stance",type:"choice",criteria:Object.fromEntries(choices.stance.map(x=>[x,criteria.stance+` Label: ${x}.`]))},
  {id:"intent",type:"choice",criteria:Object.fromEntries(choices.intent.map(x=>[x,criteria.intent+` Label: ${x}.`]))},
  {id:"objection",type:"choice",criteria:Object.fromEntries(choices.objection.map(x=>[x,criteria.objection+` Label: ${x}.`]))},
  {id:"risk",type:"score",criteria:["0 no meaningful risk","1 low","2 moderate","3 high","4 critical reputational/legal/trust risk"]},
  {id:"needs_human",type:"noul",criteria:"Should a human reviewer inspect this comment before any response or campaign decision?"},
  {id:"purchase_interest",type:"noul",criteria:"Does the comment contain a plausible signal of buying/demo/pricing interest?"},
  {id:"misinformation_risk",type:"noul",criteria:"Does the comment make or amplify a factual claim that should be verified before responding?"},
 ];
 const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({state,model:MODEL,questions}),signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw new Error(`Jev ${r.status}`);const data=await r.json();const a:Record<string,Answer>={};for(const x of data?.answers||[])if(x?.id)a[x.id]=x;return {result:parse(a,c),usage:data?.usage};
}
function preview(c:Required<Pick<Input,"id"|"platform"|"text">>&Input){
 const t=c.text.toLowerCase();
 const hit=(xs:string[])=>xs.some(x=>t.includes(x));
 const hostile=hit(["humo","estafa","mentira","basura","ridículo","ridiculo","fraude"]);const skeptic=hostile||hit(["prueba","datos","según quién","segun quien","benchmark","no creo","demuestren"]);const praise=hit(["me gusta","excelente","genial","interesante"]);const buy=hit(["precio","cuánto cuesta","cuanto cuesta","demo","comprar","cotización","cotizacion","me interesa"]);const privacy=hit(["datos","privacidad","comparten"]);const claim=hit(["mejor","garantiza","siempre","nunca","resultados"]);const question=t.includes("?");
 let objection="none";if(privacy)objection="privacy";else if(hit(["precio","caro"]))objection="price";else if(skeptic)objection="credibility";else if(claim)objection="claim";
 let intent="other";if(buy)intent="purchase_interest";else if(hostile)intent="attack";else if(question)intent="question";else if(praise)intent="praise";else if(objection!=="none")intent="objection";
 const riskScore=Math.min(4,(hostile?2.3:0)+(skeptic?.8:0)+(privacy?.8:0)+(claim?.5:0));const needsHuman=Math.min(.95,.15+riskScore*.19);return {...c,stance:hostile?"hostile":skeptic?"skeptical":praise?"supportive":"neutral",intent,objection,riskScore,needsHuman,purchaseInterest:buy?.78:.12,misinformationRisk:claim?.65:.12,confidence:.58};
}
async function pool<T,R>(xs:T[],limit:number,fn:(x:T)=>Promise<R>){const out=new Array<R>(xs.length);let i=0;async function worker(){while(true){const j=i++;if(j>=xs.length)return;out[j]=await fn(xs[j]);}}await Promise.all(Array.from({length:Math.min(limit,xs.length)},worker));return out;}
export async function POST(req:NextRequest){
 try{const raw=await req.text();if(raw.length>160000)return NextResponse.json({ok:false,warning:"Payload demasiado grande"},{status:413});const body=JSON.parse(raw||"{}");const comments:Input[]=Array.isArray(body?.comments)?body.comments.slice(0,24):[];const clean=comments.map((x,i)=>({id:safe(x?.id,160)||`c-${i}`,platform:safe(x?.platform,50).toLowerCase()||"manual",text:safe(x?.text,2800),author:safe(x?.author,160)||undefined,url:url(x?.url),likes:Number.isFinite(Number(x?.likes))?Number(x?.likes):undefined})).filter(x=>x.text) as (Required<Pick<Input,"id"|"platform"|"text">>&Input)[];
 if(!clean.length)return NextResponse.json({ok:false,warning:"No hay comentarios válidos"},{status:400});
 if(!key)return NextResponse.json({ok:true,provider:"preview-heuristic",model:"deterministic-v1",results:clean.map(preview),warning:"Configura TYPESAFE_API_KEY para usar Jev real."});
 let fallback=false;let tokens=0;const rows=await pool(clean,4,async c=>{try{const x=await jev(c,body?.campaign);tokens+=Number(x.usage?.input_tokens||0);return x.result}catch{fallback=true;return preview(c)}});return NextResponse.json({ok:true,provider:fallback?"jev+safe-fallback":"jev",model:MODEL,usage:{input_tokens:tokens},results:rows,warning:fallback?"Alguna evaluación Jev falló y fue marcada con fallback determinista.":undefined});
 }catch(e){return NextResponse.json({ok:false,warning:e instanceof Error?e.message:"Solicitud inválida"},{status:400});}
}
