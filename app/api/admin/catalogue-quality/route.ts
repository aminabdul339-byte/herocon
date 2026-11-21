import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {getProducts} from "@/lib/catalogue-server";
import {prioritizeSavedPartnerProducts} from "@/lib/catalogue-priority";
import {marketplaceIdentity} from "@/lib/catalogue-identity";
import type {Product} from "@/lib/types";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

function authorized(request:Request):boolean{
 const expected=process.env.HEROCON_CATALOGUE_IMPORT_KEY||"";
 const received=request.headers.get("x-herocon-catalogue-admin")||"";
 if(expected.length<48||expected.length!==received.length)return false;
 return timingSafeEqual(Buffer.from(expected),Buffer.from(received));
}
type Row={
 id:string;title:string;category:string;marketplace:string;sourceProductId:string;
 originalMarketplaceUrl:string;priceGBP:number|null;priceCNY:number|null;
 sellerName:string|null;photoCount:number;variantCount:number;
 hasSupplierSnapshot:boolean;hasDescription:boolean;collectedAt:string;
 images:string[];variants:Product["variants"];sourceSpecs:Product["sourceSpecs"]
};
function toRow(p:Product):Row{
 const identity=marketplaceIdentity(p.originalMarketplaceUrl);
 const images=[...new Set([p.imageUrl,...(p.images||[])].filter((s):s is string=>typeof s==="string"&&/^https:\/\/\S+$/.test(s)))];
 return {
  id:p.doppelProductId||p.canonicalId||"",
  title:p.originalTitle||p.title,
  category:p.category||"Other",
  marketplace:identity?.marketplace||"Unknown",
  sourceProductId:identity?.productId||"",
  originalMarketplaceUrl:identity?.url||"",
  priceGBP:typeof p.priceGBP==="number"&&Number.isFinite(p.priceGBP)?p.priceGBP:null,
  priceCNY:typeof p.priceCNY==="number"&&Number.isFinite(p.priceCNY)?p.priceCNY:null,
  sellerName:p.sellerName?.trim()||null,
  photoCount:images.length,
  variantCount:p.variantCount??p.variants?.length??0,
  hasSupplierSnapshot:Boolean(p.hasPartnerDetails),
  hasDescription:Boolean(p.descriptionText?.trim()),
  collectedAt:p.collectedAt||"",
  images,variants:p.variants,sourceSpecs:p.sourceSpecs
 };
}
function csvValue(value:unknown):string{
 let s=typeof value==="string"?value:value===null||value===undefined?"":String(value);
 s=s.replace(/[\u0000-\u001F\u007F]/g," ").slice(0,100000);
 if(/^\s*[=+@-]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function csv(rows:Row[]):string{
 const columns=[
  "id","title","category","marketplace","sourceProductId",
  "originalMarketplaceUrl","priceGBP","priceCNY","sellerName",
  "photoCount","variantCount","hasSupplierSnapshot","hasDescription",
  "collectedAt","images","variants","sourceSpecs"
 ] as const;
 const data=rows.map(row=>columns.map(key=>{
  const value=row[key];
  return csvValue(Array.isArray(value)?JSON.stringify(value):value);
 }).join(","));
 return "\uFEFF"+columns.join(",")+"\r\n"+data.join("\r\n")+"\r\n";
}
export async function GET(request:Request){
 if(!authorized(request))
  return NextResponse.json({ok:false,error:"Unauthorized"},{status:401,headers:HEADERS});
 let products:Product[];
 try{products=await prioritizeSavedPartnerProducts(await getProducts());}
 catch{
  return NextResponse.json({ok:false,error:"Catalogue temporarily unavailable"},{status:503,headers:HEADERS});
 }
 const rows=products.map(toRow);
 const format=new URL(request.url).searchParams.get("format");
 if(format==="csv")return new Response(csv(rows),{
   status:200,headers:{...HEADERS,"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":"attachment; filename=herocon-catalogue-audit.csv"}
 });
 const marketplaces:Record<string,number>={},categories:Record<string,number>={};
 for(const r of rows){
  marketplaces[r.marketplace]=(marketplaces[r.marketplace]||0)+1;
  categories[r.category]=(categories[r.category]||0)+1;
 }
 const stats={
  total:rows.length,
  withVerifiedMarketplaceLink:rows.filter(r=>r.originalMarketplaceUrl).length,
  withPrimaryPhoto:rows.filter(r=>r.photoCount>0).length,
  withMultiplePhotos:rows.filter(r=>r.photoCount>1).length,
  withGBPReferencePrice:rows.filter(r=>r.priceGBP!==null).length,
  withSellerName:rows.filter(r=>r.sellerName!==null).length,
  withRecordedOptions:rows.filter(r=>r.variantCount>0).length,
  withDescription:rows.filter(r=>r.hasDescription).length,
  withSavedSupplierSnapshot:rows.filter(r=>r.hasSupplierSnapshot).length
 };
 const categorySummary=Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0,20)
   .map(([name,count])=>({name,count}));
 // Limit the JSON payload; the complete, original-source audit is available
 // as a private CSV, never as an unauthenticated public endpoint.
 const review=rows.filter(r=>!r.sellerName||r.variantCount===0||r.photoCount<2)
   .slice(0,30).map(({id,title,category,marketplace,sourceProductId,
     originalMarketplaceUrl,priceGBP,sellerName,photoCount,variantCount,hasSupplierSnapshot})=>({
      id,title,category,marketplace,sourceProductId,originalMarketplaceUrl,
      priceGBP,sellerName,photoCount,variantCount,hasSupplierSnapshot
   }));
 return NextResponse.json({
  ok:true,stats,marketplaces,categorySummary,review,
  notice:"Coverage counts describe imported catalogue records. Saved supplier snapshots are counted separately; the dashboard does not make paid product lookups or refresh inventory."
 },{headers:HEADERS});
}
