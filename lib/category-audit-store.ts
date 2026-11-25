import "server-only";
import {get} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {PRIMARY_CATEGORIES,type PrimaryCategory} from "./product-taxonomy";
export const AUDIT_PREFIX="catalogue/category-audit/2026-11-25/";
const cached=unstable_cache(async()=>{const out:Record<string,PrimaryCategory>={};if(!process.env.BLOB_READ_WRITE_TOKEN)return out;await Promise.all([0,1,2,3].map(async i=>{try{const b=await get(AUDIT_PREFIX+i+".json",{access:"private"});if(!b||b.statusCode!==200||!b.stream)return;const x=JSON.parse(await new Response(b.stream).text());for(const [id,cat] of Object.entries(x.overrides||{})){if(typeof cat==="string"&&PRIMARY_CATEGORIES.some(c=>c===cat))out[id]=cat as PrimaryCategory;}}catch{}}));return out;},["category-audit-20261125-v1"],{revalidate:60,tags:["herocon-category-audit"]});
export async function categoryAuditOverrides(){try{return await cached();}catch{return {};}}
