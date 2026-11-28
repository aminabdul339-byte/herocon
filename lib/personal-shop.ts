import source from "@/data/shop-personal-merged.json";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
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
 if(!originalUrl||!accepted.has(p.category)||!p.name.trim()||
    !p.imageUrl||!(p.imageUrl.startsWith("https://")||p.imageUrl.startsWith("/shop-for-yourself-images/"))||
    seenLinks.has(originalUrl)||seenImages.has(p.imageUrl))continue;
 seenLinks.add(originalUrl);
 seenImages.add(p.imageUrl);
 filtered.push({...p,name:withoutEmoji(p.name).replace(/\s+/g," ").trim(),originalUrl});
}
export const personalShopProducts:ReadonlyArray<PersonalShopProduct>=filtered;
export const findPersonalProduct=(id:string)=>personalShopProducts.find(p=>p.id===id);

/** Keep the earlier curated Women's Edit exclusions for legacy clothing,
 * while allowing the approved Taobao fashion imports in both edits.
 */
export const audienceProducts=(audience:"men"|"women")=>personalShopProducts.filter(p=>
 (p.gender===audience||p.gender==="unisex") &&
 (audience!=="women"||p.category!=="Clothing"||p.source.startsWith("taobao-fashion-"))
);

export const productPrice=(p:PersonalShopProduct):string=>{
 if(p.priceGBP!==null&&p.priceGBP>0)return "£"+p.priceGBP.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceUSD!==null&&p.priceUSD>0)return "$"+p.priceUSD.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceCNY!==null&&p.priceCNY>0)return "¥"+p.priceCNY.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 return "See source price";
};
