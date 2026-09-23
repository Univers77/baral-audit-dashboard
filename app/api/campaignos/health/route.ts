import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){const model=process.env.TYPESAFE_JEV_MODEL||"jev-latest";return NextResponse.json({ok:true,mode:process.env.TYPESAFE_API_KEY?"jev":"preview",model,humanApprovalRequired:true,socialCredentialsServerSide:false});}
