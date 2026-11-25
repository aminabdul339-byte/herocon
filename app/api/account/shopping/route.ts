import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {readShoppingAccount,updateTestAccount} from "@/lib/shopping-account-store";
import type {TestAction} from "@/lib/shopping-account-model";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function GET(req:Request){const u=await currentCustomer();if(!u)return reply({error:"Sign in to view your account."},401);const mode=new URL(req.url).searchParams.get("test")==="1"?"test":"live";if(mode==="test"&&!isOwnerPremiumCustomer(u))return reply({error:"Owner access required."},403);try{return reply({account:await readShoppingAccount(u.id,mode)});}catch{return reply({error:"Account records temporarily unavailable."},503);}}
export async function POST(req:Request){const u=await currentCustomer();if(!u||!isOwnerPremiumCustomer(u)||!accountOriginValid(req))return reply({error:"Owner access required."},403);
 try{const raw=await req.text();if(raw.length>10000)return reply({error:"Request too large."},413);const d=JSON.parse(raw);if(!Number.isSafeInteger(d.revision)||d.revision<0||typeof d.actionId!=="string"||!/^[a-f0-9-]{36}$/i.test(d.actionId)||!d.action||typeof d.action.type!=="string")return reply({error:"Invalid test action."},400);const a=d.action as TestAction;if(a.type==="pack"){if(!Array.isArray(a.ids)||!a.ids.every(id=>typeof id==="string"&&id.length<=100))return reply({error:"Invalid selection."},400);a.id="HC-TEST-P-"+d.actionId;}else if(typeof a.id!=="string"||a.id.length>100)return reply({error:"Invalid reference."},400);return reply({account:await updateTestAccount(u.id,d.revision,a,d.actionId)});}catch(e){return reply({error:e instanceof Error?e.message:"Test update failed."},409);}}
