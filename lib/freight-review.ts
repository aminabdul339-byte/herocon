import "server-only";
import {createHash} from "node:crypto";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {productId,cleanTitle} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {unavailableSourceHashes} from "@/lib/catalogue-unavailable";
import {missingFreightHashes} from "@/lib/domestic-freight-audit";
import {classifyFreight,type FreightClass} from "@/lib/freight-classification";
export type FreightReviewRow={url:string;title:string;category:string;path:string;image:string;classification:FreightClass};
const hash=(url:string)=>createHash("sha256").update(url).digest("hex");
export async function freightReviewRows(){
 const [products,missing,hidden]=await Promise.all([getProducts(),missingFreightHashes(),unavailableSourceHashes()]);
 const rows=new Map<string,FreightReviewRow>();
 function add(raw:unknown,title:string,category:string,path:string,image:string,classificationTitle=title){
  const url=normalizeMarketplaceLink(raw);if(!url||hidden.has(hash(url))||!missing.has(hash(url)))return;
  const classification=classifyFreight(classificationTitle,category);
  const existing=rows.get(url);
  // Conflicting listing classifications are resolved conservatively.
  if(existing){if(classification==="bulky"||existing.classification==="bulky")existing.classification="bulky";else if(classification!==existing.classification)existing.classification="review";return;}
  rows.set(url,{url,title,category,path,image,classification});
 }
 for(const p of products)add(p.originalMarketplaceUrl,cleanTitle(p),p.category||"Other","/product/"+encodeURIComponent(productId(p)),p.imageUrl||"",[p.title,p.originalTitle].filter(Boolean).join(" "));
 for(const p of personalShopProducts)add(p.originalUrl,p.name,p.category,"/shop-for-yourself/"+encodeURIComponent(p.id),p.imageUrl);
 return [...rows.values()].sort((a,b)=>a.title.localeCompare(b.title));
}
