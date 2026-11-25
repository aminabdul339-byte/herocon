import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {auditFreightBatch} from "@/lib/domestic-freight-audit";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function POST(req:Request){if(!isOwnerPremiumCustomer(await currentCustomer())||!accountOriginValid(req))return reply({error:"Owner access required."},403);try{const raw=await req.text();if(raw.length>300)return reply({error:"Request too large"},413);const {offset}=JSON.parse(raw);if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)return reply({error:"Invalid offset"},400);return reply(await auditFreightBatch(offset));}catch{return reply({error:"Saved freight audit unavailable. Retry the same batch."},503);}}
