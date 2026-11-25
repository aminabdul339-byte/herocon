import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {savedDomesticFreight} from "@/lib/saved-domestic-freight";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function POST(req:Request){if(!await currentCustomer()||!accountOriginValid(req))return reply({error:"Sign in required"},403);
 try{const raw=await req.text();if(raw.length>30000)return reply({error:"Request too large"},413);const d=JSON.parse(raw);if(!Array.isArray(d.urls)||d.urls.length>30)return reply({error:"Maximum 30 product links"},400);
 const urls=[...new Set<string>(d.urls.map(normalizeMarketplaceLink).filter((x:unknown):x is string=>typeof x==="string"))];const result:Record<string,number|null>={};
 for(let i=0;i<urls.length;i+=5){await Promise.all(urls.slice(i,i+5).map(async url=>{result[url]=await savedDomesticFreight(url);}));}return reply({freight:result});}catch{return reply({error:"Saved freight unavailable"},503);}}
