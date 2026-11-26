import "server-only";
import {createHash} from "node:crypto";
import {list} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {cache} from "react";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
const REJECTED="catalogue/buckydrop-bulk/v1/unavailable/";
const SOURCES=["catalogue/buckydrop-snapshots/v1/","catalogue/buckydrop-snapshots/v2/","catalogue/source-enrichment/v1/","catalogue/source-enrichment/v2/"];
async function paths(prefix:string){const result:string[]=[];let cursor:string|undefined;do{const page=await list({prefix,limit:1000,cursor});result.push(...page.blobs.map(b=>b.pathname));if(!page.hasMore)break;cursor=page.cursor;}while(cursor);return result;}
const extract=(p:string)=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"");
const cached=unstable_cache(async()=>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return [] as string[];
 // Permanent markers are written only for NOT_FOUND, INVALID_SOURCE or EMPTY_PRODUCT.
 // Preserve any listing with a saved snapshot from either provider.
 const [rejected,...sources]=await Promise.all([paths(REJECTED),...SOURCES.map(paths)]);
 const saved=new Set(sources.flat().map(extract));
 return [...new Set(rejected.map(extract).filter(h=>/^[a-f0-9]{64}$/.test(h)&&!saved.has(h)))];

},["herocon-permanent-exclusions-v2"],{revalidate:300});
export const unavailableSourceHashes=cache(async():Promise<Set<string>>=>{try{return new Set(await cached());}catch{return new Set();}});
export function isUnavailableSource(url:unknown,hashes:ReadonlySet<string>){const link=normalizeMarketplaceLink(url);return !!link&&hashes.has(createHash("sha256").update(link).digest("hex"));}
