import source from "@/data/shop-personal-merged.json";
import {savedAuditedTitle} from "@/lib/detail-name-index";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {excludedCatalogueListing} from "@/lib/catalogue-editorial-exclusions";
import {withoutEmoji} from "@/lib/emoji-free";

export type PersonalShopProduct={
 id:string;name:string;category:string;gender:"women"|"men"|"unisex";imageUrl:string;
 originalUrl:string;priceGBP:number|null;priceUSD:number|null;priceCNY:number|null;
 source:string;
};
const accepted=new Set(["Bags","Shoes","Sunglasses","Clothing","Accessories","Watches","Jewellery"]);
const parsed=source as PersonalShopProduct[];

const seenLinks=new Set<string>();
const seenImages=new Set<string>();
const filtered:PersonalShopProduct[]=[];
for(const p of parsed){
 const originalUrl=normalizeMarketplaceLink(p.originalUrl);
 if(!originalUrl||excludedCatalogueListing(originalUrl,p.name)||!accepted.has(p.category)||!p.name.trim()||
    !p.imageUrl||!(p.imageUrl.startsWith("https://")||p.imageUrl.startsWith("/shop-for-yourself-images/"))||
    seenLinks.has(originalUrl)||seenImages.has(p.imageUrl))continue;
 seenLinks.add(originalUrl);
 seenImages.add(p.imageUrl);
 filtered.push({...p,name:savedAuditedTitle("personal",p.id,originalUrl,p.imageUrl)||withoutEmoji(p.name).replace(/\s+/g," ").trim(),originalUrl});
}
export const personalShopProducts:ReadonlyArray<PersonalShopProduct>=filtered;
export const findPersonalProduct=(id:string)=>personalShopProducts.find(p=>p.id===id);

/** The Women’s Edit is accessories-led; clothing is a Men’s Edit-only category.
 * Sportswear is omitted from the personal catalogue completely.
 * Keep original data untouched so nothing is destructively deleted.
 */
export const audienceProducts=(audience:"men"|"women")=>personalShopProducts.filter(p=>
 (p.gender===audience||p.gender==="unisex") &&
 (audience!=="women"||p.category!=="Clothing")
);

export const productPrice=(p:PersonalShopProduct):string=>{
 if(p.priceGBP!==null&&p.priceGBP>0)return "£"+p.priceGBP.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceUSD!==null&&p.priceUSD>0)return "$"+p.priceUSD.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceCNY!==null&&p.priceCNY>0)return "¥"+p.priceCNY.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 return "See source price";
};
