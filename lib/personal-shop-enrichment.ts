import "server-only";
import {createHash} from "node:crypto";
import {savedPartnerSnapshotHashes} from "@/lib/catalogue-priority";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {getSavedMarketplaceSource,savedMarketplaceSourceHashes,marketplaceSourceHash} from "@/lib/marketplace-source-enrichment";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {BuckydropProduct} from "@/lib/buckydrop";
import type {PersonalShopProduct} from "@/lib/personal-shop";

export type PersonalSavedDetails={
 photos:string[];
 sellerName:string|null;
 variantCount:number;
 savedAt:string|null;kind:"partner"|"marketplace";
};
export type EnrichedPersonalProduct=PersonalShopProduct&{savedDetails?:PersonalSavedDetails};

const hash=(url:string)=>createHash("sha256").update(url).digest("hex");
function canonical(url:string):string|null{return normalizeMarketplaceLink(url);}

/** Reads ONLY previously saved private partner snapshots, never the paid
 * upstream product endpoint. No snapshot is written on public page requests. */
export async function getSavedPersonalSource(url:string):Promise<BuckydropProduct|null>{
 const link=canonical(url);
 if(!link||!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{return await getSavedBuckydropProduct(link);}
 catch(error){
  console.warn("[personal-shop] Existing supplier record could not be read:",error instanceof Error?error.name:"unknown");
  return null;
 }
}

/** Hydrate only the current visible page; check the shared snapshot index first
 * so that listings lacking supplier details generate zero per-product GETs. */
export async function enrichPersonalCards(products:ReadonlyArray<PersonalShopProduct>):Promise<EnrichedPersonalProduct[]>{
 if(!products.length||!process.env.BLOB_READ_WRITE_TOKEN)return [...products];
 const [partnerKeys,sourceKeys]=await Promise.all([
  savedPartnerSnapshotHashes().catch(()=>new Set<string>()),
  savedMarketplaceSourceHashes()
 ]);
 if(!partnerKeys.size&&!sourceKeys.size)return [...products];
 const result:EnrichedPersonalProduct[]=[];
 for(let i=0;i<products.length;i+=6){
  const batch=await Promise.all(products.slice(i,i+6).map(async product=>{
   const link=canonical(product.originalUrl);
   if(!link)return product;
   const hasPartner=partnerKeys.has(hash(link));
   const sourceKey=marketplaceSourceHash(link);
   const hasSource=Boolean(sourceKey&&sourceKeys.has(sourceKey));
   if(!hasPartner&&!hasSource)return product;
   const [partner,source]=await Promise.all([
    hasPartner?getSavedPersonalSource(link):Promise.resolve(null),
    hasSource?getSavedMarketplaceSource(link):Promise.resolve(null)
   ]);
   if(!partner&&!source)return product;
   const photos=[...new Set([
    ...(source?.images||[]),...(partner?.images||[]),
    ...(partner?.variants.map(v=>v.image).filter((u):u is string=>Boolean(u))||[])
   ])].filter(u=>/^https:\/\//.test(u)).slice(0,12);
   return {...product,savedDetails:{
    photos,sellerName:source?.sellerName||partner?.sellerName||null,
    variantCount:source?.variants.length||partner?.variants.length||0,
    savedAt:source?.retrievedAt||partner?.snapshotSavedAt||null,
    kind:source?"marketplace" as const:"partner" as const
   }};
  }));
  result.push(...batch);
 }
 return result;
}
