import {auditSavedFreight} from "@/lib/domestic-freight-audit";
import {validFreight} from "@/lib/cart-pricing";
import {NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {list,put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {productId,cleanTitle} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getBuckydropBulkStatus} from "@/lib/buckydrop-bulk";
import {getSavedBuckydropProduct,BUCKYDROP_PREFIX_V1,BUCKYDROP_PREFIX_V2} from "@/lib/buckydrop-cache";
import {getSavedMarketplaceSource,toDisplaySupplierDetails,ENRICHMENT_PREFIX_V1,ENRICHMENT_PREFIX_V2} from "@/lib/marketplace-source-enrichment";
import {classifyProduct} from "@/lib/product-taxonomy";
import {unavailableSourceHashes} from "@/lib/catalogue-unavailable";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
const PREFIX="catalogue/full-quality-audit/v1/";
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
const positive=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>0;
const validImage=(s:unknown):s is string=>typeof s==="string"&&(/^https:\/\/[^\s]+$/i.test(s)||/^\/shop-for-yourself-images\//.test(s));
const placeholder=(s:string)=>!s.trim()||/^(product|product details|marketplace product|unknown|untitled)$/i.test(s.trim());
const titleReview=(s:string)=>placeholder(s)||/\b(?:for|with|and|of|the)\s*$/i.test(s)||/[\u3400-\u9fff]/.test(s);
type Entry={collection:"business"|"personal";id:string;title:string;category:string;url:string|null;images:string[];price:boolean;seller:string;description:string;importedOptions:number};
type Summary={listings:number;withSnapshot:number;withPhoto:number;withPrice:number;withSeller:number;withDescription:number;withOptions:number;issueCounts:Record<string,number>;categories:Record<string,number>};
const makeSummary=():Summary=>({listings:0,withSnapshot:0,withPhoto:0,withPrice:0,withSeller:0,withDescription:0,withOptions:0,issueCounts:{},categories:{}});
async function index(prefixes:string[]){
 const result=new Set<string>();
 for(const prefix of prefixes){
  let cursor:string|undefined;
  do{const page=await list({prefix,limit:1000,cursor});for(const blob of page.blobs){const key=blob.pathname.slice(prefix.length).replace(/\.json$/,"");if(/^[0-9a-f]{64}$/.test(key))result.add(key);}if(!page.hasMore)break;cursor=page.cursor;}while(cursor);
 }return result;
}
function personalCategory(c:string){
 if(["Tops","Bottoms","Dresses","Outerwear","Underwear & Lingerie","Sleepwear & Loungewear"].includes(c))return "Clothing";
 if(["Fashion Accessories","Hair Accessories"].includes(c))return "Accessories";
 return c;
}
export async function GET(req:Request,{params}:{params:Promise<{shard:string}>}){
 const secret=process.env.CRON_SECRET||"",a=Buffer.from(req.headers.get("authorization")||""),b=Buffer.from("Bearer "+secret);
 if(secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))return reply({error:"unauthorized"},401);
 const day=new Date().toISOString().slice(0,10);
 if(process.env.VERCEL_ENV!=="production"||!["2026-11-25","2026-11-26"].includes(day))return reply({error:"not_eligible"},403);
 const shard=Number((await params).shard);if(!Number.isInteger(shard)||shard<0||shard>3)return reply({error:"invalid_shard"},400);
 const started=Date.now();
 try{
  const progress=await getBuckydropBulkStatus();
  if(progress.activeShards||progress.eligibleNow){
   const result={status:"deferred_for_enrichment",shard,eligible:progress.eligibleNow,active:progress.activeShards,cooldown:progress.cooldownReason};
   console.info("[herocon-full-catalogue-audit]",result);return reply(result,409);
  }
  const [business,hidden,hio,bucky,rejected]=await Promise.all([
   getProducts(),unavailableSourceHashes(),index([ENRICHMENT_PREFIX_V1,ENRICHMENT_PREFIX_V2]),index([BUCKYDROP_PREFIX_V1,BUCKYDROP_PREFIX_V2]),index(["catalogue/buckydrop-bulk/v1/unavailable/"])
  ]);
  const entries:Entry[]=[
   ...business.map(p=>({collection:"business" as const,id:productId(p),title:cleanTitle(p),category:p.category||"Other",url:normalizeMarketplaceLink(p.originalMarketplaceUrl),images:[p.imageUrl||"",...(p.images||[])],price:positive(p.priceGBP)||positive(p.priceCNY),seller:p.sellerName||"",description:p.descriptionText||"",importedOptions:p.variants?.length||0})),
   ...personalShopProducts.map(p=>({collection:"personal" as const,id:p.id,title:p.name,category:p.category,url:normalizeMarketplaceLink(p.originalUrl),images:[p.imageUrl],price:positive(p.priceGBP)||positive(p.priceCNY)||positive(p.priceUSD),seller:"",description:"",importedOptions:0}))
  ];
  const groups=new Map<string,Entry[]>();
  for(const [i,e] of entries.entries()){const key=e.url?hash(e.url):hash(e.collection+":"+e.id+":"+i);const g=groups.get(key)||[];g.push(e);groups.set(key,g);}
  const idCounts=new Map<string,number>();
  for(const e of entries){const k=e.collection+":"+e.id;idCounts.set(k,(idCounts.get(k)||0)+1);}
  const selected=[...groups.entries()].filter(([k])=>Number.parseInt(k.slice(0,8),16)%4===shard);
  const summary={shard,day,totalSources:selected.length,scannedSources:0,withDomesticFreight:0,withoutDomesticFreight:0,totalListings:selected.reduce((n,[,g])=>n+g.length,0),scannedListings:0,sharedSources:0,duplicateWithinCollection:0,missingSources:0,unreadableSources:0,sourceProviderCounts:{} as Record<string,number>,business:makeSummary(),personal:makeSummary(),enrichment:{known:progress.totalKnown,saved:progress.totalSaved,pending:progress.pending,permanent:progress.permanentlyUnavailable,attemptedToday:progress.attemptedToday},complete:false,updatedAt:""};
  const review:{collection:string;id:string;title:string;category:string;url:string|null;provider:string;flags:string[];photos:number;variants:number;pricedVariants:number;supplierTitle:string;hidden:boolean}[]=[];
  for(let i=0;i<selected.length&&Date.now()-started<345000;i+=12){
   await Promise.all(selected.slice(i,i+12).map(async ([key,g])=>{
    const url=g[0].url,hasH=hio.has(key),hasB=bucky.has(key);
    const [h,b]=url?await Promise.all([hasH?getSavedMarketplaceSource(url):Promise.resolve(null),hasB?getSavedBuckydropProduct(url).catch(()=>null):Promise.resolve(null)]):[null,null];
    const d=h?toDisplaySupplierDetails(h):b;
    if(url){const freight=await auditSavedFreight(url,h?.chinaDomesticFreight,b?.chinaDomesticFreight);if(validFreight(freight.amountCny))summary.withDomesticFreight++;else summary.withoutDomesticFreight++;}
    const provider=d?(h?h.provider:"buckydrop"):"none";
    summary.scannedSources++;summary.sourceProviderCounts[provider]=(summary.sourceProviderCounts[provider]||0)+1;
    if(!d){summary.missingSources++;if(hasH||hasB)summary.unreadableSources++;}
    const shared=g.some(e=>e.collection==="business")&&g.some(e=>e.collection==="personal");
    if(shared)summary.sharedSources++;
    const counts={business:g.filter(e=>e.collection==="business").length,personal:g.filter(e=>e.collection==="personal").length};
    if(counts.business>1||counts.personal>1)summary.duplicateWithinCollection++;
    const variants=d?.variants||[],sku=variants.map(v=>v.skuCode),priced=variants.filter(v=>positive(v.price)).length;
    const supplierPhotos=[...new Set([...(d?.images||[]),...variants.map(v=>v.image)].filter(validImage))];
    const supplierPrice=positive(d?.offerPrice)||positive(d?.listPrice)||priced>0;
    const supplierTitle=d?.title||"";
    const sourceFlags:string[]=[];
    if(!d)sourceFlags.push(hasH||hasB?"snapshot_unreadable":rejected.has(key)?"provider_unavailable":"snapshot_missing");
    if((hasH&&!h)||(hasB&&!b))sourceFlags.push("provider_snapshot_unreadable");
    if(d){
     if(!supplierPhotos.length)sourceFlags.push("supplier_gallery_missing");
     if(!supplierPrice)sourceFlags.push("supplier_price_missing_or_nonpositive");
     if(!d.sellerName?.trim())sourceFlags.push("supplier_seller_missing");
     if(!d.descriptionText?.trim()&&!d.detailImages?.length)sourceFlags.push("supplier_description_missing");
     if(!variants.length)sourceFlags.push("no_recorded_supplier_options_review");
     if(variants.length&&priced<variants.length)sourceFlags.push("some_variant_prices_missing_or_nonpositive");
     if(sku.some(s=>!s?.trim())||new Set(sku).size!==sku.length)sourceFlags.push("invalid_or_duplicate_sku");
     if(variants.some(v=>typeof v.stock==="number"&&(!Number.isFinite(v.stock)||v.stock<0)))sourceFlags.push("invalid_variant_stock");
     if(variants.some(v=>!v.title?.trim()&&!v.options?.length))sourceFlags.push("missing_variant_labels");
     if(h&&(h.variantCompleteness==="missing_ids"||h.variantCompleteness==="unavailable"||(typeof h.variantCount==="number"&&h.variantCount>variants.length)))sourceFlags.push("supplier_variant_completeness_review");
     if(placeholder(supplierTitle))sourceFlags.push("supplier_title_placeholder");
     if((d.images||[]).some(s=>!validImage(s))||variants.some(v=>v.image&&!validImage(v.image)))sourceFlags.push("invalid_supplier_image_url");
    }
    for(const e of g){
     const s=summary[e.collection],flags=[...sourceFlags],photos=new Set([...e.images,...supplierPhotos].filter(validImage)).size;
     const isHidden=hidden.has(key);
     s.listings++;summary.scannedListings++;s.categories[e.category]=(s.categories[e.category]||0)+1;
     if(d)s.withSnapshot++;
     if(photos)s.withPhoto++;else flags.push("display_gallery_missing");
     if(e.price||supplierPrice)s.withPrice++;else flags.push("display_price_missing");
     if(e.seller.trim()||d?.sellerName?.trim())s.withSeller++;else flags.push("display_seller_missing");
     if(e.description.trim()||d?.descriptionText?.trim()||d?.detailImages?.length)s.withDescription++;else flags.push("display_description_missing");
     if(variants.length||e.importedOptions)s.withOptions++;
     if(!e.url)flags.push("invalid_source_link");
     if(!e.id||(idCounts.get(e.collection+":"+e.id)||0)>1)flags.push("missing_or_duplicate_listing_id");
     if(counts[e.collection]>1)flags.push("duplicate_source_within_collection");
     if(isHidden)flags.push("confirmed_unavailable_hidden");
     if(titleReview(e.title))flags.push("display_title_review");
     if(e.category==="Other"||!e.category)flags.push("category_unclear");
     if(supplierTitle&&!placeholder(supplierTitle)){
      const suggested=classifyProduct(supplierTitle);
      const mapped=e.collection==="personal"?personalCategory(suggested):suggested;
      if(suggested!=="Other"&&e.category!=="Flowers & Gifts"&&mapped!==e.category&&!(e.category==="Sunglasses"&&mapped==="Accessories"))flags.push("supplier_title_category_review");
     }
     for(const flag of new Set(flags))s.issueCounts[flag]=(s.issueCounts[flag]||0)+1;
     if(flags.length)review.push({collection:e.collection,id:e.id,title:e.title,category:e.category,url:e.url,provider,flags:[...new Set(flags)],photos,variants:variants.length,pricedVariants:priced,supplierTitle,hidden:isHidden});
    }
   }));
  }
  summary.complete=summary.scannedSources===summary.totalSources;
  summary.updatedAt=new Date().toISOString();
  await put(PREFIX+day+"/"+shard+".json",JSON.stringify({summary,review}),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
  console.info("[herocon-full-catalogue-audit]",summary);
  return reply(summary,summary.complete?200:206);
 }catch(e){console.error("[herocon-full-catalogue-audit-error]",{shard,issue:e instanceof Error?e.name:"unknown"});return reply({error:"audit_failed",shard},503);}
}
