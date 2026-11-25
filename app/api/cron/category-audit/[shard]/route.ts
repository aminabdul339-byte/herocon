import {NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {put} from "@vercel/blob";
import {revalidateTag} from "next/cache";
import {getProducts} from "@/lib/catalogue-server";
import {getAllEnrichedSourceHashes} from "@/lib/buckydrop-bulk";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {getSavedMarketplaceSource} from "@/lib/marketplace-source-enrichment";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {classifyProduct,resolveCategory,type PrimaryCategory} from "@/lib/product-taxonomy";
import {CATEGORY_OVERRIDES} from "@/lib/category-overrides";
import {AUDIT_PREFIX} from "@/lib/category-audit-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(req:Request,{params}:{params:Promise<{shard:string}>}){
 const secret=process.env.CRON_SECRET||"",a=Buffer.from(req.headers.get("authorization")||""),b=Buffer.from("Bearer "+secret);
 if(secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))return reply({error:"unauthorized"},401);
 if(process.env.VERCEL_ENV!=="production"||new Date().toISOString().slice(0,10)!=="2026-11-25")return reply({error:"not_eligible"},403);
 const shard=Number((await params).shard);if(!Number.isInteger(shard)||shard<0||shard>3)return reply({error:"invalid_shard"},400);
 const start=Date.now();
 try{
 const [all,index]=await Promise.all([getProducts(),getAllEnrichedSourceHashes()]);
 const rows=all.map(p=>({p,url:normalizeMarketplaceLink(p.originalMarketplaceUrl)})).filter(x=>x.url&&Number.parseInt(hash(x.url).slice(0,8),16)%4===shard);
 const overrides:Record<string,PrimaryCategory>={};const review:{id:string;title:string;category:string;supplierTitle:string;suggested:string;image:string;reason:string}[]=[];
 let scanned=0,withSnapshot=0,withPhotos=0,changed=0,missing=0;
 for(let i=0;i<rows.length&&Date.now()-start<350_000;i+=12){
  await Promise.all(rows.slice(i,i+12).map(async ({p,url})=>{
   scanned++;if(!url)return;const id=p.doppelProductId||p.canonicalId||"";if(!id)return;
   let supplierTitle="",specs:{name:string;value:string}[]=[],images:string[]=[];
   if(index.has(hash(url))){
    const h=await getSavedMarketplaceSource(url).catch(()=>null);
    if(h){supplierTitle=h.title||"";specs=h.sourceSpecs;images=h.images;withSnapshot++;}
    else{const b=await getSavedBuckydropProduct(url).catch(()=>null);if(b){supplierTitle=b.title;specs=b.productProps||[];images=b.images;withSnapshot++;}else missing++;}
   }else missing++;
   if(images.length||p.imageUrl)withPhotos++;
   const current=p.category||"Other";
   if(CATEGORY_OVERRIDES[id]||current==="Flowers & Gifts")return;
   // Use saved structured product-type/category attributes, not full marketing
   // descriptions which frequently mention accessories and complementary goods.
   const explicit=[...new Set(specs.filter(s=>/^(?:product\s*(?:type|category|name)|item\s*type|category|品类|商品类别|产品类型|商品名称|类别)$/i.test(s.name.trim())&&s.value.length<=100).map(s=>resolveCategory(s.value)||classifyProduct(s.value)).filter(c=>c!=="Other"))];
   const titleCat=classifyProduct(supplierTitle);
   const explicitCat=explicit.length===1?explicit[0]:null;
   const suggested=explicitCat||titleCat;
   // Automatic changes only when type and supplier title agree, or when an
   // otherwise unclassified record has unambiguous saved title evidence.
   if(suggested!=="Other"&&suggested!==current&&((explicitCat&&explicitCat===titleCat)||(current==="Other"&&(!explicitCat||titleCat==="Other"||explicitCat===titleCat)))){
    overrides[id]=suggested;changed++;return;
   }
   if(current==="Other"||(suggested!=="Other"&&suggested!==current)||explicit.length>1)review.push({id,title:p.title,category:current,supplierTitle,suggested, image:images[0]||p.imageUrl||"",reason:current==="Other"?"unclear_product_type":"conflicting_supplier_evidence"});
  }));
  if(i%120===0)console.info("[herocon-category-audit-progress]",{shard,scanned,total:rows.length,changed,review:review.length});
 }
 const summary={shard,total:rows.length,scanned,withSnapshot,withPhotos,changed,missing,needsVisualReview:review.length,complete:scanned===rows.length,updatedAt:new Date().toISOString()};
 await put(AUDIT_PREFIX+shard+".json",JSON.stringify({summary,overrides,review}),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
 revalidateTag("herocon-category-audit");
 console.info("[herocon-category-audit]",summary);return reply(summary);
 }catch(e){console.error("[herocon-category-audit-error]",{shard,issue:e instanceof Error?e.name:"unknown"});return reply({error:"audit_failed"},503);}
}
