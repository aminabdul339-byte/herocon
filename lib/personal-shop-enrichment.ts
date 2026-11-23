import "server-only";
import {createHash} from "node:crypto";
import {savedPartnerSnapshotHashes} from "@/lib/catalogue-priority";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {savedOpenCliSnapshotHashes,getOpenCliSnapshot} from "@/lib/opencli-snapshots";
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
 const [partnerKeys,openKeys]=await Promise.all([
  savedPartnerSnapshotHashes().catch(()=>new Set<string>()),
  savedOpenCliSnapshotHashes()
 ]);
 if(!partnerKeys.size&&!openKeys.size)return [...products];
 const result:EnrichedPersonalProduct[]=[];
 for(let i=0;i<products.length;i+=6){
  const batch=await Promise.all(products.slice(i,i+6).map(async product=>{
   const link=canonical(product.originalUrl);
   if(!link)return product;
   const partner=partnerKeys.has(hash(link));
   const browser=openKeys.has(hash(link));
   if(!partner&&!browser)return product;
   const [source,observation]=await Promise.all([
    partner?getSavedPersonalSource(link):Promise.resolve(null),
    browser?getOpenCliSnapshot(link):Promise.resolve(null)
   ]);
   if(!source&&!observation)return product;
   const photos=[...new Set([
    ...(source?.images||[]),
    ...(source?.variants.map(v=>v.image).filter((u):u is string=>Boolean(u))||[]),
    ...(observation?.images||[])
   ])].filter(u=>/^https:\/\//.test(u)).slice(0,12);
   return {...product,savedDetails:{
    photos,sellerName:source?.sellerName||observation?.sellerName||null,
    variantCount:source?.variants.length||0,
    savedAt:source?.snapshotSavedAt||observation?.collectedAt||null,
    kind:source?"partner" as const:"marketplace" as const
   }};
  }));
  result.push(...batch);
 }
 return result;
}
