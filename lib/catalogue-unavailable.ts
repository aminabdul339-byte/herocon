import "server-only";
import {createHash} from "node:crypto";
import {get,list} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
const REJECTED="catalogue/buckydrop-bulk/v1/unavailable/";
const SOURCES=["catalogue/buckydrop-snapshots/v1/","catalogue/buckydrop-snapshots/v2/","catalogue/source-enrichment/v1/","catalogue/source-enrichment/v2/"];
async function paths(prefix:string){const result:string[]=[];let cursor:string|undefined;do{const page=await list({prefix,limit:1000,cursor});result.push(...page.blobs.map(b=>b.pathname));if(!page.hasMore)break;cursor=page.cursor;}while(cursor);return result;}
const extract=(p:string)=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"");
const cached=unstable_cache(async()=>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return [] as string[];
 // Never hide a product with a saved detail record from either provider.
 // Only the explicit permanent NOT_FOUND marker qualifies; a timeout,
 // balance error, unsupported channel, empty result or unknown code does not.
 const [rejected,...sources]=await Promise.all([paths(REJECTED),...SOURCES.map(paths)]);
 const saved=new Set(sources.flat().map(extract));const missing:string[]=[];
 const candidates=rejected.filter(p=>/^[a-f0-9]{64}$/.test(extract(p))&&!saved.has(extract(p)));
 for(let i=0;i<candidates.length;i+=12){
  const found=await Promise.all(candidates.slice(i,i+12).map(async p=>{
   try{const b=await get(p,{access:"private"});if(!b||b.statusCode!==200||!b.stream)return null;const data=JSON.parse(await new Response(b.stream).text());return data.code==="NOT_FOUND"?extract(p):null;}catch{return null;}
  }));
  for(const h of found)if(h)missing.push(h);
 }
 return missing;
},["herocon-confirmed-not-found-v1"],{revalidate:300});
export async function unavailableSourceHashes():Promise<Set<string>>{try{return new Set(await cached());}catch{return new Set();}}
export function isUnavailableSource(url:unknown,hashes:ReadonlySet<string>){const link=normalizeMarketplaceLink(url);return !!link&&hashes.has(createHash("sha256").update(link).digest("hex"));}
