import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){const model=process.env.TYPESAFE_JEV_MODEL||"jev-latest";const localOnly=process.env.VERCEL==="1";return NextResponse.json({ok:true,mode:localOnly?"local-only":process.env.TYPESAFE_API_KEY?"jev":"preview",model,humanApprovalRequired:true,socialCredentialsServerSide:false});}
